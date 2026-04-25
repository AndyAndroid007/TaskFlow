const { INTENTS, detectIntent } = require('../../../../modules/ai/intentDetector');

describe('Intent Detector', () => {
    describe('SUGGEST_TASKS intent', () => {
        it('should detect from "what should I work on today"', () => {
            expect(detectIntent('What should I work on today?')).toBe(INTENTS.SUGGEST_TASKS);
        });

        it('should detect from "what should I focus on"', () => {
            expect(detectIntent('What should I focus on this afternoon?')).toBe(INTENTS.SUGGEST_TASKS);
        });

        it('should detect from "prioritize" keyword', () => {
            expect(detectIntent('Can you prioritize my tasks?')).toBe(INTENTS.SUGGEST_TASKS);
        });

        it('should detect from "suggest" keyword', () => {
            expect(detectIntent('Can you suggest what I should focus on?')).toBe(INTENTS.SUGGEST_TASKS);
        });

        it("should detect from \"today's tasks\" phrasing", () => {
            expect(detectIntent("What are today's tasks?")).toBe(INTENTS.SUGGEST_TASKS);
        });
    });

    describe('CREATE_TASK intent', () => {
        it('should detect from "create a task"', () => {
            expect(detectIntent('Create a new task for the auth bug')).toBe(INTENTS.CREATE_TASK);
        });

        it('should detect from "add a task"', () => {
            expect(detectIntent('Add a task to review the PR')).toBe(INTENTS.CREATE_TASK);
        });

        it('should detect from "make a new task"', () => {
            expect(detectIntent('Make a new task for the release')).toBe(INTENTS.CREATE_TASK);
        });

        it('should detect from "remind me to"', () => {
            expect(detectIntent('Remind me to update the README')).toBe(INTENTS.CREATE_TASK);
        });

        it('should detect from "new reminder"', () => {
            expect(detectIntent('Create a new reminder for the meeting')).toBe(INTENTS.CREATE_TASK);
        });
    });

    describe('UPDATE_TASK intent', () => {
        it('should detect from "update task priority"', () => {
            expect(detectIntent('Update the task priority to high')).toBe(INTENTS.UPDATE_TASK);
        });

        it('should detect from "change task status"', () => {
            expect(detectIntent('Change the task status to In Review')).toBe(INTENTS.UPDATE_TASK);
        });

        it('should detect from "modify task due date"', () => {
            expect(detectIntent('Modify the due date for my task')).toBe(INTENTS.UPDATE_TASK);
        });

        it('should detect from "edit task description"', () => {
            expect(detectIntent('Edit task description')).toBe(INTENTS.UPDATE_TASK);
        });

        it('should detect from "set task tags"', () => {
            expect(detectIntent('Set task tags to backend')).toBe(INTENTS.UPDATE_TASK);
        });
    });

    describe('DELETE_TASK intent', () => {
        it('should detect from "delete the task"', () => {
            expect(detectIntent('Delete the task for the login bug')).toBe(INTENTS.DELETE_TASK);
        });

        it('should detect from "remove the task"', () => {
            expect(detectIntent('Remove the task I created yesterday')).toBe(INTENTS.DELETE_TASK);
        });

        it('should detect from "remove the reminder"', () => {
            expect(detectIntent('Remove the reminder about the meeting')).toBe(INTENTS.DELETE_TASK);
        });

        it('should detect from "clear the task"', () => {
            expect(detectIntent('Clear this task from my list')).toBe(INTENTS.DELETE_TASK);
        });
    });

    describe('CANCEL intent', () => {
        it('should detect from "cancel"', () => {
            expect(detectIntent('cancel')).toBe(INTENTS.CANCEL);
        });

        it('should detect from "stop"', () => {
            expect(detectIntent('stop')).toBe(INTENTS.CANCEL);
        });

        it('should detect from "never mind"', () => {
            expect(detectIntent('never mind, forget it')).toBe(INTENTS.CANCEL);
        });

        it('should detect from "forget it"', () => {
            expect(detectIntent('Forget it, I changed my mind')).toBe(INTENTS.CANCEL);
        });

        it('should detect from "abort"', () => {
            expect(detectIntent('abort')).toBe(INTENTS.CANCEL);
        });

        it('should detect from "not now"', () => {
            expect(detectIntent('not now')).toBe(INTENTS.CANCEL);
        });
    });

    describe('null (no rule match)', () => {
        it('should return null for a generic greeting', () => {
            expect(detectIntent('Hello there')).toBeNull();
        });

        it('should return null for a general question', () => {
            expect(detectIntent('How are you doing?')).toBeNull();
        });

        it('should return null for an unrelated statement', () => {
            expect(detectIntent('The weather is nice today')).toBeNull();
        });
    });
});
