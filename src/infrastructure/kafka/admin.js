const kafka = require('./kafkaClient');
const logger = require('../../utils/logger');
const { TOPICS } = require('../../events/taskEvents');

const initTopics = async () => {
    const admin = kafka.admin();
    try {
        await admin.connect();
        logger.info('Kafka Admin connected. Initializing topics...');
        
        const existingTopics = await admin.listTopics();
        const topicsToCreate = Object.values(TOPICS)
            .filter(topic => !existingTopics.includes(topic))
            .map(topic => ({ topic }));

        if (topicsToCreate.length > 0) {
            await admin.createTopics({
                topics: topicsToCreate,
                waitForLeaders: true,
            });
            logger.info(`Created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
        } else {
            logger.info('All Kafka topics already exist.');
        }
    } catch (err) {
        logger.error('Error initializing topics', { error: err.message });
    } finally {
        await admin.disconnect();
    }
};

module.exports = { initTopics };
