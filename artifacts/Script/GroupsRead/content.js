const { Like, Any, IsNull } = operators;

const manager = modules.typeorm.getConnection().manager;

let mode = "List";
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
if (req?.params?.id) {
    where.id = req.params.id;
    mode = "Get";
}

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
    Resources.push(globals.Utils.GroupSchema(req, group));
});

// Response
const ListResponse = {
    startIndex: parseInt(options.skip),
    totalResults: groupCount,
    itemsPerPage: parseInt(options.take),
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    Resources: Resources,
};

if (mode === "Get") {
    if (!Resources.length) {
        result.data = "No group found";
        result.statusCode = 404;
    } else {
        result.data = Resources[0];
        result.contentType = "application/scim+json";
    }
} else {
    result.data = ListResponse;
    result.contentType = "application/scim+json";
}

complete();
