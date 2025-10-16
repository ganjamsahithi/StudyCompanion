// backend/routes/exam.js
const router = require('express').Router();
const Task = require('../models/task.model');
const Document = require('../models/document.model');
const aiService = require('../services/ai.exam.service');

// GET /exam/predict/:courseName - Generates the full prediction report
router.route('/predict/:courseName').get(async (req, res) => {
    const courseName = req.params.courseName;

    if (!courseName) {
        return res.status(400).json({ message: "Course name is required for prediction." });
    }

    try {
        const tasks = await Task.find({ courseName: courseName }).select('-__v');
        const documents = await Document.find({ fileName: { $regex: new RegExp(courseName, 'i') } })
                                        .select('fileName summary');

        const courseData = { tasks, documents };

        const predictionReport = await aiService.generateExamPrediction(courseName, courseData);

        res.json(predictionReport);
    } catch (error) {
        console.error('Error generating exam prediction:', error);
        res.status(500).json({
            message: "Failed to generate exam prediction.",
            error: error.message
        });
    }
});

// POST /exam/export-roadmap
router.route('/export-roadmap').post(async (req, res) => {
    const { roadmap, courseName } = req.body;
    if (!roadmap || !courseName) {
        return res.status(400).json({ message: "Roadmap data and course name are required." });
    }

    try {
        const tasksToSave = roadmap.phases.flatMap(phase => 
            phase.tasks.map((task, index) => {
                const currentDate = new Date(phase.startDate);
                currentDate.setDate(currentDate.getDate() + index);
                return {
                    taskName: `${phase.phase} | ${task.task}`,
                    courseName: courseName,
                    taskType: 'Review',
                    dueDate: currentDate,
                    isCompleted: false
                };
            })
        );
        await Task.insertMany(tasksToSave);
        res.json({ message: `Successfully exported ${tasksToSave.length} tasks to your To-Do list.` });
    } catch (error) {
        console.error('Error exporting roadmap:', error);
        res.status(500).json({ message: 'Failed to export roadmap tasks.' });
    }
});

module.exports = router;