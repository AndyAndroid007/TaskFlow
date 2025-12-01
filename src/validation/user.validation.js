const Joi = require("joi");
const createUserSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email:Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
});

module.exports = {createUserSchema};