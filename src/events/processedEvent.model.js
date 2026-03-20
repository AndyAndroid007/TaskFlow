const mongoose = require('mongoose');
const processedEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true
    },
    processedAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // amounts to 7 days
    }
});

const ProcessedEvent = mongoose.model('ProcessedEvent',processedEventSchema);
module.exports = ProcessedEvent;