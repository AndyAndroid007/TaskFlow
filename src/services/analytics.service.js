const taskRepo = require('../repositories/task.repository');
const userService = require("./user.service");

const getSummaryByUserId = async (userId) => {
    const user = await userService.getUserById(userId);

    const summary = await taskRepo.getTaskStats(user.id);

    const {byStatus, byPriority, totalTasks} = summary[0] || {};

    return {
        TotalTasks: totalTasks?.[0]?.total ?? 0,
        OpenTasks: byStatus?.find(item => item._id === "Open")?.count ?? 0,
        CompletedTasks: byStatus?.find(item => item._id ===  "Completed")?.count ?? 0,
        HighPriorityTasks: byPriority?.find(item => item._id === "High")?.count ?? 0,  
        LowPriorityTasks: byPriority?.find(item => item._id === "Low")?.count ?? 0, 
    }
}

module.exports = {getSummaryByUserId};

