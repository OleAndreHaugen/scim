const { Like, Any, IsNull } = operators;

const manager = p9.manager ? p9.manager : modules.typeorm.getConnection().manager;

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
        case "displayName":
            filterField = "name";
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


// TODO more filters
options.where = where;

// Count User(s)
const groupCount = await manager.count("department", options);

options.relations = ["users"];

// Get User(s)
const groupData = await manager.find("department", options);

// Build Resources
for (i = 0; i < groupData.length; i++) {
    const group = groupData[i];
    Resources.push(await globals.Utils.GroupSchema(req, group));
}

// Response
const ListResponse = {
    startIndex: parseInt(options.skip + 1),
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
