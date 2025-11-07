// backend/models/QuizResult.model.js
const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        index: true
    },
    quizType: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Mixed', 'Random'],
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    // Store the actual questions and student answers for history/review
    questionsAttempted: [
        {
            questionText: String,
            correctAnswer: String,
            studentAnswer: mongoose.Schema.Types.Mixed,
            isCorrect: Boolean,
        }
    ],
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuizResult', quizResultSchema);