const jwt = require("jsonwebtoken");
const ApiError = require("../exceptions/ApiError");
const userRepository = require("../repositories/user.repository");
const logger = require("../utils/logger");

const auth = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
        }
        else if (req.query.token) {
            token = req.query.token;
        }
        if (!token) {
            logger.warn('Auth failed — no token provided', {
                path: req.originalUrl,
                method: req.method,
                correlationId: req.correlationId,
            });
            throw new ApiError(401, "Unauthorized: No Token Provided");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userRepository.findById(decoded.userId);
        if(!user) {
            throw new ApiError(404, "User Not Found!");
        }

        req.user = user;

        return next();

    } catch (err) {
        if (err instanceof ApiError) return next(err);
        logger.warn('Auth failed — invalid token', {
            path: req.originalUrl,
            method: req.method,
            correlationId: req.correlationId,
        });
        return next(new ApiError(401, "Unauthorized: Invalid Token"));
    }
};

module.exports = auth;
