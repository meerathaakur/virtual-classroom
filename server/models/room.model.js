// models/Room.js
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
    },
    roomId: {
        type: String,
        required: [true, 'Room ID is required'],
        unique: true,
    },
    description: {
        type: String,
        default: '',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        role: {
            type: String,
            enum: ['host', 'participant'],
            default: 'participant',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    settings: {
        allowChat: {
            type: Boolean,
            default: true,
        },
        allowWhiteboard: {
            type: Boolean,
            default: true,
        },
        recordSession: {
            type: Boolean,
            default: false,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Room', RoomSchema);