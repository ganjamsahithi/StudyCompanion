// backend/models/StudyScheduleTask.model.js
const mongoose = require('mongoose');

const studyScheduleTaskSchema = new mongoose.Schema({
    // Link to the main Exam/Course
    courseName: {
        type: String,
        required: true,
        index: true // Index for fast lookup by course
    },
    // ID of the main exam task this schedule belongs to (optional, but good practice)
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task' // Assuming the exam is defined in the main Task model
    },
    taskName: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    // Stores the completion status
    isCompleted: {
        type: Boolean,
        default: false
    },
    // New field to prevent re-ticking after completion, as requested
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('StudyScheduleTask', studyScheduleTaskSchema);