const ApiError = require('../exceptions/ApiError');
const Conversation = require('../models/conversation.model');
const taskService = require('./task.service');
const userService = require('./user.service');
const logger = require('../utils/logger');
const { INTENTS, detectIntent } = require('../modules/ai/intentDetector');
const {
    DEFAULT_SYSTEM_PROMPT,
    buildClassificationPrompt,
    buildSuggestionPrompt,
    buildExtractionPrompt,
} = require('../modules/ai/promptBuilder');
const { parseTaskProposal } = require('../modules/ai/outputParser');
const { callGemini } = require('../modules/ai/llmClient');

const FALLBACK_REPLY = "I didn't quite catch that. Could you rephrase what you'd like to do?";
const SERVICE_ERROR_REPLY = "I'm having trouble right now. Please try again in a moment.";
const CREATE_TASK_CONFIRMATION_REPLY = "Here's the task I've structured for you. Does this look right?";
const CREATE_TASK_REPHRASE_REPLY = 'I had trouble structuring that task. Could you rephrase it with the task title and any details you know?';
const CREATE_TASK_CANCEL_REPLY = "No problem, let's adjust it. What would you like to change?";
const CREATE_TASK_SUCCESS_REPLY = 'Task created successfully!';
const ASSIGNEE_DECISION_REPLY = 'Should I keep this as a personal task/reminder, or assign it to someone else?';
const ASSIGNEE_IDENTITY_REPLY = 'Who should I assign it to? You can reply with their name or email.';
const ASSIGNEE_AMBIGUOUS_REPLY = 'I found multiple matching users. Please reply with the exact name or email of the assignee.';
const ASSIGNEE_NOT_FOUND_REPLY = "I couldn't find that user. Please reply with the exact name or email, or say 'me' to keep it personal.";
const MAX_HISTORY_MESSAGES = 10;
const MAX_SUGGESTION_TASKS = 10;

function trimMessages(messages) {
    return messages.slice(-MAX_HISTORY_MESSAGES);
}

function touchConversation(conversation) {
    conversation.lastActivity = new Date();
}

function appendMessage(conversation, role, content) {
    conversation.messages.push({ role, content });
    conversation.messages = trimMessages(conversation.messages);
}

async function getOrCreateConversation(userId) {
    const conversation = await Conversation.findOne({ userId });
    if (conversation) {
        return conversation;
    }

    return Conversation.create({ userId });
}

async function classifyIntentWithLlm(message, correlationId) {
    try {
        const classificationPrompt = buildClassificationPrompt(message);
        const rawIntent = await callGemini(DEFAULT_SYSTEM_PROMPT, [
            { role: 'user', content: classificationPrompt },
        ], {
            temperature: 0,
            maxOutputTokens: 16,
        });

        const intent = rawIntent.trim();
        return Object.values(INTENTS).includes(intent) ? intent : INTENTS.GENERAL_CHAT;
    } catch (error) {
        logger.warn('LLM intent classification failed, defaulting to GENERAL_CHAT', {
            correlationId,
            error: error.message,
        });
        return INTENTS.GENERAL_CHAT;
    }
}

function getPriorityWeight(priority) {
    if (priority === 'High') return 3;
    if (priority === 'Medium') return 2;
    return 1;
}

function getDueDate(task) {
    if (!task.dueDate) return null;
    const date = new Date(task.dueDate);
    return Number.isNaN(date.getTime()) ? null : date;
}

function sortTasksForSuggestions(tasks) {
    return [...tasks].sort((left, right) => {
        const leftDue = getDueDate(left);
        const rightDue = getDueDate(right);
        const leftOverdue = leftDue && leftDue < new Date();
        const rightOverdue = rightDue && rightDue < new Date();

        if (leftOverdue !== rightOverdue) {
            return leftOverdue ? -1 : 1;
        }

        const priorityDelta = getPriorityWeight(right.priority) - getPriorityWeight(left.priority);
        if (priorityDelta !== 0) {
            return priorityDelta;
        }

        if (leftDue && rightDue) {
            return leftDue - rightDue;
        }

        if (leftDue) return -1;
        if (rightDue) return 1;
        return 0;
    });
}

