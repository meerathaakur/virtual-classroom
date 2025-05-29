// models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Document name is required'],
    },
    roomId: {
        type: String,
        required: true,
        ref: 'Room',
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    uploadedByName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    // For actual file storage, consider using MongoDB GridFS or cloud storage like S3
    // Here we just store the URL/path to the file
    filePath: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Document', DocumentSchema);