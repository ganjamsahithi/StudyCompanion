// backend/routes/exam.js (COMPLETE FIXED VERSION)
const router = require('express').Router();
const Task = require('../models/task.model');
const Document = require('../models/document.model');
const StudyScheduleTask = require('../models/StudyScheduleTask.model');
const QuizResult = require('../models/QuizResult.model');
const aiService = require('../services/ai.exam.service');

// GET /exam/predict/:courseName - Generates the full prediction report
router.get('/predict/:courseName', async (req, res) => {
    const courseName = decodeURIComponent(req.params.courseName);

    console.log('📚 Predicting for course:', courseName);

    if (!courseName) {
        return res.status(400).json({ message: "Course name is required for prediction." });
    }

    try {
        // Find tasks for this course
        const tasks = await Task.find({ courseName: courseName }).select('-__v');
        
        // Find documents - try multiple search patterns
        let documents = await Document.find({ 
            courseName: { $regex: new RegExp(courseName, 'i') } 
        }).select('fileName summary');

        // If no documents found by courseName, try fileName
        if (documents.length === 0) {
            documents = await Document.find({ 
                fileName: { $regex: new RegExp(courseName, 'i') } 
            }).select('fileName summary');
        }

        console.log(`Found ${tasks.length} tasks and ${documents.length} documents`);

  // Allow generation even without documents - AI will generate based on course name
        const courseData = { tasks, documents };

        // Generate prediction using AI
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
router.post('/export-roadmap', async (req, res) => {
    const { roadmap, courseName, examId } = req.body;
    
    if (!roadmap || !courseName || !examId) {
        return res.status(400).json({ 
            message: "Roadmap data, course name, and exam ID are required." 
        });
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
        
        // Delete existing schedule for this exam
        await StudyScheduleTask.deleteMany({ examId: examId }); 
        
        // Insert new schedule
        await StudyScheduleTask.insertMany(tasksToSave); 
        
        res.json({ 
            message: `Successfully saved ${tasksToSave.length} tasks to your dedicated Study Schedule.` 
        });
    } catch (error) {
        console.error('Error exporting roadmap:', error);
        res.status(500).json({ message: 'Failed to export roadmap tasks.' });
    }
});

// GET /exam/schedule/:examId - Fetches the DEDICATED study schedule
router.get('/schedule/:examId', async (req, res) => {
    try {
        const scheduleTasks = await StudyScheduleTask.find({ 
            examId: req.params.examId 
        }).sort('dueDate');
        
        res.json(scheduleTasks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch study schedule.' });
    }
});

// DELETE /exam/schedule/:examId - Delete schedule for an exam
router.delete('/schedule/:examId', async (req, res) => {
    try {
        const result = await StudyScheduleTask.deleteMany({ 
            examId: req.params.examId 
        });
        
        res.json({ 
            message: 'Schedule deleted successfully',
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error('Delete Schedule Error:', error);
        res.status(500).json({ 
            message: 'Failed to delete schedule',
            error: error.message 
        });
    }
});

// POST /exam/schedule/complete/:taskId - Completes a task in the DEDICATED study schedule
router.post('/schedule/complete/:taskId', async (req, res) => {
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
router.get('/quizzes/:courseName', async (req, res) => {
    try {
        const courseName = decodeURIComponent(req.params.courseName);
        
        const quizHistory = await QuizResult.find({ 
            courseName: courseName 
        }).sort({ submittedAt: -1 });
        
        console.log(`Found ${quizHistory.length} quiz attempts for ${courseName}`);
        
        res.json(quizHistory);
    } catch (error) {
        console.error('Quiz history error:', error);
        res.status(500).json({ message: 'Failed to fetch quiz history.' });
    }
});

// POST /exam/quiz/submit - Saves the results of a quiz
router.post('/quiz/submit', async (req, res) => {
    try {
        console.log('💾 Saving quiz result:', req.body.courseName, req.body.quizType);
        
        const newQuizResult = new QuizResult(req.body);
        await newQuizResult.save();
        
        res.status(201).json({ 
            message: 'Quiz results saved successfully.', 
            result: newQuizResult 
        });
    } catch (error) {
        console.error('Quiz submission error:', error);
        res.status(500).json({ 
            message: 'Failed to save quiz results.',
            error: error.message 
        });
    }
});

// POST /exam/generate-quiz - AI generates quiz questions
router.post('/generate-quiz', async (req, res) => {
    const { courseName, difficulty, questionCount, includeTypingQuestion } = req.body;

    console.log('🎯 Generating quiz:', { courseName, difficulty, questionCount });

    if (!courseName || !difficulty) {
        return res.status(400).json({ 
            message: "Course name and difficulty are required." 
        });
    }

    try {
        // Try to find documents for context
        let documents = await Document.find({ 
            courseName: { $regex: new RegExp(courseName, 'i') } 
        }).select('fileName summary').limit(5);

        // If no documents found by courseName, try fileName
        if (documents.length === 0) {
            documents = await Document.find({ 
                fileName: { $regex: new RegExp(courseName, 'i') } 
            }).select('fileName summary').limit(5);
        }

        const documentContext = documents.length > 0
            ? documents.map(d => `${d.fileName}: ${d.summary || 'No summary'}`).join('\n')
            : `Generate questions for ${courseName} based on core concepts`;

        console.log(`📄 Using ${documents.length} documents for context`);

        // Generate quiz using AI service
        const quiz = await aiService.generateQuiz(
            courseName, 
            difficulty, 
            questionCount || 10,
            includeTypingQuestion !== false,
            documentContext
        );

        console.log(`✅ Quiz generated: ${quiz.questions?.length || 0} questions`);

        res.json(quiz);
    } catch (error) {
        console.error('❌ Quiz Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate quiz', 
            error: error.message 
        });
    }
});

// POST /exam/topic-syllabus - Generates detailed syllabus for a specific topic
router.post('/topic-syllabus', async (req, res) => {
    try {
        const { courseName, topicName, topicDescription } = req.body;

        if (!courseName || !topicName) {
            return res.status(400).json({ 
                message: 'courseName and topicName are required' 
            });
        }

        const syllabus = await aiService.generateTopicSyllabus(
            courseName, 
            topicName, 
            topicDescription
        );

        res.status(200).json(syllabus);
    } catch (error) {
        console.error('Topic Syllabus Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate topic syllabus',
            error: error.message 
        });
    }
});

module.exports = router;