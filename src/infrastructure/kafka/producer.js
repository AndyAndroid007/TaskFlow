const kafka = require('./kafkaClient');
const logger = require('../../utils/logger');

// Retrieve the producer from the connected client singleton
const producer = kafka.producer();

/**
 * Connects the Kafka Producer.
 * This should be called once when the application starts.
 */

const connectProducer = async () => {
    try {
        await producer.connect();
        logger.info('Kafka Producer Connected Successfully');
    } catch (error) {
        logger.error('Failed to connect Kafka Producer', {
            error: error.message
        });
        throw error;
    }
};

const disconnectProducer = async () => {
    try {
        await producer.disconnect();
        logger.info('Kafka Producer Disconnected');
    } catch (error) {
        logger.error('Error disconnecting Kafka Producer', {
            error: error.message
        })
    }
}

/**
 * Publishes an event to a specific Kafka topic.
 *
 * @param {string} topic - The Kafka topic (e.g., 'task.created').
 * @param {Object} eventPayload - The data to send.
 */

const produceEvent = async (topic, eventPayload) => {
    try {
        await producer.send({
            topic,
            messages: [
                // Kafka messages are key-value pairs. 
                // Storing the payload as a JSON string in the 'value' field.
                { value: JSON.stringify(eventPayload) }
            ]
        });
        logger.debug(`Event produced to topic: ${topic}`, {
            eventType: eventPayload.eventType,
            eventId: eventPayload.eventId
        });
    }
    catch (error) {
        logger.error(`Failed to produce event to topic: ${topic}`,
            {
                error: error.message,
                eventPayload
            }
        );
        // Swallowing the error. The main DB transaction succeeded, 
        // so we don't want to fail the HTTP request just because analytics/notifications failed.
    }
};

module.exports = { connectProducer, disconnectProducer, produceEvent }
