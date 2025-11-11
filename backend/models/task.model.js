// backend/models/task.model.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    taskName: {
        type: String,
        required: true,
        trim: true
    },
    taskType: {
        type: String,
        enum: ['Assignment', 'Exam', 'Project', 'Reading', 'Review'],
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Task', taskSchema);