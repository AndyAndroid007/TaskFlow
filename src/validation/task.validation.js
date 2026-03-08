const Joi = require("joi");
const createTaskSchema = Joi.object({
    title: Joi.string().min(5).max(20).required(),
    description: Joi.string().max(255),
    completed: Joi.string().required(),
    priority: Joi.number().min(1).required(),
    dueDate: Joi.date().required(),
    tags: Joi.array().items(Joi.string()),
    assignee: Joi.string().required(),
});

module.exports = {createTaskSchema};