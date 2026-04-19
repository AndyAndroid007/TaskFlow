const notificationService = require('../services/notification.service');

async function getNotifications(req, res, next) {
    try {
        const notifications = await notificationService.getNotificationsByUser(req.user.id);
        res.status(200).json(notifications);
    } catch (error) {
        next(error);
    }
}

async function deleteNotification(req, res, next) {
    try {
        const response = await notificationService.deleteNotification(req.user.id, req.params.id);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

async function clearNotifications(req, res, next) {
    try {
        const response = await notificationService.clearNotifications(req.user.id);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getNotifications,
    deleteNotification,
    clearNotifications,
};
