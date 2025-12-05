const taskService = require("../services/task.service");

const createTask = async (req,res,next) => {
    try {
        const task = await taskService.createTask(req.user.userId, req.body);
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
};

const getTasksByUser = async (req,res,next) => {
    try {
        const tasks = await taskService.getTasksByUser(req.user.userId);
        res.status(200).json(tasks)
    } catch (err) {
        next(err);
    }
};

const getTaskById = async (req,res,next) => {
    try {
        const task = await taskService.getTaskById(req.user.userId, req.params.id);
        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
};

const updateTask = async (req,res,next) => {
    try {
        const taskUpdate = await taskService.updateTask(req.user.userId, req.params.id, req.body);
        res.json(taskUpdate);
    } catch (err) {
        next(err);
    }
};

const deleteTask = async (req,res,next) => {
    try {
        const taskDelete = await taskService.deleteTask(req.user.userId, req.params.id);
        res.json({message: "Task Deleted Successfully"});
    } catch (err) {
        next(err);
    }
};

module.exports = {createTask, getTasksByUser, getTaskById, updateTask, deleteTask};