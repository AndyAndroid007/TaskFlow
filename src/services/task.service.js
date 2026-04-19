const mongoose = require("mongoose");
const ApiError = require("../exceptions/ApiError");
const taskRepo = require("../repositories/task.repository");
const logger = require("../utils/logger");

const {produceEvent} = require('../infrastructure/kafka/producer');
const {TOPICS, EVENT_TYPES, buildEvent} = require('../events/taskEvents');
const { translateAliases } = require("../models/task.model");
const createTask = async (userId, data) => {
    const task = await taskRepo.createTask({ ...data, userId });
    logger.debug('Task created', { taskId: task._id, userId });
    const eventPayload = buildEvent(EVENT_TYPES.TASK_CREATED,
        {
            taskId: task._id,
            userId: userId,
            title: task.title,
            status: task.status,
            priority: task.priority,
            assignee: task.assignee
        },
        data.correlationId
    );
    produceEvent(TOPICS.TASK_CREATED, eventPayload);
    return task;
};

const getTaskById = async (userId, taskId) => {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid Task ID");
    }
    const task = await taskRepo.getTaskById(taskId);
    if (!task) {
        throw new ApiError(404, "Task Not Found!");
    }
    const isOwner = task.userId.toString() === userId.toString();
    const isAssignee = task.assignee?.toString() === userId.toString();
    if (!isOwner && !isAssignee) {
        logger.warn('Unauthorized task access attempt', { taskId, requestingUser: userId, taskOwner: task.userId });
        throw new ApiError(403, "Not Allowed");
    }
    return task;
};

const getTasksByUser = async (userId) => {
    return await taskRepo.getTaskByUser(userId);
}

const updateTask = async (userId, taskId, updatedData) => {
    const task = await getTaskById(userId, taskId);
    const isOwner = task.userId.toString() === userId.toString();

    if (!isOwner) {
        const allowedKeys = new Set(['status', 'correlationId']);
        const attemptedKeys = Object.keys(updatedData).filter((key) => !allowedKeys.has(key));

        if (attemptedKeys.length > 0) {
            logger.warn('Unauthorized delegated task update attempt', {
                taskId,
                requestingUser: userId,
                taskOwner: task.userId,
                attemptedKeys,
            });
            throw new ApiError(403, 'Assignees can only update task status');
        }
    }

    const updated = await taskRepo.updateTask(taskId, updatedData);
    logger.debug('Task updated', { taskId, userId });
    const isCompleted = updated.status === 'Completed' && task.status !== 'Completed';
    const eventType = isCompleted ? EVENT_TYPES.TASK_COMPLETED : EVENT_TYPES.TASK_UPDATED;
    const topic = isCompleted ? TOPICS.TASK_COMPLETED : TOPICS.TASK_UPDATED;
    const eventPayload = buildEvent(
        eventType,
        {
            taskId: updated._id,
            userId: task.userId,
            title: updated.title,
            status: updated.status,
            previousStatus: task.status,
            assignee: updated.assignee
        },
        updatedData.correlationId
    );
    produceEvent(topic, eventPayload);
    return updated;
}

const deleteTask = async (userId, taskId, correlationId) => {
    const task = await getTaskById(userId, taskId);
    if (task.userId.toString() !== userId.toString()) {
        logger.warn('Unauthorized task delete attempt', { taskId, requestingUser: userId, taskOwner: task.userId });
        throw new ApiError(403, "Only the task owner can delete this task");
    }
    await taskRepo.deleteTask(taskId);
    logger.debug('Task deleted', { taskId, userId });
    const eventPayload = buildEvent(
        EVENT_TYPES.TASK_DELETED,
        {
            taskId: taskId,
            userId: userId,
            title: task.title,
            assignee: task.assignee,
        },
        correlationId
    );
    produceEvent(TOPICS.TASK_DELETED, eventPayload)
}

module.exports = { createTask, updateTask, deleteTask, getTaskById, getTasksByUser };
