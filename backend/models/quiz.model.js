// backend/models/quiz.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for a single question
const questionSchema = new Schema({
    questionText: { type: String, required: true },
    type: { type: String, enum: ['MCQ', 'TrueFalse', 'ShortAnswer'], required: true },
    options: [{ type: String }], // Only used for MCQ
    correctAnswer: { type: String, required: true },
    topic: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    estimatedTime: { type: String },
});

// Schema for the overall Quiz
const quizSchema = new Schema({
    title: { type: String, required: true },
    courseName: { type: String, required: true },
    questions: [questionSchema], 
    attempts: [{
        submittedAnswers: { type: Map, of: String },
        score: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        scoredAt: { type: Date, default: Date.now },
    }],
    userId: { type: String, required: true, default: 'default_user' },
}, {
    timestamps: true,
});

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;