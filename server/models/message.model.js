// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    ref: 'Room',
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
  },
  type: {
    type: String,
    enum: ['text', 'file', 'notification'],
    default: 'text',
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  fileType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient message retrieval by room
// MessageSchema.index({ roomId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);