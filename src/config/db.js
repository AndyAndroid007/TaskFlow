const mongoose = require("mongoose")
const logger = require('../utils/logger');

const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
        logger.info('MongoDB connected successfully');
    } catch (err) {
        logger.warn('Primary MongoDB connection failed, falling back to memory server', { error: err.message });
        try {
            const mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            logger.info('MongoDB memory server connected successfully', { memoryUri });
        } catch (memErr) {
            logger.error('Memory server connection failed', { error: memErr.message });
            process.exit(1);
        }
    }
};

module.exports = connectDB;