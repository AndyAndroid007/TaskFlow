require("dotenv").config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { connectProducer } = require('./infrastructure/kafka/producer');
const { initTopics } = require('./infrastructure/kafka/admin');
const { initAnalyticsConsumer } = require('./modules/analytics/analytics.consumer');
const { initNotificationConsumer} = require('./modules/notifications/notification.consumer');

connectDB();

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", async () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
    
    try {
        await connectProducer();
        await initTopics();
        initAnalyticsConsumer();
        initNotificationConsumer();
    } catch (error) {
        logger.warn('Could not connect to Kafka. Running without event streaming.');
    }
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
