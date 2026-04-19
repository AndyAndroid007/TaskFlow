const mongoose = require('mongoose');
const Notification = require('../models/notification.model');

async function createNotification(notificationData) {
    return Notification.create(notificationData);
}

async function getNotificationsByUser(userId) {
    return Notification.find({ userId })
        .sort({ receivedAt: -1, _id: -1 })
        .limit(10);
}

async function deleteNotificationById(userId, notificationId) {
    return Notification.findOneAndDelete({
        _id: notificationId,
        userId,
    });
}

async function clearNotificationsByUser(userId) {
    return Notification.deleteMany({ userId });
}

async function pruneNotificationsForUser(userId, limit) {
    const notifications = await Notification.find({ userId })
        .sort({ receivedAt: -1, _id: -1 })
        .skip(limit)
        .select('_id');

    if (notifications.length === 0) {
        return;
    }

    const ids = notifications.map((notification) => notification._id);
    await Notification.deleteMany({ _id: { $in: ids } });
}

module.exports = {
    createNotification,
    getNotificationsByUser,
    deleteNotificationById,
    clearNotificationsByUser,
    pruneNotificationsForUser,
};
