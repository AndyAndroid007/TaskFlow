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

const getTaskStats = async (userId) => {
    const mongoose = require('mongoose');
    return await Task.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $facet: {
                byStatus: [ { $group: { _id: "$status", count: { $sum: 1 } } } ],
                byPriority: [ { $group: { _id: "$priority", count: { $sum: 1 } } } ],
                totalTasks: [ { $count: "total" } ]
            }
        }
    ]);
};

module.exports = {getTaskByUser, getTaskById, createTask, updateTask, deleteTask, getTaskStats};