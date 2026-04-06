const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const eventController = require("../controllers/event.controller");

router.get('/stream', authMiddleware, eventController.subscribe);

module.exports = router;