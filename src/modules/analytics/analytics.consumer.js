const { startConsumer } = require('../../infrastructure/kafka/consumer');
const { TOPICS } = require('../../events/taskEvents');
const logger = require('../../utils/logger');

const GROUP_ID = 'taskflow-analytics-group';

/**
 * Initializes the consumer listening for task events to feed into analytics.
 */
const initAnalyticsConsumer = async () => {
    // We want the analytics service to listen to ALL task topics
    const topicsToListenTo = [
        TOPICS.TASK_CREATED,
        TOPICS.TASK_UPDATED,
        TOPICS.TASK_COMPLETED,
        TOPICS.TASK_DELETED,
    ];

    await startConsumer(GROUP_ID, topicsToListenTo, async (eventPayload, { topic }) => {
        logger.info(`[Analytics Service] Processing event from ${topic}`);
        
        // This is a placeholder section. 
        // In Phase 6, we will write this payload to our MongoDB Analytics Collection!
        
        if (topic === TOPICS.TASK_CREATED) {
            logger.debug(`Analytics: Incrementing total tasks created`, { eventId: eventPayload.eventId });
        } 
        else if (topic === TOPICS.TASK_COMPLETED) {
            // Analytics wants to know specifically when a task is finished
            logger.debug(`Analytics: Logging completion time for task ${eventPayload.payload.taskId}`);
        }
        else if (topic === TOPICS.TASK_DELETED) {
            logger.debug(`Analytics: Decrementing total active tasks`);
        }
    });
};

module.exports = { initAnalyticsConsumer };
