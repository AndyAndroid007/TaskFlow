const { parseTaskProposal } = require('../../../../../src/modules/ai/outputParser');

describe('AI Output Parser Unit Tests', () => {
    it('Should extract and validate a task proposal wrapped in task tags', () => {
        const result = parseTaskProposal('<task>{"title":"Fix login bug","priority":"High","dueDate":"2026-04-25","tags":["auth","bug"],"status":"Open"}</task>');

        expect(result.validationError).toBeNull();
        expect(result.taskProposal).toEqual({
            title: 'Fix login bug',
            priority: 'High',
            dueDate: '2026-04-25',
            tags: ['auth', 'bug'],
            status: 'Open',
        });
    });

    it('Should return plain reply text when no task tag is present', () => {
        const result = parseTaskProposal('What priority should this be?');

        expect(result.taskProposal).toBeNull();
        expect(result.reply).toBe('What priority should this be?');
    });

    it('Should surface a validation error for malformed task JSON payloads', () => {
        const result = parseTaskProposal('<task>{"title":"No","priority":"Urgent"}</task>');

        expect(result.taskProposal).toBeNull();
        expect(result.validationError).toBeTruthy();
    });
});
