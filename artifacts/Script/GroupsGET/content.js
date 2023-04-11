const { Like, Any, IsNull } = operators;

const manager = modules.typeorm.getConnection().manager;

let where = {};
let Resources = [];

let options = {
    select: ["id", "updatedAt", "changedBy", "createdAt", "createdBy", "name"],
    order: {},
    skip: 0,
    take: 1000,
};

// SortBy
if (req?.query?.sortBy) {
    let sortOrder = req?.query?.sortOrder === "descending" ? "DESC" : "ASC";
    options.order[req.query.sortBy] = sortOrder;
} else {
    options.order["name"] = "ASC";
}

// Select By ID
// if (req?.params?.id) {
//     where.id = req.params.id;
// }

// Pagination
if (req.query.startIndex) options.skip = req.query.startIndex;
if (req.query.count) options.take = req.query.count;

// Todo more filters
options.where = where;

// Count User(s)
const groupCount = await manager.count("department", options);

options.relations = ["users"];

// Get User(s)
const groupData = await manager.find("department", options);

// Build Resources
groupData.forEach(function (group) {
    let Resource = {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
        meta: {
            created: group.createdAt,
            location: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/groups/${group.id}`,
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
                display: user.name,
                value: user.id,
                $ref: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/users/${user.id}`,
            });
        });
    }

    Resources.push(Resource);
});

// Response
const schema = {
    startIndex: parseInt(options.skip),
    totalResults: groupCount,
    itemsPerPage: parseInt(options.take),
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    Resources: Resources,
};

if (Resources.length === 1) {
    result.data = Resources[0];
} else {
    result.data = schema;
}

result.contentType = "application/scim+json";
complete();
