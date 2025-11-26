const Users = require("../models/user.model");

const findAll = async () => {
    return await Users.find();
};

const findById = async(id) => {
    return await Users.findById(id);
};

const create = async (userData) => {
    const newUser = new Users(userData);
    return await newUser.save();
};

module.exports = {findAll, findById, create};