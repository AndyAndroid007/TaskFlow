const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom Morgan token for correlation ID
morgan.token('correlationId', (req) => req.correlationId || '-');

// Define the log format
const format = ':method :url :status :res[content-length] - :response-time ms - :correlationId';

// Stream Morgan output through Winston at 'http' level
const stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Skip logging in test environment
const skip = () => process.env.NODE_ENV === 'test';

const httpLogger = morgan(format, { stream, skip });

module.exports = httpLogger;
