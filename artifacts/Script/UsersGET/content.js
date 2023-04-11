const { Like, Any, IsNull } = operators;

const manager = modules.typeorm.getConnection().manager;

let where = {};
let Resources = [];

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
    order: {},
    skip: 0,
    take: 1000,
};

// SortBy
if (req?.query?.sortBy) {
    let sortOrder = req?.query?.sortOrder === "descending" ? "DESC" : "ASC";
    options.order[req.query.sortBy] = sortOrder;
} else {
    options.order["username"] = "ASC";
}

// Select By ID
// if (req?.params?.id) {
//     where.id = req.params.id;
// }

// Pagination
if (req.query.startIndex) options.skip = req.query.startIndex;
if (req.query.count) options.take = req.query.count;

// TODO: more filters
options.where = where;

// Count User(s)
const userCount = await manager.count("users", options);

// Relations
options.relations = ["departments"];

// Get User(s)
const userData = await manager.find("users", options);

const mode = userData.length > 1 ? "List" : "User";

// Build Resources
userData.forEach(function (user) {
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

    Resources.push(Resource);
});

// Response
const schemaUsers = {
    startIndex: parseInt(options.skip),
    totalResults: userCount,
    itemsPerPage: parseInt(options.take),
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    Resources: Resources,
};

if (mode === "User") {
    result.data = Resources[0];
} else {
    result.data = schemaUsers;
}

result.contentType = "application/scim+json";
complete();
