const SSEManager = require('../../../../src/infrastructure/sse/sseManager');

describe('SSE Manager Unit Tests', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            setHeader: jest.fn(),
            flushHeaders: jest.fn(),
            write: jest.fn()
        };

        SSEManager.clients.clear();
    });

    it('Should add a new client connection', () => {
        SSEManager.newClientConnection('test-user', mockRes);
        expect(SSEManager.clients.has('test-user')).toBe(true);
        expect(SSEManager.clients.get('test-user').has(mockRes)).toBe(true);

    });
    it('Should send a new notification', () => {
        SSEManager.newClientConnection('test-user', mockRes);
        const testNotificationPayload = {
            event: 'Test Notification'
        };
        SSEManager.sendNotification('test-user',testNotificationPayload);
        expect(mockRes.write).toHaveBeenCalledTimes(1);
        expect(mockRes.write).toHaveBeenCalledWith('data: {"event":"Test Notification"}\n\n');
    });
    it('Should remove a client connection cleanly', () => {
        SSEManager.newClientConnection('test-user', mockRes);
        SSEManager.removeClientConnection('test-user',mockRes);
        
        expect(SSEManager.clients.has('test-user')).toBe(false);
    });
});