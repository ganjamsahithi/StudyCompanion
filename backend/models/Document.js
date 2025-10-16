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
        default: 'General' // Add this field to link documents to courses
    },
    summary: {
        type: String,
        default: null
    },
    uploadedDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', documentSchema);