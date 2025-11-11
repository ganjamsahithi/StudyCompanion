// backend/routes/tasks.js
const router = require('express').Router();
let Task = require('../models/task.model');

// --- GET /tasks/ - List all tasks (sorted by date) ---
router.route('/').get((req, res) => {
  Task.find()
    .sort({ dueDate: 1 })
    .then(tasks => res.json(tasks))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- GET /tasks/exams - Fetches only exam tasks ---
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

// --- POST /tasks/add - Add a new task ---
router.route('/add').post((req, res) => {
  const { taskName, courseName, taskType, dueDate } = req.body;

  // Validate required fields
  if (!taskName || !courseName || !taskType || !dueDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newTask = new Task({ 
    taskName, 
    courseName, 
    taskType, 
    dueDate 
  });

  newTask.save()
    .then(() => res.json({ message: 'Task added!', task: newTask }))
    .catch(err => res.status(400).json('Error: ' + err));
});

// --- DELETE /tasks/:id - Delete a task ---
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

// --- GET /tasks/courses - Get unique courses ---
router.route('/courses').get(async (req, res) => {
    try {
        const courses = await Task.distinct('courseName');
        const courseObjects = courses
            .filter(name => name && name.trim().length > 0)
            .map((name) => ({ 
                id: name,
                name: name 
            }));
        res.json(courseObjects);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json('Error fetching courses.');
    }
});

// --- GET /tasks/metrics - Dashboard metrics ---
router.route('/metrics').get(async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcomingTasks = await Task.find({
            dueDate: { $gte: now, $lte: sevenDaysFromNow }
        }).sort({ dueDate: 1 });

        res.json({
            totalTasks,
            upcomingCount: upcomingTasks.length,
            upcomingTasks: upcomingTasks.map(d => ({
                id: d._id,
                taskName: d.taskName,
                courseName: d.courseName,
                taskType: d.taskType,
                dueDate: d.dueDate,
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json('Error fetching metrics.');
    }
});

module.exports = router;