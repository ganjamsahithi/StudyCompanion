const router = require('express').Router();
let Task = require('../models/task.model');

// GET all tasks
router.route('/').get((req, res) => {
    // Fetches all tasks, sorted by due date
    Task.find()
        .sort('dueDate') 
        .then(tasks => res.json(tasks))
        .catch(err => res.status(400).json('Error: ' + err));
});

// POST a new task
router.route('/add').post((req, res) => {
    const { taskName, courseName, taskType, dueDate, completed } = req.body;
    
    // Validate required fields
    if (!taskName || !courseName || !taskType || !dueDate) {
        return res.status(400).json('Error: Missing required task fields.');
    }

    const newTask = new Task({ 
        taskName, 
        courseName, 
        taskType, 
        dueDate: new Date(dueDate), // Ensure dueDate is saved as a Date object
        completed: completed || false
    });

    newTask.save()
        .then(savedTask => res.json(savedTask)) // Return the saved task object
        .catch(err => res.status(400).json('Error adding task: ' + err));
});

// POST /tasks/update/:id - Toggle completion status
router.route('/update/:id').post((req, res) => {
    Task.findById(req.params.id)
        .then(task => {
            if (!task) {
                return res.status(404).json('Task not found.');
            }
            
            // Toggle the completion status based on the new status provided in the body
            task.completed = req.body.completed;

            task.save()
                .then(() => res.json('Task updated successfully!'))
                .catch(err => res.status(400).json('Error updating task: ' + err));
        })
        .catch(err => res.status(400).json('Error finding task: ' + err));
});

module.exports = router;
