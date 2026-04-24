const mockConversationStore = new Map();

function mockCreateConversationDocument(data) {
    return {
        userId: data.userId,
        messages: data.messages || [],
        activeIntent: data.activeIntent ?? null,
        pendingTaskProposal: data.pendingTaskProposal ?? null,
        taskCreationState: data.taskCreationState ?? null,
        lastActivity: data.lastActivity || new Date(),
        markModified: jest.fn(),
        async save() {
            mockConversationStore.set(String(this.userId), this);
            return this;
        },
    };
}

jest.mock('../../../models/conversation.model', () => ({
    findOne: jest.fn(async ({ userId }) => mockConversationStore.get(String(userId)) || null),
    create: jest.fn(async (data) => {
        const doc = mockCreateConversationDocument(data);
        mockConversationStore.set(String(data.userId), doc);
        return doc;
    }),
    findOneAndDelete: jest.fn(async ({ userId }) => {
        const key = String(userId);
        const existing = mockConversationStore.get(key) || null;
        mockConversationStore.delete(key);
        return existing;
    }),
}));

jest.mock('../../../services/task.service', () => ({
    getTasksByUser: jest.fn(),
    createTask: jest.fn(),
}));

jest.mock('../../../services/user.service', () => ({
    getAllUsers: jest.fn(),
}));

jest.mock('../../../modules/ai/llmClient', () => ({
    callGemini: jest.fn(),
}));

const Conversation = require('../../../models/conversation.model');
const taskService = require('../../../services/task.service');
const userService = require('../../../services/user.service');
const { callGemini } = require('../../../modules/ai/llmClient');
const aiService = require('../../../services/ai.service');

describe('AI Service Unit Tests', () => {
    const userId = '507f191e810c19729de860ea';

    beforeEach(() => {
        mockConversationStore.clear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should return a suggestion response and persist conversation state', async () => {
        taskService.getTasksByUser.mockResolvedValue([
            {
                title: 'Fix login bug',
                priority: 'High',
                status: 'Open',
                dueDate: '2026-04-18T00:00:00.000Z',
            },
        ]);
        callGemini.mockResolvedValue({ type: 'text', text: 'Focus on fixing the login bug first.' });

        const response = await aiService.chat(userId, 'What should I work on today?', 'corr-1');
        const conversation = await Conversation.findOne({ userId });

        expect(response).toEqual({
            intent: 'SUGGEST_TASKS',
            reply: 'Focus on fixing the login bug first.',
            taskProposal: null,
        });
        expect(conversation.activeIntent).toBe('SUGGEST_TASKS');
        expect(conversation.messages).toHaveLength(2);
    });

    it('Should store a validated task proposal for later confirmation', async () => {
        callGemini.mockResolvedValue({
            type: 'function_call',
            functionCall: {
                name: 'propose_task',
                args: {
                    title: "Fix login bug",
                    priority: "High",
                    dueDate: "2026-04-25",
                    tags: ["auth"]
                }
            }
        });

        const response = await aiService.chat(userId, 'Create a task to fix the login bug', 'corr-2');
        const conversation = await Conversation.findOne({ userId });

        expect(response.intent).toBe('CREATE_TASK');
        expect(response.reply).toBe('Should I keep this as a personal task/reminder, or assign it to someone else?');
        expect(response.taskProposal).toBeNull();
        expect(conversation.taskCreationState).toMatchObject({
            stage: 'awaiting_assignee_decision',
        });
        expect(conversation.taskCreationState.draftTaskProposal).toMatchObject({
            title: 'Fix login bug',
            priority: 'High',
            tags: ['auth'],
            status: 'Open',
            dueDate: '2026-04-25',
        });
        expect(conversation.pendingTaskProposal).toBeNull();
    });

    it('Should finalize a personal AI task after the user chooses to keep it personal', async () => {
        callGemini.mockResolvedValue({
            type: 'function_call',
            functionCall: {
                name: 'propose_task',
                args: {
                    title: "Fix login bug",
                    priority: "High",
                    dueDate: "2026-04-25",
                    tags: ["auth"]
                }
            }
        });

        await aiService.chat(userId, 'Create a task to fix the login bug', 'corr-2a');
        const response = await aiService.chat(userId, 'me', 'corr-2b');
        const conversation = await Conversation.findOne({ userId });

        expect(response.reply).toBe("Here's the task I've structured for you. Does this look right?");
        expect(response.taskProposal).toMatchObject({
            title: 'Fix login bug',
            assignee: userId,
        });
        expect(conversation.pendingTaskProposal).toMatchObject({
            assignee: userId,
        });
        expect(conversation.taskCreationState).toBeNull();
    });

    it('Should resolve another assignee by name before finalizing the proposal', async () => {
        callGemini.mockResolvedValue({
            type: 'function_call',
            functionCall: {
                name: 'propose_task',
                args: {
                    title: "Fix login bug",
                    priority: "High",
                    dueDate: "2026-04-25",
                    tags: ["auth"]
                }
            }
        });
        userService.getAllUsers.mockResolvedValue([
            { _id: userId, name: 'Owner User', email: 'owner@example.com' },
            { _id: '507f191e810c19729de860eb', name: 'Jane Doe', email: 'jane@example.com' },
        ]);

        await aiService.chat(userId, 'Create a task to fix the login bug', 'corr-2c');
        const response = await aiService.chat(userId, 'Assign it to Jane Doe', 'corr-2d');

        expect(response.reply).toBe("Here's the task I've structured for you. Does this look right?");
        expect(response.taskProposal).toMatchObject({
            assignee: '507f191e810c19729de860eb',
        });
    });

    it('Should create the pending task through task service on confirmation', async () => {
        await Conversation.create({
            userId,
            activeIntent: 'CREATE_TASK',
            pendingTaskProposal: {
                title: 'Fix login bug',
                priority: 'High',
                dueDate: '2026-04-25',
                tags: ['auth'],
                status: 'Open',
                assignee: '507f191e810c19729de860eb',
            },
        });
        taskService.createTask.mockResolvedValue({ _id: 'task-1', title: 'Fix login bug' });

        const response = await aiService.confirmTask(userId, true, 'corr-3');
        const conversation = await Conversation.findOne({ userId });

        expect(taskService.createTask).toHaveBeenCalledWith(userId, expect.objectContaining({
            title: 'Fix login bug',
            assignee: '507f191e810c19729de860eb',
            correlationId: 'corr-3',
        }));
        expect(response.reply).toBe('Task created successfully!');
        expect(conversation.pendingTaskProposal).toBeNull();
        expect(conversation.activeIntent).toBeNull();
    });

    it('Should return persisted conversation state for frontend reloads', async () => {
        await Conversation.create({
            userId,
            activeIntent: 'CREATE_TASK',
            messages: [
                { role: 'user', content: 'Create a task for the login bug' },
                { role: 'model', content: "Here's the task I've structured for you. Does this look right?" },
            ],
            pendingTaskProposal: {
                title: 'Fix login bug',
                assignee: userId,
            },
            taskCreationState: null,
        });

        const response = await aiService.getConversation(userId);

        expect(response).toEqual({
            messages: [
                { role: 'user', content: 'Create a task for the login bug' },
                { role: 'model', content: "Here's the task I've structured for you. Does this look right?" },
            ],
            activeIntent: 'CREATE_TASK',
            pendingTaskProposal: {
                title: 'Fix login bug',
                assignee: userId,
            },
            taskCreationState: null,
        });
    });
});
