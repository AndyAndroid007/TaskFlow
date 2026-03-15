const { Kafka, logLevel } = require('kafkajs');
const logger = require('../../utils/logger');

// Broker Configuration
const brokers = (process.env.KAFKA_BROKERS || 
'localhost:9092').split(',');

// Client Setup
const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'taskflow-backend',
    brokers: brokers,
    logLevel: logLevel.DEBUG,
    //Custom Logger to bridge KafkaJS logs into Winston
    logCreator: () => {
        return ({
            namespace, 
            level,
            label,
            log
        }) => {
            const {message, ...extra} = log;
        if (label === 'INFO') logger.info(`[Kafka-${namespace}] ${message}`, extra);
        else if (label === 'ERROR') logger.error(`[Kafka-${namespace}] ${message}`, extra);
        else if (label === 'WARN') logger.warn(`[Kafka-${namespace}] ${message}`, extra);
        else logger.debug(`[Kafka-${namespace}] ${message}`, extra);
        };
    }
});

module.exports = kafka;