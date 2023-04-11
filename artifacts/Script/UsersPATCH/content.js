const manager = modules.typeorm.getConnection().manager;

let options = {
    select: [
        "id",
        "updatedAt",
        "changedBy",
        "createdAt",
        "createdBy",
        "email",
        "language",
        "lastLogin",
        "locked",
        "name",
        "phone",
        "username",
    ],
    relations: ["departments"],
    where: {
        id: req.params.id,
    },
};

// Find First
let userExists = await manager.findOne("users", options);

if (!userExists) {
    result.data = "No user found";
    result.statusCode = 404;
    return complete();
}

// Merge Data
if (req.body?.active === false) userExists.locked = true;
if (req.body?.active === true) userExists.locked = false;

if (req.body?.name?.formatted) userExists.name = req.body?.name?.formatted;

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
const user = await manager.save("users", userExists);

let Resource = {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    meta: {
        created: user.createdAt,
        location: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/users/${user.id}`,
        lastModified: user.updatedAt,
        resourceType: "User",
    },
    name: {
        formatted: user.name,
    },
    active: user.locked ? false : true,
    id: user.id,
    userName: user.username,
    emails: [],
    groups: [],
    phoneNumbers: [],
};

// eMail
if (user.email) {
    Resource.emails.push({
        type: "work",
        value: user.email,
        primary: true,
    });
}

// Phone
if (user.phone) {
    Resource.phoneNumbers.push({
        type: "work",
        value: user.phone,
    });
}

// Mobile
if (user.mobile) {
    Resource.phoneNumbers.push({
        type: "mobile",
        value: user.mobile,
    });
}

// Groups
if (user.departments) {
    user.departments.forEach(function (department) {
        Resource.groups.push({
            display: department.name,
            value: department.id,
            $ref: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/groups/${department.id}`,
        });
    });
}

result.data = Resource;
complete();
