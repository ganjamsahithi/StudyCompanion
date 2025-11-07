// backend/models/StudySchedule.js
const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema({
    taskName: {
        type: String,
        required: true
    },
    hours: {
        type: Number,
        required: true
    },
    priority: {
        type: String,
        enum: ['Critical', 'High', 'Medium', 'Low'],
        default: 'Medium'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    }
});

const studyScheduleSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        index: true
    },
    examTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    phase: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    tasks: [studyTaskSchema],
    userId: {
        type: String,
        default: 'default_user'
    }
}, {
    timestamps: true
});

// Index for efficient queries
studyScheduleSchema.index({ courseName: 1, examTaskId: 1 });

module.exports = mongoose.model('StudySchedule', studyScheduleSchema);