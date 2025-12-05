const express = require('express');
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const taskController = require("../controllers/task.controller");

router.use(auth);

router.get("/", taskController.getTasksByUser);
router.get("/:id", taskController.getTaskById);
router.post("/",taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;

