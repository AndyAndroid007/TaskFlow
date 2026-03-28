const taskService = require("../services/task.service");

const createTask = async (req,res,next) => {
    try {
        const task = await taskService.createTask(req.user.id, { ...req.body, correlationId: req.correlationId });
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
};

const getTasksByUser = async (req,res,next) => {
    try {
        const tasks = await taskService.getTasksByUser(req.user.id);
        res.status(200).json(tasks)
    } catch (err) {
        next(err);
    }
};

const getTaskById = async (req,res,next) => {
    try {
        const task = await taskService.getTaskById(req.user.id, req.params.id);
        res.status(200).json(task);
    } catch (err) {
        next(err);
    }
};

const updateTask = async (req,res,next) => {
    try {
        const taskUpdate = await taskService.updateTask(req.user.id, req.params.id, { ...req.body, correlationId: req.correlationId });
        res.json(taskUpdate);
    } catch (err) {
        next(err);
    }
};

const deleteTask = async (req,res,next) => {
    try {
        // We pass an object containing correlationId as the third parameter to deleteTask in service
        const taskDelete = await taskService.deleteTask(req.user.id, req.params.id, req.correlationId);
        res.json({message: "Task Deleted Successfully"});
    } catch (err) {
        next(err);
    }
};

module.exports = {createTask, getTasksByUser, getTaskById, updateTask, deleteTask};