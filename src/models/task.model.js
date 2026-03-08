const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        completed: {
            type: String,
            default: ""
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true

        },
        priority: {
            type: Number,

        },
        dueDate: {
            type: Date,
            default: Date.now
        },
        tags: {
            type: [String],
            default: []
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }

    },
    {
        timestamps: true
    }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;