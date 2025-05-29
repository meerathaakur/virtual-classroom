// models/ParticipationRecord.js
const mongoose = require('mongoose');

const ParticipationRecordSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        ref: 'Room',
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    sessionDate: {
        type: Date,
        default: Date.now,
    },
    metrics: {
        totalTimePresent: {
            type: Number,  // in seconds
            default: 0,
        },
        speechTime: {
            type: Number,  // in seconds
            default: 0,
        },
        messagesSent: {
            type: Number,
            default: 0,
        },
        whiteboardInteractions: {
            type: Number,
            default: 0,
        },
        documentsShared: {
            type: Number,
            default: 0,
        },
        handRaises: {
            type: Number,
            default: 0,
        },
        reactions: {
            type: Number,
            default: 0,
        },
        attentionScore: {
            type: Number,
            default: 100,  // 0-100 scale
        },
    },
    engagementScore: {
        type: Number,
        default: 0,  // 0-100 scale
    },
});

module.exports = mongoose.model('ParticipationRecord', ParticipationRecordSchema);