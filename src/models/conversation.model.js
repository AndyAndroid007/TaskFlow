const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    messages: {
        type: [MessageSchema],
        default: [],
    },
    activeIntent: {
        type: String,
        enum: ['SUGGEST_TASKS', 'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'GENERAL_CHAT'],
        default: null,
    },
    pendingTaskProposal: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    taskCreationState: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

ConversationSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });
ConversationSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
