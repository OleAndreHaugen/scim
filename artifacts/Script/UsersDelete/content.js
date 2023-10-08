const manager = p9.manager ? p9.manager : modules.typeorm.getConnection().manager;

// Find First
const userExists = await manager.findOne("users", req.params.id);

if (!userExists) {
    result.data = "No user found";
    result.statusCode = 404;
    return complete();
}

// Delete User
const userDeleted = await manager.delete("users", req.params.id);

// Audit Log
await manager.save("audit_log", {
    content: JSON.stringify(userExists),
    objectType: "User",
    objectKey: userExists.id,
    action: "Delete",
    createdAt: new Date(),
    updatedAt: new Date(),
    changedBy: "scim",
});

result.data = "";
result.statusCode = 204;

complete();
