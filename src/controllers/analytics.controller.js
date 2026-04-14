const analyticsService = require("../services/analytics.service.js");

const getTaskSummary = async (req, res, next) => {
    try {
        const summary = await analyticsService.getSummaryByUserId(req.user.id);
        res.json(summary);
    } catch (error) {
        next(error);
    }
}
module.exports = {getTaskSummary};