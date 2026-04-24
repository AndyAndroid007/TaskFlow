const Joi = require('joi');

const chatSchema = Joi.object({
    message: Joi.string().trim().min(1).max(1000).required(),
});

const confirmTaskSchema = Joi.object({
    confirmed: Joi.boolean().required(),
    updatedData: Joi.object({
        title: Joi.string().min(1).max(200),
        description: Joi.string().allow(''),
        priority: Joi.string().valid('Low', 'Medium', 'High'),
        status: Joi.string().valid('Open', 'In Progress', 'In Review', 'Completed'),
        dueDate: Joi.date().iso().allow(null),
        assignee: Joi.string().allow(null, ''),
        tags: Joi.array().items(Joi.string().trim().max(30))
    }).allow(null).optional()
});

module.exports = {
    chatSchema,
    confirmTaskSchema,
};
