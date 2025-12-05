const mongoose = require("mongoose");
const ApiError = require("../exceptions/ApiError");
const taskRepo = require("../repositories/task.repository");

const createTask = async (userId, data) => {
    return await taskRepo.createTask(...data, userId);
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
        throw new ApiError(403, "Not Allowed");
    }
    return task;
};

const getTasksByUser = async (userId) => {
    return await taskRepo.getTaskByUser(userId);
}

const updateTask = async (userId, taskId, updatedData) => {
    const task = await getTaskById(userId, taskId);
    return await taskRepo.updateTask(taskId, updatedData);
}

const deleteTask = async (userId, taskId) => {
    const task = getTaskById(userId, taskId);
    return await taskRepo.deleteTask(taskId);
} 

module.exports = {createTask, updateTask, deleteTask, getTaskById, getTasksByUser};