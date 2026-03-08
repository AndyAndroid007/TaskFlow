const mongoose = require("mongoose");
const ApiError = require("../exceptions/ApiError");
const taskRepo = require("../repositories/task.repository");
const logger = require("../utils/logger");

const createTask = async (userId, data) => {
    const task = await taskRepo.createTask({ ...data, userId });
    logger.debug('Task created', { taskId: task._id, userId });
    return task;
};

const getTaskById = async (userId, taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid Task ID");
    }
    const task = await taskRepo.getTaskById(taskId);
    if (!task) {
        throw new ApiError(404, "Task Not Found!");
    }
    if (task.userId.toString() !== userId) {
        logger.warn('Unauthorized task access attempt', { taskId, requestingUser: userId, taskOwner: task.userId });
        throw new ApiError(403, "Not Allowed");
    }
    return task;
};

const getTasksByUser = async (userId) => {
    return await taskRepo.getTaskByUser(userId);
}

const updateTask = async (userId, taskId, updatedData) => {
    const task = await getTaskById(userId, taskId);
    const updated = await taskRepo.updateTask(taskId, updatedData);
    logger.debug('Task updated', { taskId, userId });
    return updated;
}

const deleteTask = async (userId, taskId) => {
    const task = await getTaskById(userId, taskId);
    await taskRepo.deleteTask(taskId);
    logger.debug('Task deleted', { taskId, userId });
}

module.exports = { createTask, updateTask, deleteTask, getTaskById, getTasksByUser };