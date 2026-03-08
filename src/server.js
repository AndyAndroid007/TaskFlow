require("dotenv").config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

connectDB();

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', { reason: reason?.message || reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack });
    process.exit(1);
});
