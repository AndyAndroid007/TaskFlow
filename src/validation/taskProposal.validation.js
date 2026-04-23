const Joi = require('joi');

const taskProposalSchema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
    status: Joi.string().valid('Open', 'In Progress', 'In Review', 'Completed').default('Open'),
    dueDate: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string().trim().max(30)).max(10).default([]),
    assignee: Joi.string().optional(),
});

module.exports = taskProposalSchema;
