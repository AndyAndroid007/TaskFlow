const mongoose = require('mongoose');
const ApiError = require('../exceptions/ApiError');
const notificationRepo = require('../repositories/notification.repository');
const sseManager = require('../infrastructure/sse/sseManager');

const NOTIFICATION_LIMIT = 10;

function buildNotificationMessage(type, title) {
    const action = String(type || '').split('_').pop().toLowerCase();
    return `${title} was ${action}`;
}

async function createNotification(userId, payload) {
    const notification = await notificationRepo.createNotification({
        userId,
        type: payload.type,
        title: payload.title,
        message: payload.message || buildNotificationMessage(payload.type, payload.title),
        taskId: payload.taskId || null,
        receivedAt: new Date(),
    });

    await notificationRepo.pruneNotificationsForUser(userId, NOTIFICATION_LIMIT);
    sseManager.sendNotification(userId, notification.toObject());

    return notification;
}

async function getNotificationsByUser(userId) {
    return notificationRepo.getNotificationsByUser(userId);
}

async function deleteNotification(userId, notificationId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new ApiError(400, 'Invalid notification ID');
    }

    const deleted = await notificationRepo.deleteNotificationById(userId, notificationId);
    if (!deleted) {
        throw new ApiError(404, 'Notification not found');
    }

    return { message: 'Notification deleted successfully' };
}

async function clearNotifications(userId) {
    await notificationRepo.clearNotificationsByUser(userId);
    return { message: 'Notifications cleared successfully' };
}

module.exports = {
    NOTIFICATION_LIMIT,
    createNotification,
    getNotificationsByUser,
    deleteNotification,
    clearNotifications,
};
