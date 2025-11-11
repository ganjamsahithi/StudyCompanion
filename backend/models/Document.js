// backend/models/Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    courseName: {
        type: String,
        default: 'Uncategorized'
    },
    summary: {
        type: String,
        default: ''
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    fileSize: {
        type: Number // in bytes
    },
    fileType: {
        type: String // pdf, docx, txt
    }
});

module.exports = mongoose.model('Document', documentSchema);