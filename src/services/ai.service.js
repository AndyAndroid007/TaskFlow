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
        const response = await callGemini('', [
            { role: 'user', content: classificationPrompt },
        ], {
            temperature: 0,
            maxOutputTokens: 16,
        });

        const intent = response.type === 'text' ? response.text.trim() : '';
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
        description: proposal.description || null,
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
        || normalized === 'yes'
        || normalized === 'yep';
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
    conversation.markModified('pendingTaskProposal');
    conversation.taskCreationState = null;
    conversation.markModified('taskCreationState');
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
            conversation.markModified('taskCreationState');

            const reply = resolved.type === 'ambiguous' ? ASSIGNEE_AMBIGUOUS_REPLY : ASSIGNEE_IDENTITY_REPLY;
            appendMessage(conversation, 'model', reply);
            return {
                intent: INTENTS.CREATE_TASK,
                reply,
                taskProposal: null,
                showUserSelection: true,
            };
        }

        appendMessage(conversation, 'model', ASSIGNEE_DECISION_REPLY);
        return {
            intent: INTENTS.CREATE_TASK,
            reply: ASSIGNEE_DECISION_REPLY,
            taskProposal: null,
            showUserSelection: true,
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
            showUserSelection: true,
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

    const priorMessages = conversation.messages.slice(0, -1);
    const response = await callGemini(DEFAULT_SYSTEM_PROMPT, [
        ...priorMessages,
        { role: 'user', content: prompt },
    ], {
        temperature: 0.2,
        maxOutputTokens: 128,
    });
    
    const reply = response.type === 'text' ? response.text : FALLBACK_REPLY;

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
    const prompt = buildExtractionPrompt(extracted);
    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nEXTRACTION MODE:\n${prompt}`;
    
    const tools = [{
        functionDeclarations: [{
            name: 'propose_task',
            description: 'Propose a structured task to be created based on the user\'s input. Use this tool ONLY when you have enough context to infer a task title.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    title: { type: 'STRING', description: 'The title of the task' },
                    description: { type: 'STRING', description: 'Details about the task' },
                    priority: { type: 'STRING', enum: ['Low', 'Medium', 'High'], description: 'Task priority' },
                    dueDate: { type: 'STRING', description: 'ISO 8601 date string for due date, if mentioned' },
                    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Relevant tags' }
                },
                required: ['title']
            }
        }]
    }];

    const response = await callGemini(systemPrompt, conversation.messages, {
        temperature: 0.1,
        maxOutputTokens: 192,
        tools
    });

    conversation.activeIntent = INTENTS.CREATE_TASK;

    if (response.type === 'function_call' && response.functionCall?.name === 'propose_task') {
        const freshFields = response.functionCall.args || {};
        
        if (conversation.pendingTaskProposal) {
            // Refinement path: user sent a follow-up like "set priority to High and due date tomorrow".
            // Merge: existing proposal is the base; only override fields the LLM explicitly returned.
            const existing = conversation.pendingTaskProposal;
            const mergedProposal = { ...existing };

            if (freshFields.title && freshFields.title !== 'Unknown') mergedProposal.title = freshFields.title;
            if (freshFields.description != null) mergedProposal.description = freshFields.description;
            if (freshFields.priority) mergedProposal.priority = freshFields.priority;
            if (freshFields.dueDate) mergedProposal.dueDate = freshFields.dueDate;
            if (Array.isArray(freshFields.tags) && freshFields.tags.length > 0) mergedProposal.tags = freshFields.tags;

            conversation.pendingTaskProposal = mergedProposal;
            conversation.markModified('pendingTaskProposal');
            conversation.taskCreationState = null;
            conversation.markModified('taskCreationState');

            const reply = "I've updated the proposal with your changes. Does this look right?";
            appendMessage(conversation, 'model', reply);

            logger.info('AI task proposal refined via follow-up', { correlationId });

            return {
                intent: INTENTS.CREATE_TASK,
                reply,
                taskProposal: mergedProposal,
            };
        } else {
            conversation.pendingTaskProposal = null;
            conversation.markModified('pendingTaskProposal');
            conversation.taskCreationState = {
                stage: 'awaiting_assignee_decision',
                draftTaskProposal: freshFields,
            };
            conversation.markModified('taskCreationState');
            appendMessage(conversation, 'model', ASSIGNEE_DECISION_REPLY);

            logger.info('AI task proposal generated via tool', {
                correlationId,
            });

            return {
                intent: INTENTS.CREATE_TASK,
                reply: ASSIGNEE_DECISION_REPLY,
                taskProposal: null,
                showUserSelection: true,
            };
        }
    }

    const reply = response.type === 'text' && response.text ? response.text : FALLBACK_REPLY;
    appendMessage(conversation, 'model', reply);

    // If there's already a pending proposal and the LLM responded with text
    // (e.g. it got confused after the assignee flow), keep the existing proposal
    // visible so the card stays intact for the user.
    const existingProposal = conversation.pendingTaskProposal || null;

    return {
        intent: INTENTS.CREATE_TASK,
        reply,
        taskProposal: existingProposal,
    };
}

async function handleGeneralChat(userId, conversation, correlationId) {
    let reply;
    try {
        const tasks = await taskService.getTasksByUser(userId);
        const taskSummary = tasks.length > 0 
            ? `Current tasks for the user:\n${formatTaskSummary(tasks)}`
            : 'The user has no tasks currently.';
            
        const contextPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nUSER CONTEXT:\n${taskSummary}`;

        const response = await callGemini(contextPrompt, conversation.messages, {
            temperature: 0.4,
            maxOutputTokens: 128,
        });
        reply = response.type === 'text' ? response.text : FALLBACK_REPLY;
    } catch (error) {
        logger.warn('LLM general chat call failed, using fallback', { correlationId, error: error.message });
        reply = FALLBACK_REPLY;
    }

    appendMessage(conversation, 'model', reply);
    conversation.activeIntent = INTENTS.GENERAL_CHAT;

    return {
        intent: INTENTS.GENERAL_CHAT,
        reply,
        taskProposal: null,
    };
}

