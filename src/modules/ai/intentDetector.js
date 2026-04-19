const INTENTS = {
    SUGGEST_TASKS: 'SUGGEST_TASKS',
    CREATE_TASK: 'CREATE_TASK',
    GENERAL_CHAT: 'GENERAL_CHAT',
};

const INTENT_RULES = [
    {
        intent: INTENTS.SUGGEST_TASKS,
        patterns: [
            /what should i (work on|do|focus)/i,
            /prioritize/i,
            /suggest/i,
            /today['’]?s tasks/i,
        ],
    },
    {
        intent: INTENTS.CREATE_TASK,
        patterns: [
            /\b(create|add|make|new)\b.*(task|ticket|todo|reminder)/i,
            /remind me to/i,
        ],
    },
];

function detectIntent(message) {
    for (const rule of INTENT_RULES) {
        if (rule.patterns.some((pattern) => pattern.test(message))) {
            return rule.intent;
        }
    }

    return null;
}

module.exports = {
    INTENTS,
    INTENT_RULES,
    detectIntent,
};
