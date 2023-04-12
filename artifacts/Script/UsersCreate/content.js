const manager = modules.typeorm.getConnection().manager;

let options = {
    select: globals.Utils.UserFields(),
    relations: ["departments"],
};

let userCreate = {};

// Merge Data
if (req.body?.idpSource) userCreate.idpSource = req.body.idpSource;

if (req.body?.active === false) userCreate.locked = true;
if (req.body?.active === true) userCreate.locked = false;

if (req.body?.name?.formatted) userCreate.name = req.body.name.formatted;
if (req.body?.userName) userCreate.username = req.body.userName;

if (req.body?.language) {
    userCreate.language = req.body.language;
} else {
    userCreate.language = "EN";
}

if (req.body?.emails && req.body?.emails[0]) userCreate.email = req.body.emails[0].value;

if (req.body?.phoneNumbers) {
    req.body?.phoneNumbers.forEach(function (phoneNumber) {
        switch (phoneNumber.type) {
            case "work":
                userCreate.phone = phoneNumber.value;
                break;

            case "mobile":
                userCreate.mobile = phoneNumber.value;
                break;

            default:
                break;
        }
    });
}

userCreate.createdAt = new Date();
userCreate.updatedAt = new Date();
userCreate.changedBy = "scim";
userCreate.createdBy = "scim";

// Create User
const createRec = await manager.save("users", userCreate);

// Departments
if (req.body?.groups) {
    for (i = 0; i < req.body.groups.length; i++) {
        const group = req.body.groups[i];
        const groupExisting = await manager.findOne("department", { where: { id: group.value } });

        if (groupExisting) {
            if (!groupExisting.users) groupExisting.users = [];
            groupExisting.users.push(createRec);
            await manager.save("department", groupExisting);
        }
    }
}

// Add id to where statement
options.where = { id: createRec.id };

// Get User
const user = await manager.findOne("users", options);

result.data = globals.Utils.UserSchema(req, user);
result.contentType = "application/scim+json";
result.statusCode = 201;

complete();
