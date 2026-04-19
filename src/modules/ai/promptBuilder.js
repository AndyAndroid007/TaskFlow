const DEFAULT_SYSTEM_PROMPT = [
    "You are TaskFlow's AI assistant. Your job is to help users manage their tasks.",
    '',
    'Rules you must follow:',
    '- You cannot access the database. The backend provides you all task data.',
    '- For task creation, you must extract: title (required), priority (Low/Medium/High), dueDate (ISO 8601), tags (array of strings).',
    '- Do not ask about assignee. The backend handles assignment separately.',
    '- If required fields are missing, ask ONE clarifying question at a time. Never ask multiple questions in the same message.',
    '- When all fields are collected, return ONLY a JSON object inside a <task> XML tag. No other text outside it.',
    '- Never invent task data. Only use what the user tells you.',
    '- For suggestions, only reference tasks explicitly provided to you in the context.',
    '- Keep replies concise (under 100 words). Be friendly but professional.',
].join('\n');

function buildClassificationPrompt(message) {
    return [
        'Classify the following user message into exactly one of these intents:',
        'SUGGEST_TASKS, CREATE_TASK, GENERAL_CHAT',
        '',
        'Rules:',
        '- SUGGEST_TASKS: user wants help deciding what to work on',
        '- CREATE_TASK: user wants to create a new task or reminder',
        '- GENERAL_CHAT: anything else',
        '',
        'Reply with only the intent label, nothing else.',
        '',
        `Message: "${message}"`,
    ].join('\n');
}

function buildSuggestionPrompt(taskSummary) {
    const normalizedSummary = taskSummary || '- No current tasks available.';

    return [
        'The user wants task suggestions. Here is their current task list (pre-filtered to top 10):',
        '',
        normalizedSummary,
        '',
        'Based on priority (High > Medium > Low) and overdue status (overdue tasks first), recommend what the user should focus on today. Keep your answer under 80 words.',
    ].join('\n');
}

function buildExtractionPrompt(history, extracted) {
    const historyText = history.length
        ? history.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n')
        : 'No previous conversation.';

    return [
        'You are collecting information to create a new task. Extract task details from the conversation.',
        '',
        'Current conversation history is provided. Based on what you know so far:',
        `- title: ${extracted.title || 'MISSING'}`,
        `- priority: ${extracted.priority || 'MISSING'}`,
        `- dueDate: ${extracted.dueDate || 'MISSING'}`,
        `- tags: ${Array.isArray(extracted.tags) && extracted.tags.length ? extracted.tags.join(', ') : 'MISSING'}`,
        '',
        'Conversation history:',
        historyText,
        '',
        'If any field marked MISSING is still unknown after reading the history:',
        '- Ask the user ONE specific question for the FIRST missing field only.',
        '',
        'If all required fields (title is enough to proceed) are present:',
        '- Return the task as JSON wrapped in <task> tags like this:',
        '<task>{"title":"...","priority":"...","dueDate":"...","tags":["..."],"status":"Open"}</task>',
    ].join('\n');
}

module.exports = {
    DEFAULT_SYSTEM_PROMPT,
    buildClassificationPrompt,
    buildSuggestionPrompt,
    buildExtractionPrompt,
};
