const jwt = require("jsonwebtoken");
const ApiError = require("../exceptions/ApiError");
const logger = require("../utils/logger");

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer")) {
            logger.warn('Auth failed — no token provided', {
                path: req.originalUrl,
                method: req.method,
                correlationId: req.correlationId,
            });
            throw new ApiError(401, "Unauthorized: No Token Provided");
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = { userId: decoded.userId };

        next();

    } catch (err) {
        if (err instanceof ApiError) throw err;
        logger.warn('Auth failed — invalid token', {
            path: req.originalUrl,
            method: req.method,
            correlationId: req.correlationId,
        });
        throw new ApiError(401, "Unauthorized: Invalid Token");
    }
};

module.exports = auth;