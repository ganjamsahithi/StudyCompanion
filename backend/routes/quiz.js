// backend/routes/quiz.js
const router = require('express').Router();
const Quiz = require('../models/quiz.model'); // The new Quiz Model
const aiQuizService = require('../services/ai.quiz.service'); // Correct import

// --- Helper Functions ---
const calculateScore = (quiz, submittedAnswers) => {
    let score = 0;
    const totalQuestions = quiz.questions.length;
    
    quiz.questions.forEach(q => {
        const submitted = submittedAnswers[q.id];
        
        // Simple scoring logic: exact match for MCQ/T-F, non-empty for Short Answer
        if (q.type === 'MCQ' || q.type === 'TrueFalse') {
            if (submitted === q.correctAnswer) {
                score++;
            }
        } else if (q.type === 'ShortAnswer') {
            if (submitted && submitted.trim().length > 5) {
                 score++;
            }
        }
    });
    
    return { score, totalQuestions };
};

// --- API Endpoints ---

// POST /quiz/generate - Generates a new quiz and saves it to the database
router.route('/generate').post(async (req, res) => {
    const { courseName, topics, difficulty } = req.body;
    const userId = 'default_user';

    if (!courseName || !topics || topics.length === 0) {
        return res.status(400).json({ message: 'Course name and topics are required for quiz generation.' });
    }

    try {
        // 1. Generate quiz structure using AI service
        const quizData = await aiQuizService.generateQuizFromTopics(courseName, topics, difficulty); // Pass difficulty

        // 2. Save the new quiz to the database
        const newQuiz = new Quiz({
            title: quizData.title,
            courseName: courseName,
            questions: quizData.questions,
            userId: userId,
        });

        await newQuiz.save();

        // 3. Return the saved quiz ID and the questions (without correct answers)
        const questionsForFrontend = newQuiz.questions.map(q => ({
            quizId: newQuiz._id, // Add quiz ID to each question for easy reference
            id: q.id,
            questionText: q.questionText,
            type: q.type,
            options: q.options,
            topic: q.topic,
            difficulty: q.difficulty,
        }));

        res.json({ quizId: newQuiz._id, title: newQuiz.title, questions: questionsForFrontend });

    } catch (error) {
        console.error('Quiz Generation Error:', error);
        res.status(500).json({ message: 'Failed to generate quiz. Try again later.' });
    }
});

// POST /quiz/submit/:quizId - Receives user answers and scores the quiz
router.route('/submit/:quizId').post(async (req, res) => {
    const { submittedAnswers } = req.body;

    if (!submittedAnswers || Object.keys(submittedAnswers).length === 0) {
        return res.status(400).json({ message: 'No answers submitted.' });
    }

    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // 1. Calculate the score using the correct answers stored in the DB
        const { score, totalQuestions } = calculateScore(quiz, submittedAnswers);

        // 2. Save the attempt details to the quiz document
        const newAttempt = {
            submittedAnswers: submittedAnswers,
            score: score,
            totalQuestions: totalQuestions,
        };
        quiz.attempts.push(newAttempt);
        await quiz.save();
        
        // 3. Return the score and the detailed feedback (answers)
        res.json({
            message: 'Quiz submitted successfully.',
            score: score,
            total: totalQuestions,
            quizTitle: quiz.title,
            questions: quiz.questions, // Include correct answers for feedback
            submittedAnswers: submittedAnswers
        });

    } catch (error) {
        console.error('Quiz Submission Error:', error);
        res.status(500).json({ message: 'Failed to submit and score quiz.' });
    }
});

// GET /quiz/history/:courseName - Get quiz attempt history for a course
router.route('/history/:courseName').get(async (req, res) => {
    try {
        const { courseName } = req.params;
        
        const quizzes = await Quiz.find({ courseName })
            .select('attempts title')
            .sort({ createdAt: -1 });

        const history = [];
        quizzes.forEach(quiz => {
            quiz.attempts.forEach(attempt => {
                history.push({
                    title: quiz.title,
                    score: attempt.score,
                    totalQuestions: attempt.totalQuestions,
                    percentage: Math.round((attempt.score / attempt.totalQuestions) * 100),
                    date: attempt.scoredAt
                });
            });
        });
        
        res.json(history);
        
    } catch (error) {
        console.error('Quiz History Error:', error);
        res.status(500).json({ message: 'Failed to fetch history', error: error.message });
    }
});

module.exports = router;