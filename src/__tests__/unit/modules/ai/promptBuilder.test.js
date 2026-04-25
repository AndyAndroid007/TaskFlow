const {
    DEFAULT_SYSTEM_PROMPT,
    buildClassificationPrompt,
    buildSuggestionPrompt,
    buildExtractionPrompt,
} = require('../../../../modules/ai/promptBuilder');

describe('Prompt Builder', () => {
    describe('DEFAULT_SYSTEM_PROMPT', () => {
        it('should be a non-empty string', () => {
            expect(typeof DEFAULT_SYSTEM_PROMPT).toBe('string');
            expect(DEFAULT_SYSTEM_PROMPT.length).toBeGreaterThan(0);
        });

        it('should contain TaskFlow AI identity', () => {
            expect(DEFAULT_SYSTEM_PROMPT).toContain('TaskFlow AI');
        });

        it('should instruct the model not to ask for assignee', () => {
            expect(DEFAULT_SYSTEM_PROMPT).toContain('Do not ask the user for the assignee');
        });

        it('should mention concise and professional tone', () => {
            expect(DEFAULT_SYSTEM_PROMPT).toContain('concise');
        });
    });

    describe('buildClassificationPrompt', () => {
        const message = 'Create a task to fix the login bug';
        let prompt;

        beforeEach(() => {
            prompt = buildClassificationPrompt(message);
        });

        it('should return a non-empty string', () => {
            expect(typeof prompt).toBe('string');
            expect(prompt.length).toBeGreaterThan(0);
        });

        it('should include the original user message', () => {
            expect(prompt).toContain(message);
        });

        it('should include all 5 intent labels', () => {
            expect(prompt).toContain('SUGGEST_TASKS');
            expect(prompt).toContain('CREATE_TASK');
            expect(prompt).toContain('UPDATE_TASK');
            expect(prompt).toContain('DELETE_TASK');
            expect(prompt).toContain('GENERAL_CHAT');
        });

        it('should instruct the model to reply with only the label', () => {
            expect(prompt).toMatch(/reply with only the label|Reply with ONLY the label/i);
        });
    });

    describe('buildSuggestionPrompt', () => {
        it('should inject the provided task summary into the prompt', () => {
            const summary = '- [HIGH] Fix login bug | Due: 2026-04-25 | OPEN';
            const prompt = buildSuggestionPrompt(summary);
            expect(prompt).toContain(summary);
        });

        it('should use fallback text when summary is null', () => {
            const prompt = buildSuggestionPrompt(null);
            expect(prompt).toContain('No current tasks available');
        });

        it('should use fallback text when summary is empty string', () => {
            const prompt = buildSuggestionPrompt('');
            expect(prompt).toContain('No current tasks available');
        });

        it('should contain task recommendation guidance', () => {
            const prompt = buildSuggestionPrompt('- [HIGH] Fix login bug | Due today | OPEN');
            expect(prompt).toContain('recommend');
        });
    });

    describe('buildExtractionPrompt', () => {
        const fullExtracted = {
            title: 'Fix login bug',
            description: 'Auth service is broken',
            priority: 'High',
            dueDate: '2026-04-25',
            tags: ['auth', 'backend'],
        };

        it('should inject the task title into the prompt', () => {
            const prompt = buildExtractionPrompt(fullExtracted);
            expect(prompt).toContain('Fix login bug');
        });

        it('should inject the priority into the prompt', () => {
            const prompt = buildExtractionPrompt(fullExtracted);
            expect(prompt).toContain('High');
        });

        it('should inject the due date into the prompt', () => {
            const prompt = buildExtractionPrompt(fullExtracted);
            expect(prompt).toContain('2026-04-25');
        });

        it('should inject the tags into the prompt', () => {
            const prompt = buildExtractionPrompt(fullExtracted);
            expect(prompt).toContain('auth');
            expect(prompt).toContain('backend');
        });

        it('should show "Unknown" for null title', () => {
            const prompt = buildExtractionPrompt({ ...fullExtracted, title: null });
            expect(prompt).toContain('title: Unknown');
        });

        it('should show "Unknown" for missing tags when tags array is empty', () => {
            const prompt = buildExtractionPrompt({ ...fullExtracted, tags: [] });
            expect(prompt).toContain('Unknown');
        });

        it('should instruct to call propose_task tool when title is known', () => {
            const prompt = buildExtractionPrompt(fullExtracted);
            expect(prompt).toContain('propose_task');
        });

        it('should instruct to ask user when title is unknown', () => {
            const prompt = buildExtractionPrompt({ ...fullExtracted, title: null });
            expect(prompt).toContain('Unknown');
        });
    });
});
