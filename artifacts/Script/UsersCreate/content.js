const manager = modules.typeorm.getConnection().manager;

let options = {
    select: globals.Utils.UserFields(),
    relations: ["departments"],
};

let userCreate = {};

// Merge Data
if (req.body?.active === false) userCreate.locked = true;
if (req.body?.active === true) userCreate.locked = false;

if (req.body?.name?.formatted) userCreate.name = req.body.name.formatted;
if (req.body?.userName) userCreate.username = req.body.userName;

if (req.body?.preferredLanguage) {
    userCreate.language = req.body.preferredLanguage;
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

// Neptune Schema
if (req.body["urn:neptune:User"] && req.body["urn:neptune:User"].idpSource) {
    userCreate.idpSource = req.body["urn:neptune:User"].idpSource;
} else {
    result.data = {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
        detail:
            'Error while executing API script: UsersCreate: null value in column "idpSource" of relation "users" violates not-null constraint',
        status: "400",
    };
    result.contentType = "application/scim+json";
    result.statusCode = 400;
    return complete();
}

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

result.data = await globals.Utils.UserSchema(req, user);
result.contentType = "application/scim+json";
result.statusCode = 201;

complete();
