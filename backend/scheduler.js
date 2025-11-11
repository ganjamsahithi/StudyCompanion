// src/components/ExamPredictor/QuizInterface.jsx
import React, { useState } from 'react';
import './Quiz.css';

const QuizInterface = ({ currentQuiz, onSubmit, onBack }) => {
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [results, setResults] = useState([]);

    // Add null check for currentQuiz
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
        return (
            <div className="quiz-container">
                <div className="error-message">
                    <p>⚠️ No quiz questions available. Please try generating again.</p>
                    <button onClick={onBack} className="back-btn">← Back to Dashboard</button>
                </div>
            </div>
        );
    }

    const handleAnswerChange = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = () => {
        let correctAnswers = 0;
        const attemptedQuestions = []; 

        currentQuiz.questions.forEach(q => {
            let isCorrect = false;
            let studentResponse = answers[q.id] || '[No Answer]';

            if (q.type === 'MCQ') {
                isCorrect = studentResponse === q.answer;
            } else if (q.type === 'ShortAnswer') {
                // For short answer, check if response has substantial content
                isCorrect = studentResponse.trim().length >= 10;
            }
            
            if (isCorrect) {
                correctAnswers++;
            }
            
            attemptedQuestions.push({
                questionText: q.text,
                correctAnswer: q.answer,
                studentAnswer: studentResponse,
                isCorrect: isCorrect,
                topic: q.topic || currentQuiz.courseName || 'General'
            });
        });
        
        setScore(correctAnswers);
        setResults(attemptedQuestions);
        setIsSubmitted(true);
        
        // Call the parent handler to save results to the backend database
        onSubmit(currentQuiz.quizType, correctAnswers, currentQuiz.questions.length, attemptedQuestions);
    };

    if (isSubmitted) {
        const percentage = Math.round((score / currentQuiz.questions.length) * 100);
        const performanceLevel = percentage >= 70 ? 'excellent' : percentage >= 50 ? 'good' : 'needs-improvement';

        return (
            <div className="quiz-container">
                <div className="quiz-results card">
                    <h2>🎉 Quiz Results: {currentQuiz.title}</h2>
                    
                    <div className={`final-score-card ${performanceLevel}`}>
                        <div className="score-circle">
                            <span className="score-number">{percentage}%</span>
                            <span className="score-label">Score</span>
                        </div>
                        <div className="score-details">
                            <p className="score-text">
                                You got <strong>{score}</strong> out of <strong>{currentQuiz.questions.length}</strong> correct
                            </p>
                            <p className="performance-message">
                                {percentage >= 70 && '🌟 Excellent work! Keep it up!'}
                                {percentage >= 50 && percentage < 70 && '👍 Good effort! Review the topics below.'}
                                {percentage < 50 && '📚 Keep practicing! Focus on the areas below.'}
                            </p>
                        </div>
                    </div>

                    <div className="feedback-section">
                        <h3>📝 Detailed Review</h3>
                        {results.map((result, idx) => {
                            const question = currentQuiz.questions[idx];
                            return (
                                <div key={idx} className={`feedback-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="feedback-header">
                                        <span className="q-number">Question {idx + 1}</span>
                                        <span className={`result-badge ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                                            {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                        </span>
                                    </div>
                                    <p className="question-text"><strong>{question.text}</strong></p>
                                    
                                    <div className="answer-comparison">
                                        <div className="your-answer">
                                            <span className="label">Your Answer:</span>
                                            <span className="value">{result.studentAnswer}</span>
                                        </div>
                                        {!result.isCorrect && (
                                            <div className="correct-answer">
                                                <span className="label">Correct Answer:</span>
                                                <span className="value">{result.correctAnswer}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className="topic-tag">📌 Topic: {question.topic}</p>
                                </div>
                            );
                        })}
                    </div>
                    
                    <button onClick={onBack} className="submit-quiz-btn back-btn">
                        ← Back to Practice Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Render the active quiz form
    return (
        <div className="quiz-container">
            <div className="quiz-header">
                <h2>📝 {currentQuiz.title}</h2>
                <p className="quiz-info">
                    {currentQuiz.questions.length} Questions • Answer all questions and submit
                </p>
            </div>

            <div className="quiz-form card">
                {currentQuiz.questions.map((q, qIndex) => (
                    <div key={q.id || qIndex} className="question-item">
                        <div className="question-header">
                            <span className="question-number">Q{q.id || qIndex + 1}</span>
                            <span className={`difficulty-badge ${(q.difficulty || 'medium').toLowerCase()}`}>
                                {q.difficulty || 'Medium'}
                            </span>
                        </div>
                        <p className="question-text">{q.text}</p>
                        
                        {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                            <div className="options">
                                {q.options.map((opt, optIdx) => (
                                    <label key={optIdx} className="option-label">
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            value={opt}
                                            checked={answers[q.id] === opt}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        />
                                        <span className="option-text">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {q.type === 'ShortAnswer' && (
                            <textarea 
                                className="short-answer-input"
                                rows="4" 
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            />
                        )}

                        <div className="question-topic">
                            <span>📚 Topic: {q.topic || 'General'}</span>
                        </div>
                    </div>
                ))}

                <div className="quiz-actions">
                    <button onClick={onBack} className="cancel-btn">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="submit-quiz-btn"
                        disabled={Object.keys(answers).length === 0}
                    >
                        Submit Quiz ({Object.keys(answers).length}/{currentQuiz.questions.length} answered)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizInterface;