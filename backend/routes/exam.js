// backend/routes/exam.js (COMPLETE UPDATED VERSION)
const router = require('express').Router();
const Task = require('../models/task.model'); // Global tasks model
const Document = require('../models/document.model');
const StudyScheduleTask = require('../models/StudyScheduleTask.model');
const QuizResult = require('../models/QuizResult.model');
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

// POST /exam/export-roadmap - Exports AI schedule to the DEDICATED study schedule DB
router.route('/export-roadmap').post(async (req, res) => {
    const { roadmap, courseName, examId } = req.body;
    if (!roadmap || !courseName || !examId) {
        return res.status(400).json({ message: "Roadmap data, course name, and exam ID are required." });
    }

    try {
        const tasksToSave = roadmap.phases.flatMap(phase => 
            phase.tasks.map((task, index) => {
                const currentDate = new Date(phase.startDate);
                currentDate.setDate(currentDate.getDate() + index); 
                
                return {
                    taskName: `${phase.phase} | ${task.task}`,
                    courseName: courseName,
                    examId: examId,
                    dueDate: currentDate,
                    isCompleted: false
                };
            })
        );
        
        await StudyScheduleTask.deleteMany({ examId: examId }); 
        await StudyScheduleTask.insertMany(tasksToSave); 
        
        res.json({ message: `Successfully saved ${tasksToSave.length} tasks to your dedicated Study Schedule.` });
    } catch (error) {
        console.error('Error exporting roadmap:', error);
        res.status(500).json({ message: 'Failed to export roadmap tasks.' });
    }
});

// GET /exam/schedule/:examId - Fetches the DEDICATED study schedule
router.route('/schedule/:examId').get(async (req, res) => {
    try {
        const scheduleTasks = await StudyScheduleTask.find({ examId: req.params.examId }).sort('dueDate');
        res.json(scheduleTasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch study schedule.' });
    }
});

// POST /exam/schedule/complete/:taskId - Completes a task in the DEDICATED study schedule
router.route('/schedule/complete/:taskId').post(async (req, res) => {
    try {
        const updatedTask = await StudyScheduleTask.findByIdAndUpdate(
            req.params.taskId,
            { isCompleted: true, completedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        res.json({ message: 'Task marked complete.', task: updatedTask });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark task complete.' });
    }
});

// QUIZ ROUTES
// GET /exam/quizzes/:courseName - Fetches all past quiz results for history
router.route('/quizzes/:courseName').get(async (req, res) => {
    try {
        const quizHistory = await QuizResult.find({ courseName: req.params.courseName }).sort({ submittedAt: -1 });
        res.json(quizHistory);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch quiz history.' });
    }
});

// POST /exam/quiz/submit - Saves the results of a quiz
router.route('/quiz/submit').post(async (req, res) => {
    try {
        const newQuizResult = new QuizResult(req.body);
        await newQuizResult.save();
        res.status(201).json({ message: 'Quiz results saved successfully.', result: newQuizResult });
    } catch (error) {
        console.error('Quiz submission error:', error);
        res.status(500).json({ message: 'Failed to save quiz results.' });
    }
});

// POST /exam/generate-quiz - AI generates quiz questions
router.route('/generate-quiz').post(async (req, res) => {
    const { courseName, difficulty, questionCount, includeTypingQuestion } = req.body;

    if (!courseName || !difficulty) {
        return res.status(400).json({ message: "Course name and difficulty are required." });
    }

    try {
        const documents = await Document.find({ 
            fileName: { $regex: new RegExp(courseName, 'i') } 
        }).select('fileName summary').limit(5);

        const documentContext = documents.length > 0
            ? documents.map(d => `${d.fileName}: ${d.summary || 'No summary'}`).join('\n')
            : `General knowledge about ${courseName}`;

        const quiz = await aiService.generateQuiz(
            courseName, 
            difficulty, 
            questionCount || 10,
            includeTypingQuestion || true,
            documentContext
        );

        res.json(quiz);
    } catch (error) {
        console.error('Quiz Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate quiz', 
            error: error.message 
        });
    }
});

// GET /exam/topic-notes/:courseName/:topicName - Get detailed notes for a specific topic
router.route('/topic-notes/:courseName/:topicName').get(async (req, res) => {
    const { courseName, topicName } = req.params;

    try {
        const documents = await Document.find({ 
            fileName: { $regex: new RegExp(courseName, 'i') } 
        }).select('fileName summary content').limit(3);

        const documentContext = documents.length > 0
            ? documents.map(d => `${d.fileName}: ${d.summary || d.content || 'No content'}`).join('\n\n')
            : `Generate content based on general knowledge of ${courseName}`;

        const detailedNotes = await aiService.generateTopicNotes(
            courseName,
            topicName,
            documentContext
        );

        res.json(detailedNotes);
    } catch (error) {
        console.error('Topic Notes Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate topic notes', 
            error: error.message 
        });
    }
});

// ============= NEW ENDPOINT FOR TOPIC SYLLABUS =============
// POST /exam/topic-syllabus - Generates detailed syllabus for a specific topic
router.route('/topic-syllabus').post(async (req, res) => {
    try {
        const { courseName, topicName, topicDescription } = req.body;

        if (!courseName || !topicName) {
            return res.status(400).json({ 
                message: 'courseName and topicName are required' 
            });
        }

        // Generate syllabus using AI service
        const syllabus = await aiService.generateTopicSyllabus(courseName, topicName, topicDescription);

        res.status(200).json(syllabus);
    } catch (error) {
        console.error('Topic Syllabus Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate topic syllabus',
            error: error.message 
        });
    }
});
// ============= END OF NEW ENDPOINT =============

module.exports = router;