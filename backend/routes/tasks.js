// backend/routes/tasks.js
const router = require('express').Router();
let Task = require('../models/task.model');

// GET all tasks (currently used by Tasks.jsx)
router.route('/').get((req, res) => {
  Task.find()
    .then(tasks => res.json(tasks))
    .catch(err => res.status(400).json('Error: ' + err));
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

        // Calculate high-priority deadlines (due within the next 3 days)
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);

        const priorityDeadlines = await Task.find({
            isCompleted: false,
            dueDate: { $gte: today, $lte: threeDaysFromNow }
        }).sort({ dueDate: 1 }); // Sort by closest deadline

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

module.exports = router;