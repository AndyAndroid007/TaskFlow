const jwt = require("jsonwebtoken");
const ApiError = require("../exceptions/ApiError");

const auth  = (req,res,next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer")) {
            throw new ApiError(401, "Unauthorized: No Token Provided");
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {userId: decoded.userId};

        next();

    } catch (err) {
        throw new ApiError(401, "Unauthorized: Invalid Token");
    }
};

module.exports = auth;