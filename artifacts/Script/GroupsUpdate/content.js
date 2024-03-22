const manager = p9.manager ? p9.manager : modules.typeorm.getConnection().manager;

const groupId = req.params.id;

async function executeGroupUpdate() {
    try {
        // Operations
        if (req.body?.Operations) {
            for (const operation of req.body.Operations) {
                switch (operation.op) {
                    case "add":
                        for (const member of operation.value) {
                            const user = await manager.findOne("users", {
                                relations: ["departments"],
                                where: { id: member.value },
                                select: {
                                    id: true,
                                    departments: {
                                        id: true,
                                    },
                                },
                            });

                            if (!user) {
                                log.error(`User with id '${member.value}' does not exist`);
                                continue;
                            }

                            const isGroupAssigned = user.departments.find(
                                (dep) => dep.id === groupId
                            );
                            if (!isGroupAssigned) {
                                user.departments.push({
                                    id: groupId,
                                });

                                await manager.save("users", user);
                            }
                        }

                        break;

                    case "remove":
                        for (const member of operation.value) {
                            const user = await manager.findOne("users", {
                                relations: ["departments"],
                                where: { id: member.value },
                                select: {
                                    id: true,
                                    departments: {
                                        id: true,
                                    },
                                },
                            });

                            if (!user) {
                                log.error(`User with id '${member.value}' does not exist`);
                                continue;
                            }

                            const isGroupAssigned = user.departments.find(
                                (dep) => dep.id === groupId
                            );

                            if (isGroupAssigned) {
                                user.departments = user.departments.filter(
                                    (dep) => dep.id !== groupId
                                );
                                await manager.save("users", user);
                            }
                        }
                        break;

                    default:
                        break;
                }
            }
        }
    } catch (e) {
        return e;
    }
}

const error = await executeGroupUpdate();
if (error) {
    result.statusCode = 500;
    result.data = { message: error.message };
    return complete();
}

const group = await manager.findOne("department", {
    relations: ["users"],
    where: {
        id: groupId,
    },
    select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        users: {
            id: true,
            username: true,
        },
    },
});

if (!group) {
    result.statusCode = 404;
    result.data = { message: "Group not found" };
    return complete();
}

// Audit Log
await manager.save("audit_log", {
    content: JSON.stringify(group),
    objectType: "Department",
    objectKey: group.id,
    objectName: group.name,
    action: "Save",
    createdAt: new Date(),
    updatedAt: new Date(),
    changedBy: "scim",
});

result.data = await globals.Utils.GroupSchema(req, group);
result.contentType = "application/scim+json";

complete();
