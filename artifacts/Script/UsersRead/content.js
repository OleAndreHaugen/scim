const { Like, Any, IsNull, Not } = operators;

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
if (req.query.startIndex) options.skip = req.query.startIndex - 1;
if (req.query.count) options.take = req.query.count;

// Filters
if (req?.query?.filter) {
    // For now only supporting 1 query
    let filter = req.query.filter.split(" ");
    let filterField = filter[0];
    let filterOperator = filter[1].toLowerCase();
    let filterValue = filter[2].replace(/"/g, "");

    // filterField
    switch (filterField) {
        case "preferredLanguage":
            filterField = "language";
            break;

        case "active":
            filterField = "locked";
            break;

        case "userName":
            filterField = "username";
            break;

        default:
            break;
    }

    // filterValue
    switch (filterValue) {
        case "true":
            if (filterField === "locked") {
                filterValue = false;
            } else {
                filterValue = true;
            }
            break;

        case "false":
            if (filterField === "locked") {
                filterValue = true;
            } else {
                filterValue = false;
            }
            break;

        default:
            break;
    }

    // filterOperator
    switch (filterOperator) {
        case "eq":
            where[filterField] = filterValue;
            break;

        case "ne":
            where[filterField] = Not(filterValue);
            break;

        default:
            break;
    }
}

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
    startIndex: parseInt(options.skip + 1),
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
