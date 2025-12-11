const Task = require("../models/task.model");

const getTaskByUser = async (userId) => {
    return await Task.find({userId});
};

const getTaskById = async(taskId) => {
    return await Task.findById(taskId);
};

const updateTask = async(id, updatedData) => {
    return await Task.findByIdAndUpdate(id, updatedData, {new: true});
};

const createTask = async (taskData) => {
    return await Task.create(taskData);
};

const deleteTask = async (id) => {
    return await Task.findByIdAndDelete(id);
}

module.exports = {getTaskByUser, getTaskById, createTask, updateTask, deleteTask};