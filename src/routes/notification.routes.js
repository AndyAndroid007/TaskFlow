const express = require('express');
const auth = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(auth);

router.get('/', notificationController.getNotifications);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/', notificationController.clearNotifications);

module.exports = router;
