const userRepository = require("../repositories/user.repository");
const ApiError = require("../exceptions/ApiError");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
        throw new ApiError(409, "Email is already associated with an existing user.");
    }
    const hashpass = await bcrypt.hash(userData.password, 10);
    userData.password = hashpass;
    return await userRepository.create(userData);
}

module.exports = {getAllUsers, getUserById, createUser};