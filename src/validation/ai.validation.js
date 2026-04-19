const Joi = require('joi');

const chatSchema = Joi.object({
    message: Joi.string().trim().min(1).max(1000).required(),
});

const confirmTaskSchema = Joi.object({
    confirmed: Joi.boolean().required(),
});

module.exports = {
    chatSchema,
    confirmTaskSchema,
};
