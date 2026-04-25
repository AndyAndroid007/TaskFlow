const { formatHistoryForLLM, callGemini } = require('../../../../modules/ai/llmClient');

// Mock global fetch for callGemini tests
global.fetch = jest.fn();

const makeSuccessResponse = (parts) => ({
    ok: true,
    json: async () => ({
        candidates: [{ content: { parts } }],
    }),
});

const makeErrorResponse = (status) => ({
    ok: false,
    status,
    text: async () => `Error ${status}`,
});

describe('LLM Client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('formatHistoryForLLM', () => {
        it('should return an empty array for null input', () => {
            expect(formatHistoryForLLM(null)).toEqual([]);
        });

        it('should return an empty array for empty array input', () => {
            expect(formatHistoryForLLM([])).toEqual([]);
        });

        it('should convert a single user message to Gemini format', () => {
            const history = [{ role: 'user', content: 'Hello' }];
            const result = formatHistoryForLLM(history);
            expect(result).toEqual([{ role: 'user', parts: [{ text: 'Hello' }] }]);
        });

        it('should convert model role correctly', () => {
            const history = [
                { role: 'user', content: 'Hello' },
                { role: 'model', content: 'Hi there!' },
            ];
            const result = formatHistoryForLLM(history);
            expect(result).toHaveLength(2);
            expect(result[1].role).toBe('model');
            expect(result[1].parts).toEqual([{ text: 'Hi there!' }]);
        });

        it('should merge consecutive messages from the same role', () => {
            const history = [
                { role: 'user', content: 'First message' },
                { role: 'user', content: 'Second message' },
            ];
            const result = formatHistoryForLLM(history);
            expect(result).toHaveLength(1);
            expect(result[0].parts).toHaveLength(2);
            expect(result[0].parts[0]).toEqual({ text: 'First message' });
            expect(result[0].parts[1]).toEqual({ text: 'Second message' });
        });

        it('should drop a leading model message (history must start with user)', () => {
            const history = [
                { role: 'model', content: 'I am the assistant' },
                { role: 'user', content: 'Hello' },
            ];
            const result = formatHistoryForLLM(history);
            expect(result[0].role).toBe('user');
        });

        it('should skip messages with empty content', () => {
            const history = [
                { role: 'user', content: 'Hello' },
                { role: 'model', content: '' },
                { role: 'user', content: 'Are you there?' },
            ];
            const result = formatHistoryForLLM(history);
            // The two user messages should be merged since model with empty content is dropped
            expect(result.every(m => m.role !== 'model')).toBe(true);
        });
    });

    describe('callGemini', () => {
        const validHistory = [{ role: 'user', content: 'Hello' }];

        beforeEach(() => {
            process.env.GEMINI_API_KEY = 'test-api-key';
        });

        afterEach(() => {
            delete process.env.GEMINI_API_KEY;
        });

        it('should throw if GEMINI_API_KEY is not set', async () => {
            delete process.env.GEMINI_API_KEY;
            await expect(callGemini('', validHistory)).rejects.toThrow('GEMINI_API_KEY is not configured');
        });

        it('should return { type: "text", text } for a successful text response', async () => {
            global.fetch.mockResolvedValue(makeSuccessResponse([{ text: 'Hello from Gemini!' }]));
            const result = await callGemini('', validHistory);
            expect(result).toEqual({ type: 'text', text: 'Hello from Gemini!' });
        });

        it('should return { type: "function_call", functionCall } when Gemini returns a function call', async () => {
            const functionCall = { name: 'propose_task', args: { title: 'Test task' } };
            global.fetch.mockResolvedValue(makeSuccessResponse([{ functionCall }]));
            const result = await callGemini('', validHistory);
            expect(result).toEqual({ type: 'function_call', functionCall });
        });

        it('should throw when Gemini API returns a non-ok response', async () => {
            global.fetch.mockResolvedValue(makeErrorResponse(400));
            await expect(callGemini('', validHistory)).rejects.toThrow('Gemini API request failed with status 400');
        });

        it('should include systemInstruction in request body when systemPrompt is provided', async () => {
            global.fetch.mockResolvedValue(makeSuccessResponse([{ text: 'ok' }]));
            await callGemini('You are an assistant.', validHistory);
            const body = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(body.systemInstruction).toEqual({
                parts: [{ text: 'You are an assistant.' }],
            });
        });

        it('should NOT include systemInstruction in request body when systemPrompt is empty', async () => {
            global.fetch.mockResolvedValue(makeSuccessResponse([{ text: 'ok' }]));
            await callGemini('', validHistory);
            const body = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(body.systemInstruction).toBeUndefined();
        });

        it('should use the default model when model is not specified in options', async () => {
            global.fetch.mockResolvedValue(makeSuccessResponse([{ text: 'ok' }]));
            await callGemini('', validHistory);
            const url = global.fetch.mock.calls[0][0];
            expect(url).toContain('gemini-2.5-flash-lite');
        });

        it('should apply temperature and maxOutputTokens from options', async () => {
            global.fetch.mockResolvedValue(makeSuccessResponse([{ text: 'ok' }]));
            await callGemini('', validHistory, { temperature: 0.9, maxOutputTokens: 512 });
            const body = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(body.generationConfig.temperature).toBe(0.9);
            expect(body.generationConfig.maxOutputTokens).toBe(512);
        });
    });
});