function formatTaskSummary(tasks) {
    const now = new Date();
    return tasks.map((task) => {
        const dueDate = getDueDate(task);
        let dueText = 'No due date';

        if (dueDate) {
            const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                dueText = `OVERDUE by ${Math.abs(diffDays)} days`;
            } else if (diffDays === 0) {
                dueText = 'Due today';
            } else {
                dueText = `Due: ${dueDate.toISOString().slice(0, 10)}`;
            }
        }

        return `- [${String(task.priority || 'Low').toUpperCase()}] ${task.title} | ${dueText} | ${String(task.status || 'Open').toUpperCase()}`;
    }).join('\n');
}

function buildExtractionState(conversation) {
    const proposal = conversation.pendingTaskProposal
        || conversation.taskCreationState?.draftTaskProposal
        || {};
    return {
        title: proposal.title || null,
        priority: proposal.priority || null,
        dueDate: proposal.dueDate ? new Date(proposal.dueDate).toISOString().slice(0, 10) : null,
        tags: Array.isArray(proposal.tags) ? proposal.tags : [],
    };
}

function normalizeMessage(message) {
    return String(message || '').trim().toLowerCase();
}

function isPersonalAssignmentResponse(message) {
    const normalized = normalizeMessage(message);
    return [
        'me',
        'myself',
        'self',
        'keep it personal',
        'personal',
        'no',
        'nope',
        'just me',
        'for me',
        'mine',
    ].includes(normalized);
}

function indicatesOtherAssignee(message) {
    const normalized = normalizeMessage(message);
    return normalized.includes('someone else')
        || normalized.includes('assign')
        || normalized.includes('to ')
        || normalized === 'yes'
        || normalized === 'yep';
}

function sanitizeUserLabel(user) {
    return user.name || user.email;
}

