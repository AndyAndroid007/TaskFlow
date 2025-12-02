const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ApiError = require("../exceptions/ApiError");
const userRepository = require("../repositories/user.repository");

const login = async ({email, password}) => {
    const user = await userRepository.findByEmail(email);

    if (!user) {
        throw new ApiError(401, "Incorrect Email or Password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(401, "Incorrect Email or Password");
    }

    const token = jwt.sign(
        {userId: user._id}, 
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN || "1h"}
    );

    return {
        token, 
        user: {
            _id: user._id,
            name: user.name,
            email: user.email
        }
    };
};

module.exports = {login};