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

function stripRestrictedFields(data) {
    if (!data || typeof data !== 'object') return data;
    const { _id, userId, createdAt, updatedAt, __v, assigneeDisplay, assignmentType, action, taskId, taskTitle, updates, originalTask, ...clean } = data;
    return clean;
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
        console.log('[STAGE]: Intent Classification');
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
    const proposal = conversation.pendingTaskProposal || {};
    return {
        title: proposal.title || null,
        description: proposal.description || null,
        priority: proposal.priority || 'Medium',
        dueDate: proposal.dueDate ? new Date(proposal.dueDate).toISOString().slice(0, 10) : null,
        tags: Array.isArray(proposal.tags) ? proposal.tags : [],
        assignee: proposal.assigneeDisplay || (proposal.assignee === conversation.userId ? 'me' : null),
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

    // 1. Try exact email match (Highest priority)
    const exactEmail = availableUsers.find((u) => (u.email || '').toLowerCase() === normalized);
    if (exactEmail) {
        return {
            type: 'other',
            user: exactEmail,
        };
    }

    // 2. Try exact name match
    const exactName = availableUsers.find((u) => (u.name || '').toLowerCase() === normalized);
    if (exactName) {
        return {
            type: 'other',
            user: exactName,
        };
    }

    // 3. Try partial name matches if no exact match found
    const matches = availableUsers.filter((user) => {
        const name = String(user.name || '').toLowerCase();
        // For names, we allow partial matches if the input is part of the name or vice versa
        return name && (name.includes(normalized) || normalized.includes(name));
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

// Removed handleTaskAssignmentStep as we are moving to a state-driven flow.

async function resolveIntent(message, conversation, correlationId) {
    const ruleMatch = detectIntent(message);
    if (ruleMatch) {
        return ruleMatch;
    }

    // Preserve multi-step intents if no new intent is explicitly detected.
    if ([INTENTS.CREATE_TASK, INTENTS.UPDATE_TASK, INTENTS.DELETE_TASK].includes(conversation.activeIntent)) {
        return conversation.activeIntent;
    }

    return classifyIntentWithLlm(message, correlationId);
}

async function handleSuggestTasks(userId, conversation, correlationId) {
    const tasks = await taskService.getTasksByUser(userId);
    const summary = formatTaskSummary(sortTasksForSuggestions(tasks).slice(0, MAX_SUGGESTION_TASKS));
    const prompt = buildSuggestionPrompt(summary);

    console.log('[STAGE]: Task Suggestions');
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

async function handleCreateTask(userId, conversation, correlationId) {
    const extracted = buildExtractionState(conversation);
    const prompt = buildExtractionPrompt(extracted);
    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nEXTRACTION MODE:\n${prompt}`;

    console.log('[STAGE]: Task Extraction/Creation');

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
                    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Relevant tags' },
                    assignee: { type: 'STRING', description: 'The person to assign the task to (e.g., "me", "myself", or a specific name)' }
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
        const existing = conversation.pendingTaskProposal || {};
        
        const mergedProposal = {
            priority: 'Medium',
            tags: [],
            ...existing,
            ...freshFields
        };

        let showUserSelection = false;
        let reply;

        if (freshFields.assignee) {
            const assigneeInput = normalizeMessage(freshFields.assignee);
            
            if (indicatesOtherAssignee(assigneeInput) && !availableUsers.some(u => (u.name || '').toLowerCase() === assigneeInput)) {
                // If it's a generic "assign to someone else" and NOT an exact match for a user named "someone else"
                showUserSelection = true;
                reply = "Who should I assign it to? Select from the list or type their name/email.";
                mergedProposal.assigneeDisplay = freshFields.assignee;
            } else {
                const resolved = await resolveAssigneeFromMessage(freshFields.assignee, userId);
                if (resolved.type === 'other') {
                    mergedProposal.assignee = String(resolved.user._id);
                    mergedProposal.assigneeDisplay = resolved.user.name || resolved.user.email;
                    mergedProposal.assignmentType = 'team';
                } else if (resolved.type === 'self' || freshFields.assignee === 'me' || freshFields.assignee === 'myself') {
                    mergedProposal.assignee = userId;
                    mergedProposal.assigneeDisplay = 'me';
                    mergedProposal.assignmentType = 'personal';
                } else if (resolved.type === 'ambiguous') {
                    mergedProposal.assigneeDisplay = freshFields.assignee;
                    showUserSelection = true;
                    reply = ASSIGNEE_AMBIGUOUS_REPLY;
                } else {
                    mergedProposal.assigneeDisplay = freshFields.assignee;
                    showUserSelection = true;
                    reply = `I couldn't find a user matching "${freshFields.assignee}". You can select from the list or keep it as a personal task.`;
                }
            }
        } else if (!mergedProposal.assignee) {
            mergedProposal.assignee = userId;
            mergedProposal.assigneeDisplay = 'me';
            mergedProposal.assignmentType = 'personal';
        }

        conversation.pendingTaskProposal = mergedProposal;
        conversation.markModified('pendingTaskProposal');
        conversation.taskCreationState = null;
        conversation.markModified('taskCreationState');

        const isRefinement = !!existing.title;
        if (!reply) {
            reply = isRefinement 
                ? "I've updated the proposal with your changes. Does this look right?"
                : "Here's the task I've structured for you. Does this look right?";
        }
        
        appendMessage(conversation, 'model', reply);
        logger.info(isRefinement ? 'AI task proposal refined' : 'AI task proposal generated', { correlationId });

        return {
            intent: INTENTS.CREATE_TASK,
            reply,
            taskProposal: mergedProposal,
            showUserSelection
        };
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

        console.log('[STAGE]: General Chat');
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
        ? `Task Context (INTERNAL USE ONLY - NEVER SHOW IDs):\n${tasks.map(t => `<task id="${t._id}" title="${t.title}" />`).join('\n')}`
        : 'The user has no tasks.';

    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\n${taskSummary}\n\nInstructions:\n1. If the user identifies a specific task to delete (e.g., by title, number, or relative position like "the first one"), call the propose_deletion tool with its ID.\n2. CRITICAL: NEVER include the task ID (e.g., '69edc...') in your text response. Refer to tasks only by their titles.\n3. If the user just says "delete the task", "delete it", or "remove a task", YOU MUST NOT call the tool yet, even if there is only one task. Instead, respond with text asking "Which task would you like to delete?" and list the available titles for them to choose from.\n4. DO NOT guess which task the user means based on recency or singular availability. Always force the user to identify the task by title or number first.`;
    console.log('[STAGE]: Task Deletion');

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
    const users = await userService.getAllUsers();
    const availableUsers = users.filter((user) => String(user._id) !== String(userId));
    const tasks = await taskService.getTasksByUser(userId);
    const taskSummary = tasks.length > 0
        ? `Task Context (INTERNAL USE ONLY - NEVER SHOW IDs):\n${tasks.map(t => `<task id="${t._id}" title="${t.title}" priority="${t.priority}" status="${t.status}" />`).join('\n')}`
        : 'No tasks found.';

    let currentProposalContext = '';
    if (conversation.pendingTaskProposal && conversation.pendingTaskProposal.action === 'update') {
        const p = conversation.pendingTaskProposal;
        currentProposalContext = `\n\nCURRENT PENDING UPDATES for task "${p.taskTitle}" (not yet applied):\n${JSON.stringify(p.updates, null, 2)}`;
    }

    const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\n${taskSummary}${currentProposalContext}\n\nInstructions:\n1. If the user identifies a specific task to update (e.g., by title, number, or relative position like "the first one") AND specifies what to change, call the propose_update tool.\n2. CRITICAL: NEVER include internal IDs (e.g., '69edc...') in your text response. Refer to tasks only by title.\n3. If the user just says "update", "update the task", "edit", or "change something" without specifying WHICH task or WHAT to change, YOU MUST NOT CALL THE TOOL. Instead, respond with text asking for clarification.\n4. DO NOT guess, assume, or suggest random edits. If the user is ambiguous, ask for clarification.\n5. If there are CURRENT PENDING UPDATES shown above, the user is refining them.\n6. For tags, if the user wants to "remove" a tag, provide the new complete list of tags excluding the removed one.\n7. For assignments, if the user says "assign to me", provide "me" for the assignee field.`;
    console.log('[STAGE]: Task Update');

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
                    tags: { type: 'ARRAY', items: { type: 'STRING' } },
                    assignee: { type: 'STRING', description: 'The person to assign the task to (e.g., "me", "myself", or a specific name)' }
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

        // Guard: If the model called the tool but didn't provide any actual updates, reject it.
        if (Object.keys(freshUpdates).length === 0) {
            const reply = "I understand you want to update the task. What exactly would you like to change?";
            appendMessage(conversation, 'model', reply);
            return { intent: INTENTS.UPDATE_TASK, reply, taskProposal: null };
        }

        const task = tasks.find(t => String(t._id) === String(taskId));

        if (task) {
            let finalUpdates = freshUpdates;
            let showUserSelection = false;
            let reply;

            if (freshUpdates.assignee) {
                const assigneeInput = normalizeMessage(freshUpdates.assignee);
                if (indicatesOtherAssignee(assigneeInput) && !availableUsers.some(u => (u.name || '').toLowerCase() === assigneeInput)) {
                    showUserSelection = true;
                    reply = "Who should I assign it to? Select from the list or type their name/email.";
                    finalUpdates.assigneeDisplay = freshUpdates.assignee;
                } else {
                    const resolved = await resolveAssigneeFromMessage(freshUpdates.assignee, userId);
                    if (resolved.type === 'other') {
                        finalUpdates.assignee = String(resolved.user._id);
                        finalUpdates.assigneeDisplay = resolved.user.name || resolved.user.email;
                        finalUpdates.assignmentType = 'team';
                    } else if (resolved.type === 'self' || freshUpdates.assignee === 'me' || freshUpdates.assignee === 'myself') {
                        finalUpdates.assignee = userId;
                        finalUpdates.assigneeDisplay = 'me';
                        finalUpdates.assignmentType = 'personal';
                    } else if (resolved.type === 'ambiguous') {
                        finalUpdates.assigneeDisplay = freshUpdates.assignee;
                        showUserSelection = true;
                        reply = ASSIGNEE_AMBIGUOUS_REPLY;
                    } else {
                        finalUpdates.assigneeDisplay = freshUpdates.assignee;
                        showUserSelection = true;
                        reply = `I couldn't find a user matching "${freshUpdates.assignee}". You can select from the list or keep it as a personal task.`;
                    }
                }
            }

            let finalTaskData;

            // If we're refining an existing update proposal for the SAME task, merge them.
            if (conversation.pendingTaskProposal &&
                conversation.pendingTaskProposal.action === 'update' &&
                String(conversation.pendingTaskProposal.taskId) === String(taskId)) {

                finalUpdates = {
                    ...conversation.pendingTaskProposal.updates,
                    ...finalUpdates
                };
                finalTaskData = {
                    ...task.toObject(),
                    ...finalUpdates
                };
            } else {
                finalTaskData = {
                    ...task.toObject(),
                    ...finalUpdates
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
            
            if (!reply) {
                reply = `I've prepared the updates for "${task.title}". Should I apply them?`;
            }
            
            appendMessage(conversation, 'model', reply);
            return { intent: INTENTS.UPDATE_TASK, reply, taskProposal: proposal, showUserSelection };
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
        // Removed the explicit stage handling to allow for intent-based state updates.

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
            response = await handleCreateTask(userId, conversation, correlationId);
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
        const updateData = stripRestrictedFields(updatedData || proposal.updates);
        const updated = await taskService.updateTask(userId, proposal.taskId, {
            ...updateData,
            correlationId,
        });
        reply = `Task "${proposal.taskTitle}" updated successfully.`;
        result = { intent: INTENTS.UPDATE_TASK, reply, taskProposal: null, task: updated };
    } else {
        // Fallback to creation logic
        const taskData = stripRestrictedFields(updatedData || proposal);
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
