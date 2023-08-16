const { LessThan } = operators;

// Initialize typeorm. Remember to include typeorm module in the script context
const manager = modules.typeorm.getConnection().manager;

// Get the current date and time
const hoursBack = 4;
const currentDate = new Date();
const pastDate = new Date(currentDate.getTime() - hoursBack * 60 * 60 * 1000);

await manager.delete("locking", { createdAt: LessThan(pastDate) });
complete();
