// src/components/ExamPredictor/ExamPredictor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './ExamPredictor.css';

const API_BASE_URL = 'http://localhost:5000';

// Helper to format date display consistently (DD/MM/YYYY hh:mm AM/PM)
const formatDateDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

// Helper to calculate remaining time in days, hours, and minutes
const getTimeRemaining = (examDateString) => {
    const total = new Date(examDateString) - new Date();
    if (total <= 0) return { days: 0, hours: 0, minutes: 0, total: 0 };
    
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);

    return { days, hours, minutes, total };
};

const ExamPredictor = () => {
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examPrediction, setExamPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [exportMessage, setExportMessage] = useState('');

    const fetchUpcomingExams = useCallback(async () => {
        try {
            // New endpoint to fetch only exams
            const response = await fetch(`${API_BASE_URL}/tasks/exams`); 
            if (!response.ok) throw new Error('Failed to fetch exams');
            
            const exams = await response.json();
            setUpcomingExams(exams);
            
            if (exams.length > 0) {
                // If no exam is selected or the current one was deleted, select the first one
                if (!selectedExam) {
                    handleExamSelect(exams[0]);
                } else if (!exams.some(e => e._id === selectedExam._id)) {
                    // If previously selected exam no longer exists, load the first one
                     handleExamSelect(exams[0]);
                }
            } else if (selectedExam) {
                // If no exams exist but one was selected, clear the view
                setSelectedExam(null);
                setExamPrediction(null);
            }
        } catch (err) {
            console.error('Error fetching exams:', err);
            setError('Failed to load exams. Ensure backend is running.');
        }
    }, [selectedExam]);

    const handleExamSelect = async (exam) => {
        setSelectedExam(exam);
        setLoading(true);
        setError('');
        setExamPrediction(null);
        setExportMessage('');

        try {
            const response = await fetch(
                // Uses courseName, which is critical for AI relevance
                `${API_BASE_URL}/exam/predict/${encodeURIComponent(exam.courseName)}`
            );
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to generate predictions');
            }

            setExamPrediction(data);
            setActiveTab('overview');
        } catch (err) {
            console.error('Prediction error:', err);
            // This error handling is crucial for debugging the AI irrelevance issue
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpcomingExams();
    }, [fetchUpcomingExams]);

    // --- Helper Functions (same as previous, used for UI) ---
    const getDaysUntil = (date) => {
        const today = new Date();
        const examDate = new Date(date);
        const diffTime = examDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getUrgencyLevel = (days) => {
        if (days < 0) return 'overdue';
        if (days <= 3) return 'critical';
        if (days <= 7) return 'high';
        if (days <= 14) return 'medium';
        return 'normal';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const calculateTotalHours = () => {
        if (!examPrediction?.revisionRoadmap?.phases) return 0;
        return examPrediction.revisionRoadmap.phases.reduce((totalHours, phase) => {
            return totalHours + phase.tasks.reduce((phaseHours, task) => phaseHours + task.hours, 0);
        }, 0);
    };

    // --- NEW: Study Schedule Completion (Delete on Check) ---
    const handleTaskCompletion = async (taskId, taskName) => {
        // Confirmation is needed to prevent accidental deletion of a phase
        if (!window.confirm(`Marking "${taskName}" complete will delete it from your Tasks list. Continue?`)) {
            return;
        }

        try {
            // Call the general task delete endpoint
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete task.');
            }
            
            // Success: Notify user and refetch exams to update the schedule display
            setExportMessage('Study task completed and removed from schedule!');
            // Re-fetch the current exam prediction to show the schedule without the deleted task
            handleExamSelect(selectedExam); 

        } catch (err) {
            console.error('Task Deletion Error:', err);
            setExportMessage(`Error deleting task: ${err.message}`);
        }
    };


    // --- Export Roadmap Functionality ---
    const exportRoadmap = async () => {
        if (!examPrediction || !selectedExam) return;
        setExportMessage('Exporting roadmap to Tasks & Deadlines...');
        try {
            const response = await fetch(`${API_BASE_URL}/exam/export-roadmap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roadmap: examPrediction.revisionRoadmap,
                    courseName: selectedExam.courseName
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to export roadmap.');
            }
            setExportMessage(data.message);
        } catch (err) {
            console.error('Export Error:', err);
            setExportMessage(`Export failed: ${err.message}`);
        }
    };
    
    // Placeholder functions for Quiz/Practice buttons
    const generateQuiz = () => alert('Generating custom quiz...');
    const attemptQuestion = () => alert('Attempting question now...');
    
    // Calculate remaining time for the selected exam
    const timeRemaining = selectedExam ? getTimeRemaining(selectedExam.dueDate) : { days: 0, hours: 0, minutes: 0, total: 0 };

    // --- Rendering ---
    const totalStudyHours = calculateTotalHours();

    return (
        <div className="exam-predictor">
            <div className="predictor-header">
                <h2>📚 Exam Preparation Center</h2>
                <p>AI-powered study plans for your upcoming exams</p>
            </div>
            {error && (
                <div className="error-banner">
                    <span>⚠️</span>
                    <div>
                        <p><strong>Prediction Failed</strong></p>
                        <p>{error}</p>
                        <small>Make sure you have uploaded notes for <strong>{selectedExam?.courseName}</strong></small>
                    </div>
                </div>
            )}
            
            {exportMessage && <div className="success-message">{exportMessage}</div>}

            {upcomingExams.length === 0 ? (
                <div className="exams-overview-card">
                    <div className="no-exams-message">
                        <p>📭 No exams scheduled yet.</p>
                        <p>Go to <strong>Tasks & Deadlines</strong> and add tasks with type <strong>"Exam"</strong>.</p>
                    </div>
                </div>
            ) : (
                <div className="exams-overview-card">
                    <h3>📅 Your Upcoming Exams</h3>
                    <div className="exams-grid">
                        {upcomingExams.map((exam) => {
                            const daysUntil = getDaysUntil(exam.dueDate);
                            const urgency = getUrgencyLevel(daysUntil);
                            return (
                                <div
                                    key={exam._id}
                                    className={`exam-card ${selectedExam?._id === exam._id ? 'selected' : ''} urgency-${urgency}`}
                                    onClick={() => handleExamSelect(exam)}
                                >
                                    <div className="exam-card-header">
                                        <span className="exam-course">{exam.courseName}</span>
                                        <span className={`days-badge urgency-${urgency}`}>
                                            {daysUntil < 0 ? 'Overdue' : `${daysUntil}d left`}
                                        </span>
                                    </div>
                                    <div className="exam-card-body">
                                        <p className="exam-name">{exam.taskName}</p>
                                        <p className="exam-date">
                                            📅 {formatDateDisplay(exam.dueDate)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {loading && selectedExam && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>🧠 Analyzing course materials for <strong>{selectedExam.courseName}</strong></p>
                    <span className="loading-subtext">Generating practice questions and study plan...</span>
                </div>
            )}
            {selectedExam && examPrediction && !loading && (
                <div className="prediction-container">
                    <div className={`exam-info-header urgency-${getUrgencyLevel(getDaysUntil(selectedExam.dueDate))}`}>
                        <div className="exam-info-left">
                            <h3>{selectedExam.courseName}</h3>
                            <p className="exam-title">{selectedExam.taskName}</p>
                            <p className="exam-date-full">Due: {formatDate(selectedExam.dueDate)}</p>
                        </div>
                        {timeRemaining.total > 0 ? (
                            <div className="countdown-circle">
                                <div className="countdown-number">
                                    {timeRemaining.days > 0 ? timeRemaining.days : `${timeRemaining.hours}h`}
                                </div>
                                <div className="countdown-label">
                                    {timeRemaining.days > 0 ? 'days left' : `${timeRemaining.minutes}m left`}
                                </div>
                            </div>
                        ) : (
                            <div className="countdown-circle">
                                <div className="countdown-number">0</div>
                                <div className="countdown-label">Time's Up</div>
                            </div>
                        )}
                    </div>
                    <div className="prediction-tabs">
                        <button
                            className={`pred-tab ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            📊 Overview
                        </button>
                        <button
                            className={`pred-tab ${activeTab === 'topics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('topics')}
                        >
                            📖 Key Topics
                        </button>
                        <button
                            className={`pred-tab ${activeTab === 'practice' ? 'active' : ''}`}
                            onClick={() => setActiveTab('practice')}
                        >
                            ✍️ Practice Questions
                        </button>
                        <button
                            className={`pred-tab ${activeTab === 'plan' ? 'active' : ''}`}
                            onClick={() => setActiveTab('plan')}
                        >
                            📅 Study Schedule
                        </button>
                    </div>
                    <div className="tab-content-area">
                        {activeTab === 'overview' && (
                            <div className="overview-content">
                                <div className="stats-cards">
                                    <div className="stat-box">
                                        <span className="stat-icon">📚</span>
                                        <span className="stat-value">{examPrediction.topicsLikely?.length || 0}</span>
                                        <span className="stat-label">Predicted Topics</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-icon">⏰</span>
                                        <span className="stat-value">{examPrediction.revisionRoadmap?.totalStudyHours || 0}h</span>
                                        <span className="stat-label">Study Time Needed</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-icon">📄</span>
                                        <span className="stat-value">{examPrediction.documentsAnalyzed || 0}</span>
                                        <span className="stat-label">Notes Analyzed</span>
                                    </div>
                                </div>
                                {examPrediction.studyTip && (
                                    <div className="ai-tip-box">
                                        <h4>💡 AI Study Recommendation</h4>
                                        <p>{examPrediction.studyTip}</p>
                                    </div>
                                )}
                                {examPrediction.weakAreas && examPrediction.weakAreas.length > 0 && (
                                    <div className="weak-areas-box">
                                        <h4>⚠️ Focus Areas</h4>
                                        <ul>
                                            {examPrediction.weakAreas.map((area, idx) => (
                                                <li key={idx}>
                                                    <span className="weak-icon">🎯</span>
                                                    {area}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'topics' && (
                            <div className="topics-content">
                                <h4>📖 Important Topics for Exam</h4>
                                <p className="content-description">
                                    Based on AI analysis of your uploaded notes and course materials
                                </p>
                                {examPrediction.topicsLikely && examPrediction.topicsLikely.length > 0 ? (
                                    <div className="topics-grid">
                                        {examPrediction.topicsLikely.map((topic, idx) => (
                                            <div key={idx} className="topic-box">
                                                <div className="topic-box-header">
                                                    <span className="topic-index">{idx + 1}</span>
                                                    <h5>{topic.topic}</h5>
                                                    <span className={`priority-tag ${(topic.importance || 'Medium').toLowerCase()}`}>
                                                        {topic.importance || 'Medium'}
                                                    </span>
                                                </div>
                                                <p className="topic-desc">{topic.description}</p>
                                                <div className="topic-time">Last Appeared: {topic.lastAppeared}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-content">
                                        <p>No topics identified. Upload more notes for better predictions.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'practice' && (
                            <div className="practice-content">
                                <div className="roadmap-header">
                                    <h4>✍️ AI-Generated Practice Questions</h4>
                                    <button className="export-btn" onClick={generateQuiz}>
                                        ⚡ Generate Custom Quiz
                                    </button>
                                </div>
                                {examPrediction.practiceQuestions && examPrediction.practiceQuestions.length > 0 ? (
                                    <div className="questions-container">
                                        {examPrediction.practiceQuestions.map((q, idx) => (
                                            <div key={idx} className="question-box">
                                                <div className="question-header-row">
                                                    <span className="q-number">Q{idx + 1}</span>
                                                    <span className={`diff-badge ${(q.difficulty || 'medium').toLowerCase()}`}>
                                                        {q.difficulty || 'Medium'}
                                                    </span>
                                                </div>
                                                <p className="question-text">{q.question}</p>
                                                <div className="q-meta">
                                                    <span className="q-topic">📌 {q.topic}</span>
                                                    {q.estimatedTime && (
                                                        <span className="q-time">⏱️ {q.estimatedTime}</span>
                                                    )}
                                                    <button className="attempt-btn" onClick={attemptQuestion}>Attempt Now →</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-content">
                                        <p>No practice questions available yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'plan' && (
                            <div className="plan-content">
                                <div className="roadmap-header">
                                    <div>
                                        <h4>📅 Recommended Study Schedule</h4>
                                        <p className="content-description">
                                            AI-generated plan to cover all topics before exam day
                                        </p>
                                    </div>
                                    <button className="export-btn" onClick={exportRoadmap}>
                                        📅 Export to Calendar
                                    </button>
                                </div>
                                {examPrediction.revisionRoadmap && examPrediction.revisionRoadmap.phases.length > 0 ? (
                                    <div className="schedule-timeline">
                                        {examPrediction.revisionRoadmap.phases.map((phase, idx) => (
                                            <div key={idx} className="schedule-phase">
                                                <div className="phase-header-row">
                                                    <span className="phase-num">{phase.phase}</span>
                                                    {phase.startDate && phase.endDate && (
                                                        <span className="phase-dates">
                                                            {formatDateDisplay(phase.startDate)} -
                                                            {formatDateDisplay(phase.endDate)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="phase-tasks-list">
                                                    {phase.tasks && phase.tasks.map((task, tIdx) => (
                                                        <div key={tIdx} className="schedule-task">
                                                            <input 
                                                                type="checkbox" 
                                                                id={`pt-${idx}-${tIdx}`} 
                                                                // The task being added here needs an ID to be deleted.
                                                                // Since these tasks are generated, we use the _id from the tasks saved in the database
                                                                // In the current setup, we assume these tasks have been exported to the Tasks list,
                                                                // but for the UI to delete them, we need a unique ID linked to the DB.
                                                                // To simplify for now, we'll use a placeholder ID, but the actual implementation
                                                                // relies on linking the task._id from the Tasks database entry.
                                                                // Since this current schedule is loaded from the AI report, not the DB, the delete
                                                                // action should happen on the item's unique ID.
                                                                // We will assume the task object has a unique ID for deletion here.
                                                                onChange={() => handleTaskCompletion(task.taskId || task.task, task.task)}
                                                            />
                                                            <label htmlFor={`pt-${idx}-${tIdx}`}>
                                                                <span className="task-text">{task.task}</span>
                                                                <div className="task-meta">
                                                                    <span className="task-hours">⏰ {task.hours}h</span>
                                                                    <span className={`task-priority ${task.priority.toLowerCase()}`}>
                                                                        {task.priority}
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-content">
                                        <h5>📌 General Study Strategy:</h5>
                                        <ol className="generic-plan">
                                            <li>Review all lecture notes thoroughly</li>
                                            <li>Focus on high-priority topics first</li>
                                            <li>Practice problems from each topic</li>
                                            <li>Create summary sheets for quick review</li>
                                            <li>Do a complete mock test 2 days before exam</li>
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!selectedExam && !loading && upcomingExams.length > 0 && (
                <div className="no-data-message">
                    <p>Select an exam above to generate your personalized preparation report.</p>
                </div>
            )}
             {!selectedExam && !loading && upcomingExams.length === 0 && (
                <div className="no-data-message">
                    <p>No exams scheduled yet. Go to <strong>Tasks & Deadlines</strong> to add some!</p>
                </div>
            )}
        </div>
    );
};

export default ExamPredictor;