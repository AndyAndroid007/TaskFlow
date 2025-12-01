const userRepository = require("../repositories/user.repository");
const ApiError = require("../exceptions/ApiError");
const mongoose = require("mongoose")

const getAllUsers = async () => {
    return await userRepository.findAll();
}

const getUserById = async(id) => {
    if(!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid User ID format");
    }
    const user = await userRepository.findById(id);
    if (!user) {
        throw new ApiError(404, "User Not Found");
    }
    return user;
}

const createUser = async (userData) => {
    return await userRepository.create(userData);
}

module.exports = {getAllUsers, getUserById, createUser};