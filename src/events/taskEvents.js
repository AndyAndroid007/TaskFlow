const {v4: uuidv4} = require('uuid');

const TOPICS = {
    TASK_CREATED: 'task.created',
    TASK_UPDATED: 'task.updated',
    TASK_COMPLETED: 'task.completed',
    TASK_DELETED: 'task.deleted',
    TASK_OVERDUE: 'task.overdue', 
};

const EVENT_TYPES = {
    TASK_CREATED: 'TaskCreated',
    TASK_UPDATED: 'TaskUpdated',
    TASK_COMPLETED: 'TaskCompleted',
    TASK_DELETED: 'TaskDeleted',
    TASK_OVERDUE: 'TaskOverdue',
};

/**
 * Helper function to construct a standardized event payload.
 * 
 * @param {string} eventType - The type of event (from EVENT_TYPES)
 * @param {Object} payload - The actual data (e.g. { taskId, userId, title })
 * @param {string} correlationId - The trace ID from the original HTTP request
 * @returns {Object} Standardized Kafka message payload
 */

const buildEvent = (eventType, payload, correlationId) => {
    return {
        eventId: uuidv4(),
        eventType,
        timestamp: new Date().toISOString(),
        correlationId: correlationId || 'system-generated',
        payload
    };
};

module.exports = {TOPICS, EVENT_TYPES, buildEvent}