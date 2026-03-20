const {TOPICS} = require('./taskEvents');

const DLQ_TOPICS = {
    TASK_CREATED: `${TOPICS.TASK_CREATED}.dlq`,
    TASK_UPDATED: `${TOPICS.TASK_UPDATED}.dlq`,
    TASK_COMPLETED: `${TOPICS.TASK_COMPLETED}.dlq`,
    TASK_DELETED: `${TOPICS.TASK_DELETED}.dlq`
};

module.exports = { DLQ_TOPICS };