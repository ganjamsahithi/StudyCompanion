// backend/models/task.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  taskName: { type: String, required: true },
  courseName: { type: String, required: true },
  taskType: { type: String, required: true },
  dueDate: { type: Date, required: true },
}, {
  timestamps: true,
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;