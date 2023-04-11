const config = {
    totalResults: 2,
    itemsPerPage: 1000,
    startIndex: 0,
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    Resources: [
        {
            id: "urn:ietf:params:scim:schemas:core:2.0:User",
            schema: "urn:ietf:params:scim:schemas:core:2.0:User",
            name: "User",
            description: "Resource type for Users",
            endpoint: "/Users",
            meta: {
                location: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/Users`,
                resourceType: "ResourceType",
            },
        },
        {
            id: "urn:ietf:params:scim:schemas:core:2.0:Group",
            schema: "urn:ietf:params:scim:schemas:core:2.0:Group",
            name: "Group",
            description: "Resource type for Groups",
            endpoint: "/Groups",
            meta: {
                location: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/Groups`,
                resourceType: "ResourceType",
            },
        },
    ],
    meta: {
        location: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/ResourceTypes`,
        resourceType: "ListResponse",
        version: "1.0",
    },
};

result.data = config;
complete();
