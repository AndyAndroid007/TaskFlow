const { Kafka } = require('kafkajs');

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockSend = jest.fn();

const { connectProducer, produceEvent, produceToDLQ, disconnectProducer } = require('../../../../src/infrastructure/kafka/producer');

jest.mock('kafkajs', () => {
    return {
        logLevel: { INFO: 1, ERROR: 4, WARN: 2, DEBUG: 0 },
        Kafka: jest.fn().mockImplementation(() => ({
            producer: jest.fn(() => ({
                connect: mockConnect,
                disconnect: mockDisconnect,
                send: mockSend
            }))
        }))
    };
});

describe('Kafka Producer Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should connect the producer successfully', async () => {
        await connectProducer();
        expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('Should correctly format and stringify an event payload to Kafka', async () => {
        const testPayload = { id: 123, action: "testing" };
        await produceEvent("test.events", testPayload);

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend).toHaveBeenCalledWith({
            topic: "test.events",
            messages: [{ value: JSON.stringify(testPayload) }]
        });
    });

    it('Should correctly route and append metadata for failed events inside the DLQ (Dead Letter Queue)', async () => {
        const originalEvent = { eventId: "err-123", correlationId: "uuid-test" };
        const mockError = new Error("Simulated Processing Failure");
        
        await produceToDLQ("test.events", originalEvent, mockError, 3);

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            topic: "test.events.dlq"
        }));

        // Assert the internal structure of the stringified payload
        const payloadStr = mockSend.mock.calls[0][0].messages[0].value;
        const parsedPayload = JSON.parse(payloadStr);

        expect(parsedPayload.originalEvent).toEqual(originalEvent);
        expect(parsedPayload.error).toBe(mockError.message);
        expect(parsedPayload.retryCount).toBe(3);
        expect(typeof parsedPayload.failedAt).toBe('string');
    });

    it('Should cleanly disconnect the producer without side effects', async () => {
        await disconnectProducer();
        expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
});
