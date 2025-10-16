// backend/routes/tasks.js
const router = require('express').Router();
let Task = require('../models/task.model');

// --- Task & Exam Routes (Includes DELETE, ADD, and GET) ---

// DELETE /tasks/:id - Permanently deletes a task (Used by the Study Schedule checkboxes)
router.route('/:id').delete(async (req, res) => {
    try {
        const result = await Task.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        res.json({ message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Failed to delete task.' });
    }
});

// GET /tasks/ - List all tasks (used by Tasks.jsx)
router.route('/').get((req, res) => {
  Task.find()
    .sort({ dueDate: 1 })
    .then(tasks => res.json(tasks))
    .catch(err => res.status(400).json('Error: ' + err));
});

// GET /tasks/exams - Fetches only exam tasks for the Exam Predictor
router.route('/exams').get(async (req, res) => {
    try {
        const exams = await Task.find({ taskType: 'Exam' })
            .sort({ dueDate: 1 });
        res.json(exams);
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ message: 'Failed to fetch exam tasks.' });
    }
});

// POST a new task
router.route('/add').post((req, res) => {
  const { taskName, courseName, taskType, dueDate } = req.body;
  const isCompleted = req.body.isCompleted || false;

  const newTask = new Task({ taskName, courseName, taskType, dueDate, isCompleted });

  newTask.save()
    .then(() => res.json('Task added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// POST /tasks/update/:id - Update task completion status
router.route('/update/:id').post((req, res) => {
    Task.findByIdAndUpdate(req.params.id, { isCompleted: req.body.isCompleted })
        .then(() => res.json('Task updated!'))
        .catch(err => res.status(400).json('Error: ' + err));
});

// GET /tasks/metrics - Helper route for dashboard metrics
router.route('/metrics').get(async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ isCompleted: true });

        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);

        const priorityDeadlines = await Task.find({
            isCompleted: false,
            dueDate: { $gte: today, $lte: threeDaysFromNow }
        }).sort({ dueDate: 1 });

        res.json({
            totalTasks,
            completedTasks,
            priorityDeadlines: priorityDeadlines.map(d => ({
                id: d._id,
                taskName: d.taskName,
                courseName: d.courseName,
                dueDate: d.dueDate,
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json('Error fetching metrics.');
    }
});

// GET /tasks/courses - Unique courses for Exam Predictor dropdown
router.route('/courses').get(async (req, res) => {
    try {
        const courses = await Task.distinct('courseName');
        const courseObjects = courses
            .filter(name => name && name.trim().length > 0)
            .map((name, index) => ({ 
                id: name,
                name: name 
            }));
        res.json(courseObjects);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json('Error fetching courses.');
    }
});


module.exports = router;