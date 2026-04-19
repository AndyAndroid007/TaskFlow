const { startConsumer } = require('../../infrastructure/kafka/consumer');
const { TOPICS } = require('../../events/taskEvents');
const { createResilientHandler } = require('../../events/resilientHandler');
const logger = require('../../utils/logger');
const notificationService = require('../../services/notification.service');

const GROUP_ID = 'taskflow-notifications-group';
const initNotificationConsumer = async () => {
    const topicsToListenTo = [TOPICS.TASK_CREATED, TOPICS.TASK_UPDATED, TOPICS.TASK_COMPLETED, TOPICS.TASK_DELETED];
    const notifyUsers = async (topic, eventPayload) => {
        const assignedUser = eventPayload.payload.userId;
        const assigneeUser = eventPayload.payload.assignee;
        const notifySet = assigneeUser ? new Set([assignedUser, assigneeUser]) : new Set([assignedUser]);
        const action = topic.split('_')[1].toLowerCase();
        for (const user of notifySet) {
            await notificationService.createNotification(user, {
                type: `${topic}`,
                title: eventPayload.payload.title || 'Task update',
                taskId: eventPayload.payload.taskId,
                message: `Task "${eventPayload.payload.title || 'Untitled task'}" was ${action}.`,
            });
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
        if (topic === TOPICS.TASK_CREATED) {
            await notifyUsers('TASK_CREATED', eventPayload);
        }
        else if (topic === TOPICS.TASK_COMPLETED) {
            await notifyUsers('TASK_COMPLETED', eventPayload);
        }
        else if (topic === TOPICS.TASK_UPDATED) {
            await notifyUsers('TASK_UPDATED', eventPayload);
        }
        else if (topic === TOPICS.TASK_DELETED) {
            await notifyUsers('TASK_DELETED', eventPayload);
        }
    }));
}
module.exports = { initNotificationConsumer };
