const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    logger.error(err.message, {
        statusCode: err.statusCode || 500,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        correlationId: req.correlationId,
    });

    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
};