const manager = p9.manager ? p9.manager : modules.typeorm.getConnection().manager;

let options = {
    relations: ["users"],
    where: {
        id: req.params.id,
    },
};

// Find First
let groupExists = await manager.findOne("department", options);

if (!groupExists) {
    result.data = "No group found";
    result.statusCode = 404;
    return complete();
}

// Merge Data
if (req.body?.displayName) groupExists.name = req.body?.displayName;

groupExists.updatedAt = new Date();
groupExists.changedBy = "scim";

if (!groupExists.users) groupExists.users = [];

// Operations
if (req.body?.Operations) {
    for (iOp = 0; iOp < req.body.Operations.length; iOp++) {
        const Operation = req.body.Operations[iOp];

        switch (Operation.op) {
            case "add":
                for (i = 0; i < Operation.value.length; i++) {
                    const member = Operation.value[i];
                    const user = await manager.findOne("users", { where: { id: member.value } });

                    if (user) {
                        const groupUserExist = groupExists.users.find(
                            (group) => group.id === user.id
                        );

                        if (!groupUserExist) groupExists.users.push(user);
                    }
                }
                break;

            case "remove":
                for (i = 0; i < Operation.value.length; i++) {
                    const member = Operation.value[i];
                    groupExists.users = groupExists.users.filter(
                        (user) => user.id !== member.value
                    );
                }
                break;

            default:
                break;
        }
    }
}

// Update User
const group = await manager.save("department", groupExists);

// Audit Log
await manager.save("audit_log", {
    content: JSON.stringify(groupExists),
    objectType: "Department",
    objectKey: groupExists.id,
    action: "Save",
    createdAt: new Date(),
    updatedAt: new Date(),
    changedBy: "scim",
});

result.data = await globals.Utils.GroupSchema(req, group);
result.contentType = "application/scim+json";

complete();
