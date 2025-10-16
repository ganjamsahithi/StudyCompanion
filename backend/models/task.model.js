// // backend/models/task.model.js
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const taskSchema = new Schema({
//   taskName: { type: String, required: true },
//   courseName: { type: String, required: true },
//   taskType: { type: String, required: true },
//   dueDate: { type: Date, required: true },
// }, {
//   timestamps: true,
// });

// const Task = mongoose.model('Task', taskSchema);
// module.exports = Task;

// backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true
    },
    taskName: {
        type: String,
        required: true
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
    isCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', taskSchema);