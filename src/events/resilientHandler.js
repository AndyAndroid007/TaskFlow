const ProcessedEvent = require('./processedEvent.model');
const { produceToDLQ } = require('../infrastructure/kafka/producer');
const logger = require('../utils/logger');

const RETRY_DELAYS = [1000, 5000, 30000];
const sleep = (ms) => new Promise(resolve =>
    setTimeout(resolve, ms));

/**
 * Wraps a consumer message handler with idempotency, retry, and DLQ logic.
 *
 * @param {function} handler - async (eventPayload, metadata) => void
 * @returns {function} A resilient version of the handler
 */

const createResilientHandler = (handler) => {
    return async (eventPayload, metadata) => {
        const { eventId, correlationId } = eventPayload;

        //Step 1 : Idempotency Check
        const alreadyProcessed = await ProcessedEvent.findOne({ eventId });
        if (alreadyProcessed) {
            logger.warn('Duplicate event skipped', {
                eventId, correlationId
            });
            return;
        }

        //Step 2 : Execute handler with retry
        let lastError;
        for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
            try {
                await handler(eventPayload, metadata);
                try {
                    await ProcessedEvent.create({ eventId });
                } catch (saveError) {
                    //Duplicate Key - another instance processed it concurrently, therefore save to ignore
                    logger.warn('ProcessedEvent save skipped (duplicate key race)', { eventId });
                }
                return;
            } catch (err) {
                lastError = err;
                if (attempt < RETRY_DELAYS.length) {
                    const delay = RETRY_DELAYS[attempt]
                    logger.warn(`Consumer handler failed. Retrying...`, {
                        eventId,
                        correlationId,
                        attempt: attempt + 1,
                        nextRetryMs: delay,
                        error: err.message
                    });
                    await sleep(delay);
                }
            }

        }

        //Step 4 : All retries exhausted - send to DLQ (Dead Letter Queue)
        logger.error('All retries exhausted. Sending event to DLQ', {
            eventId,
            correlationId,
            error: lastError.message
        });
        await produceToDLQ(metadata.topic, eventPayload, lastError, RETRY_DELAYS.length);
    };
};

module.exports = { createResilientHandler };