// backend/models/Document.model.js
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
    fileMimeType: { // <<< ADDED FOR CONSISTENCY >>>
        type: String,
    },
    courseName: { 
        type: String,
        default: 'General'
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