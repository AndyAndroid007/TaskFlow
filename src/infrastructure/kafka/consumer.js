const kafka = require('./kafkaClient');
const logger = require('../../utils/logger');

/**
 * Starts a Kafka consumer for a specific topic or list of topics.
 *
 * @param {string} groupId - The Kafka consumer group ID.
 * @param {string|string[]} topics - The topic(s) to subscribe to (e.g., 'task.created').
 * @param {function} onMessage - Callback function: async ({ topic, partition, message })
 * @returns {Object} The connected consumer instance (useful for graceful shutdown)
 */

const startConsumer = async (groupId, topics, onMessage) => {
    const consumer = kafka.consumer({groupId});
    try {
        await consumer.connect();
        const topicsArray = Array.isArray(topics) ? topics : [topics];
        await consumer.subscribe({
            topics: topicsArray,
            fromBeginning: false
        });
        logger.info(`Subscribed to topics: ${topicsArray.join(',')}`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const eventPayload = message.value ? JSON.parse(message.value.toString()) : null;
                
                logger.debug(`Message received from topic: ${topic}`, { 
                    partition, 
                    offset: message.offset,
                    eventId: eventPayload?.eventId
                });

                try {
                    await onMessage(eventPayload, { topic, partition, offset: message.offset });
                } catch (error) {
                    logger.error(`Error processing Kafka message on topic ${topic}`, {
                        error: error.message,
                        eventPayload
                    });
                }
            },
        });

        return consumer;
    } catch (error) {
        logger.error(`Failed to start Kafka Consumer for group: ${groupId}`, { error: error.message });
    }
}
module.exports = {startConsumer,};