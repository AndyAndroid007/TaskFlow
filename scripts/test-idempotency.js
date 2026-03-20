const {connectProducer, disconnectProducer, produceEvent} = require('../src/infrastructure/kafka/producer');
const { TOPICS, EVENT_TYPES, buildEvent } = require('../src/events/taskEvents');
require('dotenv').config();

const runTest = async () => {
    await connectProducer();

    //Create first event
    const event = buildEvent(EVENT_TYPES.TASK_CREATED, {
        title: "Idempotency Test Task",
        userId: "test-user-123"
    });

    console.log(`Producing same event twice ${event.eventId}`);

    await produceEvent(TOPICS.TASK_CREATED, event);
    await produceEvent(TOPICS.TASK_CREATED, event);

    await disconnectProducer();
};

runTest();