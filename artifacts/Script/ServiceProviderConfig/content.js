const config = {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    documentationUri: "",
    patch: {
        supported: true,
    },
    bulk: {
        supported: false,
        maxOperations: 0,
        maxPayloadSize: 0,
    },
    filter: {
        supported: false,
        maxResults: 1000,
    },
    changePassword: {
        supported: false,
    },
    sort: {
        supported: true,
    },
    etag: {
        supported: false,
    },
    authenticationSchemes: [
        {
            name: "HTTP Basic",
            description: "Authentication scheme using the HTTP Basic Standard",
            specUri: "http://www.rfc-editor.org/info/rfc2617",
            documentationUri: "",
            type: "httpbasic",
        },
        {
            name: "HTTP Bearer Token",
            description: "Authentication scheme using the HTTP Bearer token",
            specUri: "http://www.rfc-editor.org/info/rfc2617",
            documentationUri: "",
            type: "httpbasic",
        },
    ],
    meta: {
        location: `${req.protocol}://${req.hostname}:${req.socket.localPort}/api/serverscript/scim/ServiceProviderConfig`,
        resourceType: "ServiceProviderConfig",
        version: "1.0",
    },
};

result.data = config;
complete();
