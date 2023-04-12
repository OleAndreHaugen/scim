const manager = modules.typeorm.getConnection().manager;

let options = {
    select: globals.Utils.UserFields(),
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

if (req.body?.name?.formatted) userExists.name = req.body.name.formatted;
if (req.body?.preferredLanguage) userExists.language = req.body.preferredLanguage;

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

result.data = globals.Utils.UserSchema(req, user);
result.contentType = "application/scim+json";

complete();

$.ajax({
    type: "GET",
    url:
        "http://localhost:8080/proxy/" +
        encodeURIComponent("https://p9new.neptune-software.com/api/serverscript/scim/users"),
    headers: {
        Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVkMWFhY2E3LTZiYjItNDdlNS1hYTRkLTE4YWFkMDZiZWNmNCIsInV1aWQiOiIwZjViNGJhMy1hMDkzLTQ2MzItYmU1Zi1mZGNlOTFhYWMwNTMiLCJpYXQiOjE2ODEyMzY3NzUsImV4cCI6MTc2NzU1MDM3NX0.CMT2Fr_6D4Ai_m1TF64EWDe2iWaSEk9x7q5lYhtmp2Q",
    },
    success: function (res) {
        console.log(res);
    },
    error: function (e, t) {},
});