async function handleDeleteTask(userId, conversation, correlationId) {
    conversation.activeIntent = INTENTS.DELETE_TASK;
    const tasks = await taskService.getTasksByUser(userId);
    const taskSummary = tasks.length > 0 
        ? `Here are the user's current tasks:\n${tasks.map(t => `- ID: ${t._id} | Title: ${t.title}`).join('\n')}`
        : 'The user has no tasks.';

    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nTASK LIST:\n${taskSummary}\n\nInstructions:\n1. If the user identifies a specific task to delete (e.g., by name, ID, or by saying 'this' when there's only one task or it was recently discussed), call the propose_deletion tool with its ID.\n2. If the user has only ONE task and says "delete it" or "delete this task", proceed with that task.\n3. If it is truly ambiguous, ask the user to clarify which task from the list above.`;
    
    const tools = [{
        functionDeclarations: [{
            name: 'propose_deletion',
            description: 'Propose to delete a specific task by its ID. This will show a confirmation card to the user.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    taskId: { type: 'STRING', description: 'The unique ID of the task to delete' }
                },
                required: ['taskId']
            }
        }]
    }];

    const response = await callGemini(systemPrompt, conversation.messages, {
        temperature: 0.1,
        maxOutputTokens: 128,
        tools
    });

    if (response.type === 'function_call' && response.functionCall?.name === 'propose_deletion') {
        const { taskId } = response.functionCall.args;
        const task = tasks.find(t => String(t._id) === String(taskId));
        
        if (task) {
            const proposal = {
                action: 'delete',
                taskId: task._id,
                taskTitle: task.title,
                taskData: task
            };
            conversation.pendingTaskProposal = proposal;
            conversation.markModified('pendingTaskProposal');
            const reply = `I've found the task "${task.title}". Are you sure you want to delete it?`;
            appendMessage(conversation, 'model', reply);
            return { intent: INTENTS.DELETE_TASK, reply, taskProposal: proposal };
        }
    }

    const reply = response.type === 'text' ? response.text : 'Which task should I delete?';
    appendMessage(conversation, 'model', reply);
    return { intent: INTENTS.DELETE_TASK, reply, taskProposal: null };
}

