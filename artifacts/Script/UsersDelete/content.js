const manager = p9.manager ? p9.manager : modules.typeorm.getConnection().manager;

// Find First
const userExists = await manager.findOne("users", { where: { id: req.params.id } });

if (!userExists) {
    result.data = "No user found";
    result.statusCode = 404;
    return complete();
}

// Delete User
const userDeleted = await manager.delete("users", { id: req.params.id });

// Audit Log
await manager.save("audit_log", {
    content: JSON.stringify(userExists),
    objectType: "User",
    objectKey: userExists.id,
    objectName: userExists.name,
    action: "Delete",
    createdAt: new Date(),
    updatedAt: new Date(),
    changedBy: "scim",
});

result.data = "";
result.statusCode = 204;

complete();
