const Joi = require("joi");

const loginschema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(50).required()
});

const registerSchema = Joi.object({
    name: Joi.string().optional().allow(''),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(50).required()
});

module.exports = {loginschema, registerSchema};