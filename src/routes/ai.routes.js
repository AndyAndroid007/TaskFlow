const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const aiController = require('../controllers/ai.controller');
const { chatSchema, confirmTaskSchema } = require('../validation/ai.validation');

const router = express.Router();

router.use(auth);

router.post('/chat', validate(chatSchema), aiController.chat);
router.post('/confirm-task', validate(confirmTaskSchema), aiController.confirmTask);
router.delete('/conversation', aiController.clearConversation);

module.exports = router;
