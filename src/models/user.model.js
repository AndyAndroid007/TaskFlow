const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: false,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: function() {return this.provider === "local"},
            minlength: 6
        },
        provider: {
            type: String,
            default: "local",
            enum: ["local","google","github","linkedin","discord"]

        },
        providerId: {
            type: String,
            required: function() {return this.provider !== "local"}
        },
        avatar: {
            type: String
        },
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;