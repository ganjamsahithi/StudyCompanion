// backend/routes/quiz.js
const router = require('express').Router();
const Quiz = require('../models/quiz.model');
const QuizResult = require('../models/QuizResult.model');

// Import AI service - make sure the path matches your project structure
let aiQuizService;
try {
    aiQuizService = require('../services/ai.quiz.service');
} catch (err) {
    console.error('AI Quiz Service not found. Please ensure ai.quiz.service.js exists in services folder.');
}

// Helper function to calculate score
const calculateScore = (quiz, submittedAnswers) => {
    let score = 0;
    const totalQuestions = quiz.questions.length;
    
    quiz.questions.forEach((q, index) => {
        const questionId = index + 1;
        const submitted = submittedAnswers[questionId];
        
        if (q.type === 'MCQ' || q.type === 'TrueFalse') {
            if (submitted === q.correctAnswer) {
                score++;
            }
        } else if (q.type === 'ShortAnswer') {
            // For short answer, check if response has substantial content
            if (submitted && submitted.trim().length >= 10) {
                score++;
            }
        }
    });
    
    return { score, totalQuestions };
};

// POST /quiz/generate - Generate a new quiz
router.post('/generate', async (req, res) => {
    const { courseName, topics, difficulty } = req.body;
    const userId = 'default_user';

    if (!courseName || !topics || topics.length === 0) {
        return res.status(400).json({ 
            message: 'Course name and topics are required for quiz generation.' 
        });
    }

    if (!aiQuizService) {
        return res.status(500).json({ 
            message: 'AI Quiz Service not configured. Please check server configuration.' 
        });
    }

    try {
        console.log('Generating quiz for:', courseName, 'with', topics.length, 'topics');
        
        // Generate quiz using AI service
        const quizData = await aiQuizService.generateQuizFromTopics(
            courseName, 
            topics, 
            difficulty || 'Mixed'
        );

        // Save to database
        const newQuiz = new Quiz({
            title: quizData.title || `${courseName} Quiz`,
            courseName: courseName,
            questions: quizData.questions.map(q => ({
                questionText: q.questionText,
                type: q.type,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
                topic: q.topic,
                difficulty: q.difficulty
            })),
            userId: userId,
        });

        await newQuiz.save();

        console.log('Quiz saved successfully with ID:', newQuiz._id);

        // Return questions WITHOUT correct answers
        const questionsForFrontend = newQuiz.questions.map((q, index) => ({
            id: index + 1,
            questionText: q.questionText,
            type: q.type,
            options: q.options,
            topic: q.topic,
            difficulty: q.difficulty,
        }));

        res.json({ 
            quizId: newQuiz._id, 
            title: newQuiz.title, 
            questions: questionsForFrontend 
        });

    } catch (error) {
        console.error('Quiz Generation Error:', error);
        res.status(500).json({ 
            message: 'Failed to generate quiz. ' + (error.message || 'Try again later.') 
        });
    }
});

// POST /quiz/submit/:quizId - Submit quiz answers
router.post('/submit/:quizId', async (req, res) => {
    const { submittedAnswers } = req.body;

    if (!submittedAnswers || Object.keys(submittedAnswers).length === 0) {
        return res.status(400).json({ message: 'No answers submitted.' });
    }

    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // Calculate score
        const { score, totalQuestions } = calculateScore(quiz, submittedAnswers);

        // Save attempt to Quiz collection
        const newAttempt = {
            submittedAnswers: submittedAnswers,
            score: score,
            totalQuestions: totalQuestions,
        };
        quiz.attempts.push(newAttempt);
        await quiz.save();

        // ALSO save to QuizResult collection for history tracking
        const questionsAttempted = quiz.questions.map((q, index) => {
            const questionId = index + 1;
            const studentAnswer = submittedAnswers[questionId] || '[No Answer]';
            let isCorrect = false;

            if (q.type === 'MCQ' || q.type === 'TrueFalse') {
                isCorrect = studentAnswer === q.correctAnswer;
            } else if (q.type === 'ShortAnswer') {
                isCorrect = studentAnswer.trim().length >= 10;
            }

            return {
                questionText: q.questionText,
                correctAnswer: q.correctAnswer,
                studentAnswer: studentAnswer,
                isCorrect: isCorrect
            };
        });

        const quizResult = new QuizResult({
            courseName: quiz.courseName,
            quizType: 'Mixed',
            score: score,
            totalQuestions: totalQuestions,
            questionsAttempted: questionsAttempted
        });
        await quizResult.save();

        console.log('Quiz submitted successfully. Score:', score, '/', totalQuestions);
        
        // Return detailed feedback
        res.json({
            message: 'Quiz submitted successfully.',
            score: score,
            total: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            quizTitle: quiz.title,
            questions: quiz.questions,
            submittedAnswers: submittedAnswers
        });

    } catch (error) {
        console.error('Quiz Submission Error:', error);
        res.status(500).json({ message: 'Failed to submit quiz.' });
    }
});

// GET /quiz/history/:courseName - Get quiz history
router.get('/history/:courseName', async (req, res) => {
    try {
        const { courseName } = req.params;
        
        const results = await QuizResult.find({ courseName })
            .sort({ submittedAt: -1 })
            .limit(20);

        const history = results.map(result => ({
            title: `${courseName} Quiz`,
            score: result.score,
            totalQuestions: result.totalQuestions,
            percentage: Math.round((result.score / result.totalQuestions) * 100),
            date: result.submittedAt
        }));
        
        res.json(history);
        
    } catch (error) {
        console.error('Quiz History Error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch quiz history', 
            error: error.message 
        });
    }
});

module.exports = router;