// src/components/ExamPredictor/QuizHistoryAndGenerator.jsx
import React, { useState, useEffect } from 'react';
import QuizInterface from '../Quiz/QuizInterface';
import '../Quiz/Quiz.css';

const API_BASE_URL = 'http://localhost:8000';

const QuizHistoryAndGenerator = ({ courseName, examPrediction, onQuizComplete }) => {
    const [quizHistory, setQuizHistory] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [generatingQuiz, setGeneratingQuiz] = useState(false);
    const [error, setError] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (courseName) {
            fetchQuizHistory();
        }
    }, [courseName]);

    const fetchQuizHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await fetch(`${API_BASE_URL}/exam/quizzes/${encodeURIComponent(courseName)}`);
            if (!response.ok) {
                console.warn('No quiz history found');
                setQuizHistory([]);
                return;
            }
            
            const history = await response.json();
            setQuizHistory(Array.isArray(history) ? history : []);
        } catch (err) {
            console.error('Error fetching quiz history:', err);
            setQuizHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleGenerateQuiz = async (difficulty) => {
        setGeneratingQuiz(true);
        setError('');

        try {
            console.log('🎯 Generating', difficulty, 'quiz for:', courseName);

            // Get topics from exam prediction or use generic
            const topicSummary = examPrediction?.topicsLikely 
                ? examPrediction.topicsLikely.map(t => `${t.topic}: ${t.description || ''}`).join('\n')
                : `Generate questions covering core concepts of ${courseName}`;

            const response = await fetch(`${API_BASE_URL}/exam/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseName: courseName,
                    difficulty: difficulty,
                    questionCount: 10,
                    includeTypingQuestion: true
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate quiz');
            }

            const quizData = await response.json();
            
            console.log('✅ Quiz generated:', quizData.questions?.length, 'questions');

            // Format for QuizInterface - KEY FIX HERE
            const formattedQuiz = {
                title: quizData.title,
                quizType: quizData.quizType || difficulty,
                questions: (quizData.questions || []).map(q => ({
                    id: q.id,
                    text: q.text, // Keep as 'text' for frontend
                    type: q.type,
                    options: q.options || [],
                    answer: q.answer, // This will be checked later
                    topic: q.topic || courseName,
                    difficulty: q.difficulty || difficulty
                }))
            };

            if (formattedQuiz.questions.length === 0) {
                throw new Error('No questions generated. Please try again.');
            }

            setCurrentQuiz(formattedQuiz);
        } catch (err) {
            console.error('❌ Quiz Generation Error:', err);
            setError(err.message || 'Failed to generate quiz. Please try again.');
        } finally {
            setGeneratingQuiz(false);
        }
    };

    const handleQuizSubmit = async (quizType, score, totalQuestions, attemptedQuestions) => {
        try {
            console.log('💾 Submitting quiz results...');

            const response = await fetch(`${API_BASE_URL}/exam/quiz/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseName,
                    quizType,
                    score,
                    totalQuestions,
                    questionsAttempted: attemptedQuestions
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit quiz');
            }

            const result = await response.json();
            console.log('✅ Quiz submitted successfully:', result);

            // Small delay before refreshing history to ensure DB write completes
            setTimeout(async () => {
                await fetchQuizHistory();
                
                if (onQuizComplete) {
                    onQuizComplete();
                }
            }, 500);

        } catch (err) {
            console.error('❌ Quiz Submission Error:', err);
            setError('Failed to save quiz results: ' + err.message);
        }
    };

    const handleBackToHistory = () => {
        setCurrentQuiz(null);
        setError('');
        // Refresh history when going back
        fetchQuizHistory();
    };

    // If actively taking a quiz, show QuizInterface
    if (currentQuiz) {
        return (
            <QuizInterface 
                currentQuiz={currentQuiz} 
                onSubmit={handleQuizSubmit}
                onBack={handleBackToHistory}
            />
        );
    }

    // Otherwise, show history and generation options
    return (
        <div className="practice-content">
            <div className="quiz-generator-section">
                <h4>✍️ AI-Generated Practice Quizzes</h4>
                <p className="content-description">
                    Each quiz contains 10 MCQs + 1 Typing Question based on {courseName} course materials
                </p>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                <div className="quiz-generation-grid">
                    <button 
                        className="quiz-level-btn easy-btn" 
                        onClick={() => handleGenerateQuiz('Easy')}
                        disabled={generatingQuiz}
                    >
                        <span className="btn-icon">🟢</span>
                        <span className="btn-text">Easy Quiz</span>
                        <span className="btn-desc">10 MCQs + 1 Typing</span>
                    </button>

                    <button 
                        className="quiz-level-btn medium-btn" 
                        onClick={() => handleGenerateQuiz('Medium')}
                        disabled={generatingQuiz}
                    >
                        <span className="btn-icon">🟡</span>
                        <span className="btn-text">Medium Quiz</span>
                        <span className="btn-desc">10 MCQs + 1 Typing</span>
                    </button>

                    <button 
                        className="quiz-level-btn hard-btn" 
                        onClick={() => handleGenerateQuiz('Hard')}
                        disabled={generatingQuiz}
                    >
                        <span className="btn-icon">🔴</span>
                        <span className="btn-text">Hard Quiz</span>
                        <span className="btn-desc">10 MCQs + 1 Typing</span>
                    </button>

                    <button 
                        className="quiz-level-btn mixed-btn" 
                        onClick={() => handleGenerateQuiz('Mixed')}
                        disabled={generatingQuiz}
                    >
                        <span className="btn-icon">🎯</span>
                        <span className="btn-text">Mixed Quiz</span>
                        <span className="btn-desc">10 MCQs + 1 Typing</span>
                    </button>
                </div>

                <div className="random-quiz-section">
                    <button 
                        className="random-quiz-btn" 
                        onClick={() => handleGenerateQuiz('Mixed')}
                        disabled={generatingQuiz}
                    >
                        {generatingQuiz ? (
                            <>
                                <span className="loading-spinner-small"></span>
                                <span>Generating Quiz...</span>
                            </>
                        ) : (
                            <>
                                <span>⚡</span>
                                <span>Generate Random Quiz (Mixed Level)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <hr className="section-divider" />

            {/* Quiz History Section */}
            <div className="quiz-history-section">
                <h4>📊 Quiz Attempt History ({quizHistory.length} Total)</h4>
                <p className="history-description">
                    All quiz results are saved until the exam is removed from the database
                </p>

                {loadingHistory ? (
                    <div className="empty-content">
                        <div className="loading-spinner-small" style={{margin: '0 auto'}}></div>
                        <p>Loading history...</p>
                    </div>
                ) : quizHistory.length > 0 ? (
                    <div className="history-list">
                        {quizHistory.map((result, idx) => {
                            const percentage = Math.round((result.score / result.totalQuestions) * 100);
                            return (
                                <div key={result._id || idx} className={`history-card level-${result.quizType.toLowerCase()}`}>
                                    <div className="history-badge">
                                        <span className={`quiz-type-badge ${result.quizType.toLowerCase()}`}>
                                            {result.quizType}
                                        </span>
                                    </div>
                                    <div className="history-content">
                                        <div className="history-score">
                                            <span className="score-large">{result.score}</span>
                                            <span className="score-divider">/</span>
                                            <span className="score-total">{result.totalQuestions}</span>
                                        </div>
                                        <div className="history-percentage">
                                            <span className={`percentage-badge ${percentage >= 70 ? 'good' : percentage >= 50 ? 'okay' : 'needs-work'}`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="history-footer">
                                        <span className="history-date">
                                            📅 {new Date(result.submittedAt).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-content">
                        <p>📝 No quiz attempts yet. Click any difficulty level above to start practicing!</p>
                    </div>
                )}
            </div>

            {/* Topics Info */}
            {examPrediction?.topicsLikely && examPrediction.topicsLikely.length > 0 && (
                <div className="topics-preview">
                    <h5>🎯 Topics Covered in Quizzes</h5>
                    <div className="topics-tags">
                        {examPrediction.topicsLikely.slice(0, 5).map((topic, idx) => (
                            <span key={idx} className="topic-tag">
                                {topic.topic}
                            </span>
                        ))}
                        {examPrediction.topicsLikely.length > 5 && (
                            <span className="topic-tag more">
                                +{examPrediction.topicsLikely.length - 5} more
                            </span>
                        )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '8px' }}>
                        💡 Quiz questions are AI-generated from course topics and your uploaded notes
                    </p>
                </div>
            )}
        </div>
    );
};

export default QuizHistoryAndGenerator;