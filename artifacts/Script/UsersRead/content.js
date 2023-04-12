const { Like, Any, IsNull } = operators;

const manager = modules.typeorm.getConnection().manager;

let mode = "List";
let where = {};
let Resources = [];

let options = {
    select: globals.Utils.UserFields(),
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
if (req?.params?.id) {
    where.id = req.params.id;
    mode = "Get";
}

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

// Build Resources
userData.forEach(function (user) {
    Resources.push(globals.Utils.UserSchema(req, user));
});

// Response
const ListResponse = {
    startIndex: parseInt(options.skip),
    totalResults: userCount,
    itemsPerPage: parseInt(options.take),
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    Resources: Resources,
};

if (mode === "Get") {
    if (!Resources.length) {
        result.data = "No user found";
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
