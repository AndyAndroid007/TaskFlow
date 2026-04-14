const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const analyticsController = require("../controllers/analytics.controller");

router.get('/summary', authMiddleware, analyticsController.getTaskSummary);

module.exports = router;