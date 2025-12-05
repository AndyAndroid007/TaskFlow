const Task = require("../models/task.model");

const getTaskByUser = async (userId) => {
    return await Task.find({userId});
};

const getTaskById = async(taskId) => {
    return await Task.findById(taskId);
};

const updateTask = async(id, updatedData) => {
    return await Task.findByIdAndUpdate(id, updatedData, {new: True});
};

const createTask = async (taskData) => {
    return await Task.create(data);
};

const deleteTask = async (id) => {
    return await Task.findByIdAndDelete(id);
}

module.exports = {getTaskByUser, getTaskById, createTask, updateTask, deleteTask};