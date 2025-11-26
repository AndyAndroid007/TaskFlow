const userRepository = require("../repositories/user.repository");

const getAllUsers = async () => {
    return await userRepository.findAll();
}

const getUserById = async(id) => {
    return await userRepository.findById(id);
}

const createUser = async (userData) => {
    return await userRepository.create(userData);
}

module.exports = {getAllUsers, getUserById, createUser};