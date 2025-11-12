// src/components/ExamPredictor/ExamPredictor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './ExamPredictor.css';
import QuizHistoryAndGenerator from './QuizHistoryAndGenerator';

const API_BASE_URL = 'http://localhost:5000';

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

const getTimeRemaining = (examDateString) => {
    const total = new Date(examDateString) - new Date();
    if (total <= 0) return { days: 0, hours: 0, minutes: 0, total: 0 };
    
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / 1000 / 60) % 60);

    return { days, hours, minutes, total };
};

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

const ExamPredictor = () => {
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examPrediction, setExamPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [exportMessage, setExportMessage] = useState('');
    
    // Schedule and Quiz states
    const [scheduleTasks, setScheduleTasks] = useState([]);
    const [quizHistory, setQuizHistory] = useState([]);
    const [preparedness, setPreparedness] = useState(0);
    const [regeneratingSchedule, setRegeneratingSchedule] = useState(false);
    
    // Topic syllabus states
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [topicSyllabus, setTopicSyllabus] = useState(null);
    const [loadingSyllabus, setLoadingSyllabus] = useState(false);

    const calculatePreparedness = useCallback((prediction, history, schedule) => {
        if (!prediction || !selectedExam) return setPreparedness(0);
        
        const quizCount = history.length;
        const maxQuizzesForWeight = 5; 
        const totalScoreRatio = quizCount > 0 
            ? history.reduce((sum, res) => sum + (res.score / res.totalQuestions), 0) / quizCount 
            : 0;
        
        const quizWeight = Math.min(quizCount / maxQuizzesForWeight, 1) * totalScoreRatio * 0.5;

        const totalTasks = schedule.length;
        const completedTasks = schedule.filter(t => t.isCompleted).length;
        
        const taskWeight = totalTasks > 0 ? (completedTasks / totalTasks) * 0.5 : 0;

        const finalPercentage = Math.round((quizWeight + taskWeight) * 100);
        setPreparedness(finalPercentage);
    }, [selectedExam]);

    const fetchQuizHistory = useCallback(async (courseName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/quiz/history/${encodeURIComponent(courseName)}`);
            if (!response.ok) {
                console.warn('Quiz history not found, starting fresh');
                return [];
            }
            const history = await response.json();
            setQuizHistory(history);
            return history;
        } catch (err) {
            console.error('Error fetching quiz history:', err);
            setQuizHistory([]);
            return [];
        }
    }, []);

    const fetchStudyScheduleTasks = useCallback(async (examId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/exam/schedule/${examId}`);
            if (!response.ok) {
                console.warn('No schedule found for this exam');
                return [];
            }
            const tasks = await response.json();
            setScheduleTasks(tasks);
            return tasks;
        } catch (err) {
            console.error('Error fetching study schedule:', err);
            setScheduleTasks([]);
            return [];
        }
    }, []);

    const fetchTopicSyllabus = async (topic) => {
        setSelectedTopic(topic);
        setLoadingSyllabus(true);
        setTopicSyllabus(null);

        try {
            const response = await fetch(`${API_BASE_URL}/exam/topic-syllabus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseName: selectedExam.courseName,
                    topicName: topic.topic,
                    topicDescription: topic.description
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate syllabus');
            }

            const data = await response.json();
            setTopicSyllabus(data);
        } catch (err) {
            console.error('Syllabus generation error:', err);
            setError('Failed to generate syllabus for this topic');
        } finally {
            setLoadingSyllabus(false);
        }
    };

    const handleExamSelect = async (exam) => {
        setSelectedExam(exam);
        setLoading(true);
        setError('');
        setExamPrediction(null);
        setExportMessage('');
        setPreparedness(0);
        setSelectedTopic(null);
        setTopicSyllabus(null);

        try {
            const predictionResponse = await fetch(
                `${API_BASE_URL}/exam/predict/${encodeURIComponent(exam.courseName)}`
            );
            
            const predictionData = await predictionResponse.json();

            if (!predictionResponse.ok) {
                throw new Error(predictionData.message || 'Failed to generate predictions');
            }

            setExamPrediction(predictionData);
            setActiveTab('overview');
            
            const schedule = await fetchStudyScheduleTasks(exam._id);
            const history = await fetchQuizHistory(exam.courseName);
            
            calculatePreparedness(predictionData, history, schedule);

        } catch (err) {
            console.error('Prediction error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUpcomingExams = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/exams`); 
            if (!response.ok) throw new Error('Failed to fetch exams');
            
            const exams = await response.json();
            setUpcomingExams(exams);
            
            if (exams.length > 0) {
                if (!selectedExam) {
                    handleExamSelect(exams[0]);
                } else if (!exams.some(e => e._id === selectedExam._id)) {
                    handleExamSelect(exams[0]);
                }
            } else if (selectedExam) {
                setSelectedExam(null);
                setExamPrediction(null);
            }
        } catch (err) {
            console.error('Error fetching exams:', err);
            setError('Failed to load exams. Ensure backend is running.');
        }
    }, [selectedExam]);

    useEffect(() => {
        fetchUpcomingExams();
    }, []);
    
    useEffect(() => {
        calculatePreparedness(examPrediction, quizHistory, scheduleTasks);
    }, [examPrediction, quizHistory, scheduleTasks, calculatePreparedness]);

    const handleScheduleTaskCompletion = async (taskId, taskName, isCompleted) => {
        if (isCompleted) {
            alert("This task is already completed and cannot be unticked.");
            return;
        }

        if (!window.confirm(`Marking "${taskName}" complete. Continue?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/exam/schedule/complete/${taskId}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to mark task complete.');
            }
            
            setExportMessage('Study task completed and marked off!');
            await fetchStudyScheduleTasks(selectedExam._id);
        } catch (err) {
            console.error('Task Completion Error:', err);
            setExportMessage(`Error marking task complete: ${err.message}`);
        }
    };

    const exportRoadmap = async () => {
        if (!examPrediction || !selectedExam) return;
        
        const hasExistingSchedule = scheduleTasks.length > 0;
        
        if (hasExistingSchedule) {
            const confirmed = window.confirm(
                "A study schedule already exists for this exam. Regenerating will DELETE the current schedule and create a new one. Continue?"
            );
            if (!confirmed) return;
        }
        
        setRegeneratingSchedule(true);
        setExportMessage(hasExistingSchedule ? 'Regenerating schedule...' : 'Generating study schedule...');
        
        try {
            if (hasExistingSchedule) {
                const deleteResponse = await fetch(`${API_BASE_URL}/exam/schedule/${selectedExam._id}`, {
                    method: 'DELETE'
                });
                
                if (!deleteResponse.ok) {
                    throw new Error('Failed to delete existing schedule');
                }
            }
            
            const response = await fetch(`${API_BASE_URL}/exam/export-roadmap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roadmap: examPrediction.revisionRoadmap,
                    courseName: selectedExam.courseName,
                    examId: selectedExam._id
                })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to export roadmap.');
            }
            
            setExportMessage(hasExistingSchedule ? 'Schedule regenerated successfully!' : data.message);
            await fetchStudyScheduleTasks(selectedExam._id);
        } catch (err) {
            console.error('Export Error:', err);
            setExportMessage(`Export failed: ${err.message}`);
        } finally {
            setRegeneratingSchedule(false);
        }
    };
    
    const timeRemaining = selectedExam ? getTimeRemaining(selectedExam.dueDate) : { days: 0, hours: 0, minutes: 0, total: 0 };

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
                        <p><strong>Error</strong></p>
                        <p>{error}</p>
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
                                        <span className="stat-label">Key Topics Detected</span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-icon">📈</span>
                                        <span className="stat-value">{preparedness}%</span>
                                        <span className="stat-label">Preparedness Score</span>
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
                                    Based on AI analysis of your uploaded notes and course materials. Click on any topic to view detailed syllabus.
                                </p>
                                {examPrediction.topicsLikely && examPrediction.topicsLikely.length > 0 ? (
                                    <>
                                        <div className="topics-grid">
                                            {examPrediction.topicsLikely.map((topic, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`topic-box ${selectedTopic?.topic === topic.topic ? 'selected-topic' : ''}`}
                                                    onClick={() => fetchTopicSyllabus(topic)}
                                                    style={{ cursor: 'pointer' }}
                                                >
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

                                        {loadingSyllabus && (
                                            <div className="syllabus-loading">
                                                <div className="loading-spinner"></div>
                                                <p>Generating detailed syllabus for <strong>{selectedTopic?.topic}</strong>...</p>
                                            </div>
                                        )}

                                        {!loadingSyllabus && topicSyllabus && selectedTopic && (
                                            <div className="topic-syllabus-container">
                                                <div className="syllabus-header">
                                                    <h3>📚 Detailed Syllabus: {selectedTopic.topic}</h3>
                                                    <button 
                                                        className="close-syllabus-btn"
                                                        onClick={() => {
                                                            setSelectedTopic(null);
                                                            setTopicSyllabus(null);
                                                        }}
                                                    >
                                                        ✕ Close
                                                    </button>
                                                </div>

                                                <div className="syllabus-content">
                                                    {topicSyllabus.overview && (
                                                        <div className="syllabus-section">
                                                            <h4>📋 Overview</h4>
                                                            <p>{topicSyllabus.overview}</p>
                                                        </div>
                                                    )}

                                                    {topicSyllabus.subtopics && topicSyllabus.subtopics.length > 0 && (
                                                        <div className="syllabus-section">
                                                            <h4>📑 Key Subtopics</h4>
                                                            <div className="subtopics-list">
                                                                {topicSyllabus.subtopics.map((subtopic, idx) => (
                                                                    <div key={idx} className="subtopic-item">
                                                                        <div className="subtopic-header">
                                                                            <span className="subtopic-number">{idx + 1}.</span>
                                                                            <h5>{subtopic.name}</h5>
                                                                        </div>
                                                                        <p className="subtopic-description">{subtopic.description}</p>
                                                                        {subtopic.keyPoints && subtopic.keyPoints.length > 0 && (
                                                                            <ul className="key-points">
                                                                                {subtopic.keyPoints.map((point, pIdx) => (
                                                                                    <li key={pIdx}>{point}</li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {topicSyllabus.learningObjectives && topicSyllabus.learningObjectives.length > 0 && (
                                                        <div className="syllabus-section">
                                                            <h4>🎯 Learning Objectives</h4>
                                                            <ul className="objectives-list">
                                                                {topicSyllabus.learningObjectives.map((objective, idx) => (
                                                                    <li key={idx}>{objective}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {topicSyllabus.studyTips && topicSyllabus.studyTips.length > 0 && (
                                                        <div className="syllabus-section study-tips">
                                                            <h4>💡 Study Tips</h4>
                                                            <ul className="tips-list">
                                                                {topicSyllabus.studyTips.map((tip, idx) => (
                                                                    <li key={idx}>{tip}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {topicSyllabus.estimatedStudyTime && (
                                                        <div className="syllabus-section study-time">
                                                            <h4>⏱️ Estimated Study Time</h4>
                                                            <p className="time-estimate">{topicSyllabus.estimatedStudyTime}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="empty-content">
                                        <p>No topics identified. Upload more notes for better predictions.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'practice' && selectedExam && (
                            <QuizHistoryAndGenerator 
                                courseName={selectedExam.courseName}
                                examPrediction={examPrediction}
                                onQuizComplete={() => fetchQuizHistory(selectedExam.courseName)}
                            />
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
                                    <button 
                                        className="export-btn" 
                                        onClick={exportRoadmap}
                                        disabled={regeneratingSchedule}
                                        style={scheduleTasks.length > 0 ? {backgroundColor: '#e9b500'} : {}}
                                    >
                                        {regeneratingSchedule ? '⏳ Processing...' : 
                                         scheduleTasks.length > 0 ? '🔄 Regenerate Schedule' : '📅 Generate Schedule'}
                                    </button>
                                </div>
                                
                                {scheduleTasks.length > 0 ? (
                                    <div className="schedule-timeline">
                                        {Object.values(scheduleTasks.reduce((phases, task) => {
                                            const phaseName = task.taskName.split(' | ')[0] || 'Uncategorized';
                                            if (!phases[phaseName]) {
                                                phases[phaseName] = { phase: phaseName, tasks: [] };
                                            }
                                            phases[phaseName].tasks.push(task);
                                            return phases;
                                        }, {}))
                                        .map((phase, idx) => (
                                            <div key={idx} className="schedule-phase">
                                                <div className="phase-header-row">
                                                    <span className="phase-num">{phase.phase}</span>
                                                </div>
                                                <div className="phase-tasks-list">
                                                    {phase.tasks.map((task) => (
                                                        <div key={task._id} className="schedule-task">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={task.isCompleted}
                                                                disabled={task.isCompleted} 
                                                                onChange={() => handleScheduleTaskCompletion(task._id, task.taskName, task.isCompleted)}
                                                            />
                                                            <label htmlFor={`task-${task._id}`}>
                                                                <span 
                                                                    className="task-text" 
                                                                    style={{ 
                                                                        textDecoration: task.isCompleted ? 'line-through' : 'none', 
                                                                        color: task.isCompleted ? '#999' : '#333' 
                                                                    }}
                                                                >
                                                                    {task.taskName.split(' | ')[1] || task.taskName}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-content">
                                        <p>No personalized schedule saved yet. Click "Generate Schedule" to create one based on AI analysis!</p>
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