async function resolveAssigneeFromMessage(message, currentUserId) {
    const normalized = normalizeMessage(message);
    if (isPersonalAssignmentResponse(normalized)) {
        return { type: 'self' };
    }

    const users = await userService.getAllUsers();
    const availableUsers = users.filter((user) => String(user._id) !== String(currentUserId));
    const matches = availableUsers.filter((user) => {
        const name = String(user.name || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        return name === normalized
            || email === normalized
            || (name && normalized.includes(name))
            || (email && normalized.includes(email));
    });

    if (matches.length === 1) {
        return {
            type: 'other',
            user: matches[0],
        };
    }

    if (matches.length > 1) {
        return { type: 'ambiguous' };
    }

    return { type: 'not_found' };
}

function finalizeTaskProposal(conversation, proposal, assignee) {
    const finalizedProposal = {
        ...proposal,
        assignee,
    };

    conversation.pendingTaskProposal = finalizedProposal;
    conversation.taskCreationState = null;
    appendMessage(conversation, 'model', CREATE_TASK_CONFIRMATION_REPLY);

    return {
        intent: INTENTS.CREATE_TASK,
        reply: CREATE_TASK_CONFIRMATION_REPLY,
        taskProposal: finalizedProposal,
    };
}

async function handleTaskAssignmentStep(userId, conversation, message) {
    const draftProposal = conversation.taskCreationState?.draftTaskProposal;
    if (!draftProposal) {
        conversation.taskCreationState = null;
        return {
            intent: INTENTS.CREATE_TASK,
            reply: FALLBACK_REPLY,
            taskProposal: null,
        };
    }

    if (conversation.taskCreationState.stage === 'awaiting_assignee_decision') {
        if (isPersonalAssignmentResponse(message)) {
            return finalizeTaskProposal(conversation, draftProposal, userId);
        }

        if (indicatesOtherAssignee(message)) {
            const resolved = await resolveAssigneeFromMessage(message, userId);
            if (resolved.type === 'other') {
                return finalizeTaskProposal(conversation, draftProposal, String(resolved.user._id));
            }

            conversation.taskCreationState = {
                ...conversation.taskCreationState,
                stage: 'awaiting_assignee_identity',
            };

            const reply = resolved.type === 'ambiguous' ? ASSIGNEE_AMBIGUOUS_REPLY : ASSIGNEE_IDENTITY_REPLY;
            appendMessage(conversation, 'model', reply);
            return {
                intent: INTENTS.CREATE_TASK,
                reply,
                taskProposal: null,
            };
        }

        appendMessage(conversation, 'model', ASSIGNEE_DECISION_REPLY);
        return {
            intent: INTENTS.CREATE_TASK,
            reply: ASSIGNEE_DECISION_REPLY,
            taskProposal: null,
        };
    }

    if (conversation.taskCreationState.stage === 'awaiting_assignee_identity') {
        const resolved = await resolveAssigneeFromMessage(message, userId);
        if (resolved.type === 'self') {
            return finalizeTaskProposal(conversation, draftProposal, userId);
        }
        if (resolved.type === 'other') {
            return finalizeTaskProposal(conversation, draftProposal, String(resolved.user._id));
        }

        const reply = resolved.type === 'ambiguous' ? ASSIGNEE_AMBIGUOUS_REPLY : ASSIGNEE_NOT_FOUND_REPLY;
        appendMessage(conversation, 'model', reply);
        return {
            intent: INTENTS.CREATE_TASK,
            reply,
            taskProposal: null,
        };
    }

    return {
        intent: INTENTS.CREATE_TASK,
        reply: FALLBACK_REPLY,
        taskProposal: null,
    };
}

async function resolveIntent(message, conversation, correlationId) {
    const ruleMatch = detectIntent(message);
    if (ruleMatch) {
        return ruleMatch;
    }

    if (conversation.activeIntent === INTENTS.CREATE_TASK) {
        return INTENTS.CREATE_TASK;
    }

    return classifyIntentWithLlm(message, correlationId);
}

async function handleSuggestTasks(userId, conversation, correlationId) {
    const tasks = await taskService.getTasksByUser(userId);
    const summary = formatTaskSummary(sortTasksForSuggestions(tasks).slice(0, MAX_SUGGESTION_TASKS));
    const prompt = buildSuggestionPrompt(summary);

    const reply = await callGemini(DEFAULT_SYSTEM_PROMPT, [
        ...conversation.messages,
        { role: 'user', content: prompt },
    ], {
        temperature: 0.2,
        maxOutputTokens: 128,
    });

    appendMessage(conversation, 'model', reply);
    conversation.activeIntent = INTENTS.SUGGEST_TASKS;

    logger.info('AI suggestion reply generated', {
        userId,
        correlationId,
        taskCount: tasks.length,
    });

    return {
        intent: INTENTS.SUGGEST_TASKS,
        reply,
        taskProposal: null,
    };
}

async function handleCreateTask(conversation, correlationId) {
    const extracted = buildExtractionState(conversation);
    const prompt = buildExtractionPrompt(conversation.messages, extracted);
    const rawReply = await callGemini(DEFAULT_SYSTEM_PROMPT, [
        { role: 'user', content: prompt },
    ], {
        temperature: 0.1,
        maxOutputTokens: 192,
    });
    const parsed = parseTaskProposal(rawReply);

    conversation.activeIntent = INTENTS.CREATE_TASK;

    if (parsed.taskProposal) {
        conversation.pendingTaskProposal = null;
        conversation.taskCreationState = {
            stage: 'awaiting_assignee_decision',
            draftTaskProposal: parsed.taskProposal,
        };
        appendMessage(conversation, 'model', ASSIGNEE_DECISION_REPLY);

        logger.info('AI task proposal generated', {
            correlationId,
        });

        return {
            intent: INTENTS.CREATE_TASK,
            reply: ASSIGNEE_DECISION_REPLY,
            taskProposal: null,
        };
    }

    if (parsed.validationError) {
        logger.warn('AI task proposal failed validation', {
            correlationId,
            error: parsed.validationError.message,
            rawReply,
        });

        appendMessage(conversation, 'model', CREATE_TASK_REPHRASE_REPLY);
        return {
            intent: INTENTS.CREATE_TASK,
            reply: CREATE_TASK_REPHRASE_REPLY,
            taskProposal: null,
        };
    }

    const reply = parsed.reply || FALLBACK_REPLY;
    appendMessage(conversation, 'model', reply);

    return {
        intent: INTENTS.CREATE_TASK,
        reply,
        taskProposal: null,
    };
}

async function handleGeneralChat(conversation) {
    const reply = FALLBACK_REPLY;
    appendMessage(conversation, 'model', reply);
    conversation.activeIntent = INTENTS.GENERAL_CHAT;

    return {
        intent: INTENTS.GENERAL_CHAT,
        reply,
        taskProposal: null,
    };
}

async function chat(userId, message, correlationId) {
    const conversation = await getOrCreateConversation(userId);
    touchConversation(conversation);
    appendMessage(conversation, 'user', message);

    try {
        if (conversation.taskCreationState?.stage) {
            const response = await handleTaskAssignmentStep(userId, conversation, message);
            touchConversation(conversation);
            await conversation.save();
            return response;
        }

        const intent = await resolveIntent(message, conversation, correlationId);
        let response;

        if (intent === INTENTS.SUGGEST_TASKS) {
            response = await handleSuggestTasks(userId, conversation, correlationId);
        } else if (intent === INTENTS.CREATE_TASK) {
            response = await handleCreateTask(conversation, correlationId);
        } else {
            response = await handleGeneralChat(conversation);
        }

        touchConversation(conversation);
        await conversation.save();
        return response;
    } catch (error) {
        logger.error('AI chat handling failed', {
            userId,
            correlationId,
            error: error.message,
        });

        appendMessage(conversation, 'model', SERVICE_ERROR_REPLY);
        touchConversation(conversation);
        await conversation.save();

        return {
            intent: conversation.activeIntent || INTENTS.GENERAL_CHAT,
            reply: SERVICE_ERROR_REPLY,
            taskProposal: null,
        };
    }
}

async function confirmTask(userId, confirmed, correlationId) {
    const conversation = await Conversation.findOne({ userId });

    if (!conversation || !conversation.pendingTaskProposal) {
        throw new ApiError(400, 'No pending task to confirm');
    }

    if (!confirmed) {
        conversation.pendingTaskProposal = null;
        conversation.taskCreationState = null;
        conversation.activeIntent = INTENTS.CREATE_TASK;
        appendMessage(conversation, 'model', CREATE_TASK_CANCEL_REPLY);
        touchConversation(conversation);
        await conversation.save();

        return {
            intent: INTENTS.CREATE_TASK,
            reply: CREATE_TASK_CANCEL_REPLY,
            taskProposal: null,
        };
    }

    const task = await taskService.createTask(userId, {
        ...conversation.pendingTaskProposal,
        assignee: conversation.pendingTaskProposal.assignee || userId,
        correlationId,
    });

    conversation.pendingTaskProposal = null;
    conversation.taskCreationState = null;
    conversation.activeIntent = null;
    appendMessage(conversation, 'model', CREATE_TASK_SUCCESS_REPLY);
    touchConversation(conversation);
    await conversation.save();

    logger.info('AI task proposal confirmed and created', {
        userId,
        correlationId,
        taskId: task._id,
    });

    return {
        intent: INTENTS.CREATE_TASK,
        reply: CREATE_TASK_SUCCESS_REPLY,
        taskProposal: null,
        task,
    };
}

async function clearConversation(userId) {
    await Conversation.findOneAndDelete({ userId });
    return {
        reply: 'Conversation cleared.',
    };
}

module.exports = {
    FALLBACK_REPLY,
    chat,
    confirmTask,
    clearConversation,
    formatTaskSummary,
    sortTasksForSuggestions,
};
