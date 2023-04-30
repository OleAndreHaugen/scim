function UserSchema(req, user) {
    let Resource = {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:User", "urn:neptune:User"],
        meta: {
            created: user.createdAt,
            location: `${req.protocol}://${req.get("host")}/api/serverscript/scim/Users/${user.id}`,
            lastModified: user.updatedAt,
            resourceType: "User",
        },
        name: {
            formatted: user.name,
        },
        active: user.locked ? false : true,
        id: user.id,
        userName: user.username,

        preferredLanguage: user.language,
        emails: [],
        groups: [],
        phoneNumbers: [],
        "urn:neptune:User": {
            idpSource: user.idpSource,
        },
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
                $ref: `${req.protocol}://${req.get("host")}/api/serverscript/scim/Groups/${
                    department.id
                }`,
            });
        });
    }

    return Resource;
}

function UserFields() {
    return [
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
        "mobile",
        "idpSource",
    ];
}

function GroupSchema(req, group) {
    let Resource = {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
        meta: {
            created: group.createdAt,
            location: `${req.protocol}://${req.get("host")}/api/serverscript/scim/Groups/${
                group.id
            }`,
            lastModified: group.updatedAt,
            resourceType: "Group",
        },
        id: group.id,
        displayName: group.name,
        members: [],
    };

    // Members
    if (group.users) {
        group.users.forEach(function (user) {
            Resource.members.push({
                display: user.username,
                value: user.id,
                $ref: `${req.protocol}://${req.get("host")}/api/serverscript/scim/Users/${user.id}`,
            });
        });
    }

    return Resource;
}

complete({
    UserSchema,
    UserFields,
    GroupSchema,
});
