jest.mock('../../../../../src/infrastructure/kafka/consumer', () => ({
    startConsumer: jest.fn(),
}));

jest.mock('../../../../../src/events/resilientHandler', () => ({
    createResilientHandler: jest.fn((handler) => handler),
}));

jest.mock('../../../../../src/services/notification.service', () => ({
    createNotification: jest.fn(),
}));

jest.mock('uuid', () => ({
    v4: () => 'test-uuid-1234',
}));

const { startConsumer } = require('../../../../../src/infrastructure/kafka/consumer');
const notificationService = require('../../../../../src/services/notification.service');
const { TOPICS } = require('../../../../../src/events/taskEvents');
const { initNotificationConsumer } = require('../../../../../src/modules/notifications/notification.consumer');

describe('Notification Consumer Unit Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Should notify both the task creator and current assignee when a task is deleted', async () => {
        await initNotificationConsumer();

        expect(startConsumer).toHaveBeenCalledTimes(1);
        const handler = startConsumer.mock.calls[0][2];

        await handler({
            correlationId: 'corr-delete',
            payload: {
                taskId: 'task-123',
                userId: 'owner-1',
                assignee: 'assignee-1',
                title: 'Delegated Task',
            },
        }, { topic: TOPICS.TASK_DELETED });

        expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
        expect(notificationService.createNotification).toHaveBeenCalledWith('owner-1', expect.objectContaining({
            type: 'TASK_DELETED',
            title: 'Delegated Task',
            taskId: 'task-123',
            message: 'Task "Delegated Task" was deleted.',
        }));
        expect(notificationService.createNotification).toHaveBeenCalledWith('assignee-1', expect.objectContaining({
            type: 'TASK_DELETED',
            title: 'Delegated Task',
            taskId: 'task-123',
            message: 'Task "Delegated Task" was deleted.',
        }));
    });
});
