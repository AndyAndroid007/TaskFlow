const userService = require('../services/user.service')

const getUsers = async (req,res,next) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch(err)
    {
        next(err);
    }
};

const getUserById = async (req,res,next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json(user);
    } catch (err) {
        next(err);
    }
};

const createUser = async (req,res,next) => {
    try {
        const newUser = await userService.createUser(req.body);
        res.status(201).json(newUser);
    } catch(err) {
        next(err);
    }
};

module.exports = {getUsers, getUserById, createUser};