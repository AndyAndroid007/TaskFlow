const { INTENTS, detectIntent } = require('../../../../../src/modules/ai/intentDetector');

describe('AI Intent Detector Unit Tests', () => {
    it('Should detect SUGGEST_TASKS from common prioritization phrasing', () => {
        expect(detectIntent('What should I work on today?')).toBe(INTENTS.SUGGEST_TASKS);
        expect(detectIntent('Can you suggest what I should focus on?')).toBe(INTENTS.SUGGEST_TASKS);
    });

    it('Should detect CREATE_TASK from task creation phrasing', () => {
        expect(detectIntent('Create a new task for the auth bug')).toBe(INTENTS.CREATE_TASK);
        expect(detectIntent('Remind me to update the README')).toBe(INTENTS.CREATE_TASK);
    });

    it('Should return null when no rule matches', () => {
        expect(detectIntent('Hello there')).toBeNull();
    });
});
