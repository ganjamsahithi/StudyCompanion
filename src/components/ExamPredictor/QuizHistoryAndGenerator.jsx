// src/components/ExamPredictor/QuizHistoryAndGenerator.jsx
import React, { useState } from 'react';
import QuizInterface from './QuizInterface';
import './QuizHistoryAndGenerator.css'; 

const API_BASE_URL = 'http://localhost:8000'; 

const QuizHistoryAndGenerator = ({ courseName, quizHistory, fetchQuizHistory }) => {
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [generating, setGenerating] = useState(false);

    const handleGenerateQuiz = async (level) => {
        setGenerating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/exam/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseName: courseName,
                    difficulty: level,
                    questionCount: 10, // 10 MCQs
                    includeTypingQuestion: true // + 1 typing question
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate quiz');
            }

            const quizData = await response.json();
            setActiveQuiz(quizData);
        } catch (error) {
            console.error('Quiz Generation Error:', error);
            alert(`Failed to generate quiz: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };
    
    const handleQuizSubmission = async (quizType, score, totalQuestions, attemptedQuestions) => {
        const payload = {
            courseName,
            quizType,
            score,
            totalQuestions,
            questionsAttempted: attemptedQuestions
        };

        try {
            const response = await fetch(`${API_BASE_URL}/exam/quiz/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save quiz results.');
            }
            
            // Clear active quiz and refresh history
            setActiveQuiz(null); 
            fetchQuizHistory(); 

        } catch (error) {
            console.error('Quiz submission error:', error);
            alert(`Error saving quiz: ${error.message}`);
        }
    };
    
    // 1. Render Active Quiz Interface
    if (activeQuiz) {
        return (
            <div className="practice-content">
                <QuizInterface 
                    currentQuiz={activeQuiz} 
                    onSubmit={handleQuizSubmission}
                    onBack={() => setActiveQuiz(null)}
                />
            </div>
        );
    }

    // 2. Render Quiz Generator and History Dashboard
    return (
        <div className="practice-content quiz-dashboard">
            <h4>✍️ Generate Practice Quizzes (10 MCQs + 1 Typing Question each)</h4>
            <p className="quiz-description">
                AI-generated quizzes based on your course materials for <strong>{courseName}</strong>
            </p>
            
            {generating && (
                <div className="generating-message">
                    <div className="loading-spinner-small"></div>
                    <p>🤖 AI is generating your quiz...</p>
                </div>
            )}
            
            <div className="quiz-generation-grid">
                {['Easy', 'Medium', 'Hard', 'Mixed'].map(level => (
                    <button 
                        key={level} 
                        className={`quiz-btn level-${level.toLowerCase()}`} 
                        onClick={() => handleGenerateQuiz(level)}
                        disabled={generating}
                    >
                        📝 Generate {level} Quiz
                    </button>
                ))}
                
                <button 
                    className="quiz-btn level-random" 
                    onClick={() => handleGenerateQuiz('Mixed')}
                    disabled={generating}
                >
                    ⚡ Generate Random Quiz (Mixed Level)
                </button>
            </div>
            
            <hr className="quiz-divider" />
            
            <h4>📊 History of Attempted Quizzes ({quizHistory.length} Total)</h4>
            <p className="history-description">
                All quiz results are saved to your profile until the exam is removed.
            </p>
            
            {quizHistory.length === 0 ? (
                <p className="empty-history">No quiz attempts found. Start practicing!</p>
            ) : (
                <div className="history-list">
                    {quizHistory.map((result) => (
                        <div key={result._id} className={`history-item history-level-${result.quizType.toLowerCase()}`}>
                            <span className="quiz-type-badge">{result.quizType}</span>
                            <span className="quiz-info">
                                <strong>Score:</strong> {result.score} / {result.totalQuestions} ({Math.round((result.score / result.totalQuestions) * 100)}%)
                            </span>
                            <span className="quiz-date">
                                {new Date(result.submittedAt).toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizHistoryAndGenerator;