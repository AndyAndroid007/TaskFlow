const aiService = require('../services/ai.service');

async function chat(req, res, next) {
    try {
        const response = await aiService.chat(req.user.id, req.body.message, req.correlationId);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

async function confirmTask(req, res, next) {
    try {
        const response = await aiService.confirmTask(req.user.id, req.body.confirmed, req.correlationId);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

async function clearConversation(req, res, next) {
    try {
        const response = await aiService.clearConversation(req.user.id);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    chat,
    confirmTask,
    clearConversation,
};
