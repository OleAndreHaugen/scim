const manager = p9.manager ? p9.manager : modules.typeorm.getConnection().manager;
const queryRunner = manager.connection.createQueryRunner();

let options = {
    select: globals.Utils.UserFields(),
    relations: ["departments"],
    where: {
        id: req.params.id,
    },
};

// Find First
try {
    await queryRunner.connect();
    await queryRunner.startTransaction("SERIALIZABLE");

    let userExists = await queryRunner.manager.findOne("users", options);

    if (!userExists) {
        result.data = "No user found";
        result.statusCode = 404;
        return complete();
    }

    // Merge Data
    if (req.body?.active === false) userExists.locked = true;
    if (req.body?.active === true) userExists.locked = false;

    if (req.body?.name?.formatted) userExists.name = req.body.name.formatted;
    if (req.body?.preferredLanguage) userExists.language = req.body.preferredLanguage;

    if (req.body?.emails && req.body?.emails[0]) userExists.email = req.body.emails[0].value;

    if (req.body?.phoneNumbers) {
        req.body?.phoneNumbers.forEach(function (phoneNumber) {
            switch (phoneNumber.type) {
                case "work":
                    userExists.phone = phoneNumber.value;
                    break;

                case "mobile":
                    userExists.mobile = phoneNumber.value;
                    break;

                default:
                    break;
            }
        });
    }

    userExists.updatedAt = new Date();
    userExists.changedBy = "scim";

    // Update User
    await queryRunner.manager.save("users", userExists);
    await queryRunner.commitTransaction();
    await queryRunner.release();
} catch (e) {
    await rollbackAndRelease(queryRunner);
}

// Get Updated User
const user = await manager.findOne("users", options);

// Audit Log
await manager.save("audit_log", {
    content: JSON.stringify(user),
    objectType: "User",
    objectKey: user.id,
    objectName: user.name,
    action: "Save",
    createdAt: new Date(),
    updatedAt: new Date(),
    changedBy: "scim",
});

result.data = await globals.Utils.UserSchema(req, user);
result.contentType = "application/scim+json";

complete();

async function rollbackAndRelease(queryRunner) {
    try {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
    } catch (e) {
        await queryRunner.release();
    }
}
