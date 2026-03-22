const Users = require("../models/user.model");

const findAll = async () => {
    return await Users.find();
};

const findByEmail = async(email) => {
    return await Users.findOne({email});
};

const findByProvider = async(provider, providerId) => {
    return await Users.findOne({provider, providerId})
}

const findById = async(id) => {
    return await Users.findById(id);
};

const create = async (userData) => {
    const newUser = new Users(userData);
    return await newUser.save();
};

module.exports = {findAll, findById, create, findByEmail, findByProvider};