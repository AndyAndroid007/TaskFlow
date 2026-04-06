const { startConsumer } = require('../../infrastructure/kafka/consumer');
const { TOPICS } = require('../../events/taskEvents');
const { createResilientHandler } = require('../../events/resilientHandler');
const logger = require('../../utils/logger');
const sseManager = require('../../infrastructure/sse/sseManager');

const GROUP_ID = 'taskflow-notifications-group';
const initNotificationConsumer = async () => {
    const topicsToListenTo = [TOPICS.TASK_COMPLETED, TOPICS.TASK_UPDATED];
    const notifyUsers = (topic, eventPayload) => {
        const assignedUser = eventPayload.payload.userId;
        const assigneeUser = eventPayload.payload.assignee;
        const notifySet = assigneeUser ? new Set([assignedUser, assigneeUser]) : new Set([assignedUser]);
        const message = { type: `${topic}`, title: eventPayload.payload.title };
        const action = topic.split('_')[1].toLowerCase()
        for (const user of notifySet) {
            sseManager.sendNotification(user, message);
            logger.debug(`[Notification Service] Alerting user ${user}: Task "${eventPayload.payload.title}" was ${action}!`, {
                correlationId: eventPayload.correlationId
            });
        }
    }
    await startConsumer(GROUP_ID, topicsToListenTo, createResilientHandler(async (eventPayload, { topic }) => {
        logger.info(`[Notification Service] Processing event from ${topic}`, {
            correlationId: eventPayload.correlationId
        });
        //TODO: Implement the functionality of Notification Service to pick up.
        if (topic === TOPICS.TASK_COMPLETED) {
            notifyUsers('TASK_COMPLETED', eventPayload);
        }
        else if (topic === TOPICS.TASK_UPDATED) {
            notifyUsers('TASK_UPDATED', eventPayload);
        }
    }));
}
module.exports = { initNotificationConsumer };