async function handleUpdateTask(userId, conversation, correlationId) {
    conversation.activeIntent = INTENTS.UPDATE_TASK;
    const tasks = await taskService.getTasksByUser(userId);
    const taskSummary = tasks.length > 0 
        ? `User's current tasks:\n${tasks.map(t => `- ID: ${t._id} | Title: ${t.title} | Priority: ${t.priority} | Status: ${t.status}`).join('\n')}`
        : 'No tasks found.';

    let currentProposalContext = '';
    if (conversation.pendingTaskProposal && conversation.pendingTaskProposal.action === 'update') {
        const p = conversation.pendingTaskProposal;
        currentProposalContext = `\n\nCURRENT PENDING UPDATES for task "${p.taskTitle}" (not yet applied):\n${JSON.stringify(p.updates, null, 2)}`;
    }

    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nTASK LIST:\n${taskSummary}${currentProposalContext}\n\nInstructions:\n1. If the user wants to update a task and specifies which one, call the propose_update tool.\n2. If there are CURRENT PENDING UPDATES shown above, the user is refining them. Provide the new values for the fields the user is mentioning.\n3. For tags, if the user wants to "remove" a tag, provide the new complete list of tags excluding the removed one.`;

    const tools = [{
        functionDeclarations: [{
            name: 'propose_update',
            description: 'Propose updates to an existing task.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    taskId: { type: 'STRING', description: 'ID of the task to update' },
                    title: { type: 'STRING' },
                    description: { type: 'STRING' },
                    priority: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
                    status: { type: 'STRING', enum: ['Open', 'In Progress', 'In Review', 'Completed'] },
                    dueDate: { type: 'STRING' },
                    tags: { type: 'ARRAY', items: { type: 'STRING' } }
                },
                required: ['taskId']
            }
        }]
    }];

    const response = await callGemini(systemPrompt, conversation.messages, {
        temperature: 0.1,
        maxOutputTokens: 192,
        tools
    });

    if (response.type === 'function_call' && response.functionCall?.name === 'propose_update') {
        const { taskId, ...freshUpdates } = response.functionCall.args;
        const task = tasks.find(t => String(t._id) === String(taskId));
        
        if (task) {
            let finalUpdates = freshUpdates;
            let finalTaskData;

            // If we're refining an existing update proposal for the SAME task, merge them.
            if (conversation.pendingTaskProposal && 
                conversation.pendingTaskProposal.action === 'update' && 
                String(conversation.pendingTaskProposal.taskId) === String(taskId)) {
                
                finalUpdates = {
                    ...conversation.pendingTaskProposal.updates,
                    ...freshUpdates
                };
                finalTaskData = {
                    ...task.toObject(),
                    ...finalUpdates
                };
            } else {
                finalTaskData = {
                    ...task.toObject(),
                    ...freshUpdates
                };
            }

            const proposal = {
                action: 'update',
                taskId: task._id,
                taskTitle: task.title,
                updates: finalUpdates,
                taskData: finalTaskData,
                originalTask: task.toObject()
            };
            conversation.pendingTaskProposal = proposal;
            conversation.markModified('pendingTaskProposal');
            const reply = `I've prepared the updates for "${task.title}". Should I apply them?`;
            appendMessage(conversation, 'model', reply);
            return { intent: INTENTS.UPDATE_TASK, reply, taskProposal: proposal };
        }
    }

    const reply = response.type === 'text' ? response.text : 'Which task should I update and what changes should I make?';
    appendMessage(conversation, 'model', reply);
    return { intent: INTENTS.UPDATE_TASK, reply, taskProposal: null };
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

        if (intent === INTENTS.CANCEL) {
            conversation.pendingTaskProposal = null;
            conversation.markModified('pendingTaskProposal');
            conversation.taskCreationState = null;
            conversation.markModified('taskCreationState');
            conversation.activeIntent = null;
            const reply = "No problem. I've cancelled the current process. What else can I help you with?";
            appendMessage(conversation, 'model', reply);
            touchConversation(conversation);
            await conversation.save();
            return { intent: INTENTS.CANCEL, reply, taskProposal: null };
        }

        if (intent === INTENTS.SUGGEST_TASKS) {
            response = await handleSuggestTasks(userId, conversation, correlationId);
        } else if (intent === INTENTS.CREATE_TASK) {
            response = await handleCreateTask(conversation, correlationId);
        } else if (intent === INTENTS.DELETE_TASK) {
            response = await handleDeleteTask(userId, conversation, correlationId);
        } else if (intent === INTENTS.UPDATE_TASK) {
            response = await handleUpdateTask(userId, conversation, correlationId);
        } else {
            response = await handleGeneralChat(userId, conversation, correlationId);
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

async function confirmTask(userId, confirmed, correlationId, updatedData = null) {
    const conversation = await Conversation.findOne({ userId });

    if (!conversation || !conversation.pendingTaskProposal) {
        throw new ApiError(400, 'No pending task to confirm');
    }

    const proposal = conversation.pendingTaskProposal;

    if (!confirmed) {
        conversation.pendingTaskProposal = null;
        conversation.markModified('pendingTaskProposal');
        conversation.taskCreationState = null;
        conversation.markModified('taskCreationState');
        conversation.activeIntent = null;
        
        const reply = proposal.action === 'delete'
            ? 'Deletion cancelled.'
            : proposal.action === 'update'
                ? 'Update cancelled.'
                : 'Task creation cancelled.';
        appendMessage(conversation, 'model', reply);
        touchConversation(conversation);
        await conversation.save();

        return {
            intent: conversation.activeIntent || INTENTS.GENERAL_CHAT,
            reply,
            taskProposal: null,
        };
    }

    let result;
    let reply;

    if (proposal.action === 'delete') {
        await taskService.deleteTask(userId, proposal.taskId, correlationId);
        reply = `Task "${proposal.taskTitle}" deleted successfully.`;
        result = { intent: INTENTS.DELETE_TASK, reply, taskProposal: null };
    } else if (proposal.action === 'update') {
        const updateData = updatedData || proposal.updates;
        const updated = await taskService.updateTask(userId, proposal.taskId, {
            ...updateData,
            correlationId,
        });
        reply = `Task "${proposal.taskTitle}" updated successfully.`;
        result = { intent: INTENTS.UPDATE_TASK, reply, taskProposal: null, task: updated };
    } else {
        // Fallback to creation logic
        const taskData = updatedData || proposal;
        const task = await taskService.createTask(userId, {
            ...taskData,
            assignee: taskData.assignee || userId,
            correlationId,
        });
        reply = CREATE_TASK_SUCCESS_REPLY;
        result = { intent: INTENTS.CREATE_TASK, reply, taskProposal: null, task };
    }

    conversation.pendingTaskProposal = null;
    conversation.markModified('pendingTaskProposal');
    conversation.taskCreationState = null;
    conversation.markModified('taskCreationState');
    conversation.activeIntent = null;
    appendMessage(conversation, 'model', reply);
    touchConversation(conversation);
    await conversation.save();

    logger.info('AI proposal confirmed', {
        userId,
        correlationId,
        action: proposal.action || 'create',
    });

    return result;
}

async function clearConversation(userId) {
    await Conversation.findOneAndDelete({ userId });
    logger.info('AI conversation cleared', { userId });
    return {
        reply: 'Conversation cleared.',
    };
}

async function getConversation(userId) {
    const conversation = await Conversation.findOne({ userId });

    if (!conversation) {
        return {
            messages: [],
            activeIntent: null,
            pendingTaskProposal: null,
            taskCreationState: null,
        };
    }

    const showUserSelection = !!(conversation.taskCreationState && 
        ['awaiting_assignee_decision', 'awaiting_assignee_identity'].includes(conversation.taskCreationState.stage));

    return {
        messages: conversation.messages || [],
        activeIntent: conversation.activeIntent || null,
        pendingTaskProposal: conversation.pendingTaskProposal || null,
        taskCreationState: conversation.taskCreationState || null,
        showUserSelection
    };
}

module.exports = {
    FALLBACK_REPLY,
    chat,
    confirmTask,
    clearConversation,
    getConversation,
    formatTaskSummary,
    sortTasksForSuggestions,
};
