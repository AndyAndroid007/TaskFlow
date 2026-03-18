const {startConsumer} = require('../../infrastructure/kafka/consumer');
const {TOPICS} = require('../../events/taskEvents');
const logger = require('../../utils/logger');

const GROUP_ID = 'taskflow-notifications-group';
const initNotificationConsumer = async () => {
    const topicsToListenTo = [TOPICS.TASK_COMPLETED, TOPICS.TASK_UPDATED];
    await startConsumer(GROUP_ID, topicsToListenTo, async (eventPayload, {topic}) => {
        logger.info(`[Notification Service] Processing event from ${topic}`);
        //TODO: Implement the functionality of Notification Service to pick up.
        if(topic === TOPICS.TASK_COMPLETED) {
            logger.debug(`[Notification Service] Alerting user ${eventPayload.payload.userId}: Task "${eventPayload.payload.title}" was completed!`);
        }
        else if (topic === TOPICS.TASK_UPDATED) {
            logger.debug(`[Notification Service] Alerting user ${eventPayload.payload.userId}: Task
                "${eventPayload.payload.title}" was updated!`);
        }
    });
}
module.exports = {initNotificationConsumer};