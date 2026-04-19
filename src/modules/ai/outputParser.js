const taskProposalSchema = require('../../validation/taskProposal.validation');

const TASK_TAG_PATTERN = /<task>\s*([\s\S]*?)\s*<\/task>/i;

function normalizeReply(rawText) {
    return String(rawText || '').trim();
}

function parseTaskProposal(rawText) {
    const reply = normalizeReply(rawText);
    const match = reply.match(TASK_TAG_PATTERN);

    if (!match) {
        return {
            reply,
            taskProposal: null,
            validationError: null,
        };
    }

    try {
        const parsed = JSON.parse(match[1]);
        const { value, error } = taskProposalSchema.validate(parsed, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return {
                reply,
                taskProposal: null,
                validationError: error,
            };
        }

        return {
            reply: '',
            taskProposal: {
                ...value,
                dueDate: value.dueDate ? value.dueDate.toISOString().slice(0, 10) : undefined,
            },
            validationError: null,
        };
    } catch (error) {
        return {
            reply,
            taskProposal: null,
            validationError: error,
        };
    }
}

module.exports = {
    TASK_TAG_PATTERN,
    parseTaskProposal,
};
