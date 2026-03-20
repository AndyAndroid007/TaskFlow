const {startConsumer} = require('../../infrastructure/kafka/consumer');
const {TOPICS} = require('../../events/taskEvents');
const { createResilientHandler } = require('../../events/resilientHandler');
const logger = require('../../utils/logger');

const GROUP_ID = 'taskflow-notifications-group';
const initNotificationConsumer = async () => {
    const topicsToListenTo = [TOPICS.TASK_COMPLETED, TOPICS.TASK_UPDATED];
    await startConsumer(GROUP_ID, topicsToListenTo, createResilientHandler(async (eventPayload, {topic}) => {
        logger.info(`[Notification Service] Processing event from ${topic}`,{
            correlationId: eventPayload.correlationId
        });
        //TODO: Implement the functionality of Notification Service to pick up.
        if(topic === TOPICS.TASK_COMPLETED) {
            logger.debug(`[Notification Service] Alerting user ${eventPayload.payload.userId}: Task "${eventPayload.payload.title}" was completed!`,{
                correlationId: eventPayload.correlationId
            });
        }
        else if (topic === TOPICS.TASK_UPDATED) {
            logger.debug(`[Notification Service] Alerting user ${eventPayload.payload.userId}: Task
                "${eventPayload.payload.title}" was updated!`, {
                    correlationId: eventPayload.correlationId
                });
        }
    }));
}
module.exports = {initNotificationConsumer};