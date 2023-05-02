const manager = modules.typeorm.getConnection().manager;

// Find First
const userExists = await manager.findOne("users", req.params.id);

if (!userExists) {
    result.data = "No user found";
    result.statusCode = 404;
    return complete();
}

// Delete User
const userDeleted = await manager.delete("users", req.params.id);

result.data = "";
result.statusCode = 204;

complete();

