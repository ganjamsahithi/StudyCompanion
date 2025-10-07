import React, { useState } from 'react';
import './ExamPredictor.css';

const ExamPredictor = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [examData, setExamData] = useState(null);
  const [activeTab, setActiveTab] = useState('predictions');

  // Mock data - will be replaced with API calls
  const courses = [
    { id: 'cs301', name: 'Data Structures - CS 301' },
    { id: 'phys201', name: 'Thermodynamics - PHYS 201' },
    { id: 'hist101', name: 'Modern History - HIST 101' },
    { id: 'bio202', name: 'Biology - BIO 202' }
  ];

  const mockExamData = {
    cs301: {
      examDate: '2025-11-15',
      topicsLikely: [
        { topic: 'Graph Traversal (DFS/BFS)', probability: 95, importance: 'Critical', lastAppeared: 'Midterm 2024' },
        { topic: 'Binary Trees & BST', probability: 90, importance: 'High', lastAppeared: 'Final 2024' },
        { topic: 'Dynamic Programming', probability: 85, importance: 'High', lastAppeared: 'Midterm 2024' },
        { topic: 'Sorting Algorithms', probability: 75, importance: 'Medium', lastAppeared: 'Final 2023' },
        { topic: 'Hash Tables', probability: 70, importance: 'Medium', lastAppeared: 'Midterm 2023' }
      ],
      professorEmphasis: [
        { topic: 'Time Complexity Analysis', mentions: 12, recentLectures: 'Lec 8, 10, 12' },
        { topic: 'Recursion Patterns', mentions: 10, recentLectures: 'Lec 9, 11, 13' },
        { topic: 'Graph Applications', mentions: 8, recentLectures: 'Lec 14, 15' }
      ],
      practiceQuestions: [
        {
          id: 1,
          question: 'Implement BFS and DFS for a graph. Explain time complexity.',
          difficulty: 'Hard',
          estimatedTime: '25 min',
          topic: 'Graph Traversal'
        },
        {
          id: 2,
          question: 'Given a binary tree, find the lowest common ancestor of two nodes.',
          difficulty: 'Medium',
          estimatedTime: '20 min',
          topic: 'Binary Trees'
        },
        {
          id: 3,
          question: 'Solve the 0/1 Knapsack problem using dynamic programming.',
          difficulty: 'Hard',
          estimatedTime: '30 min',
          topic: 'Dynamic Programming'
        },
        {
          id: 4,
          question: 'Compare QuickSort and MergeSort. When would you use each?',
          difficulty: 'Easy',
          estimatedTime: '15 min',
          topic: 'Sorting'
        },
        {
          id: 5,
          question: 'Design a hash table with collision resolution. Analyze performance.',
          difficulty: 'Medium',
          estimatedTime: '20 min',
          topic: 'Hash Tables'
        }
      ],
      revisionRoadmap: {
        daysUntilExam: 35,
        phases: [
          {
            phase: 'Phase 1: Foundation Review',
            duration: '10 days',
            startDate: '2025-10-11',
            endDate: '2025-10-20',
            tasks: [
              { task: 'Review all lecture notes (Lec 1-15)', hours: 6, priority: 'High' },
              { task: 'Redo problem sets 1-5', hours: 8, priority: 'High' },
              { task: 'Watch recap videos on weak areas', hours: 4, priority: 'Medium' }
            ]
          },
          {
            phase: 'Phase 2: Deep Dive Critical Topics',
            duration: '12 days',
            startDate: '2025-10-21',
            endDate: '2025-11-01',
            tasks: [
              { task: 'Master Graph algorithms (DFS, BFS, Dijkstra)', hours: 10, priority: 'Critical' },
              { task: 'Practice 20 Binary Tree problems', hours: 8, priority: 'High' },
              { task: 'Complete DP problem set', hours: 10, priority: 'High' },
              { task: 'Study group sessions', hours: 4, priority: 'Medium' }
            ]
          },
          {
            phase: 'Phase 3: Practice & Mock Tests',
            duration: '8 days',
            startDate: '2025-11-02',
            endDate: '2025-11-09',
            tasks: [
              { task: 'Take 3 full-length mock exams', hours: 9, priority: 'Critical' },
              { task: 'Review mistakes from mocks', hours: 6, priority: 'High' },
              { task: 'Speed practice (timed problems)', hours: 5, priority: 'High' }
            ]
          },
          {
            phase: 'Phase 4: Final Review',
            duration: '5 days',
            startDate: '2025-11-10',
            endDate: '2025-11-14',
            tasks: [
              { task: 'Review summary notes', hours: 4, priority: 'High' },
              { task: 'Memorize key algorithms', hours: 3, priority: 'High' },
              { task: 'Light practice (confidence building)', hours: 3, priority: 'Medium' },
              { task: 'Rest and mental preparation', hours: 2, priority: 'High' }
            ]
          }
        ],
        totalStudyHours: 80,
        recommendedDailyHours: 2.3
      }
    }
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    setExamData(mockExamData[courseId] || null);
  };

  const generateQuiz = () => {
    alert('Generating personalized quiz based on exam predictions...');
    // Will integrate with backend
  };

  const exportRoadmap = () => {
    alert('Exporting roadmap to calendar...');
    // Will integrate with calendar API
  };

  return (
    <div className="exam-predictor">
      <div className="predictor-header">
        <h2>📊 Exam Prediction & Preparation</h2>
        <p>AI-powered analysis of past patterns and personalized study roadmaps</p>
      </div>

      {/* Course Selection */}
      <div className="course-selector">
        <label>Select Course:</label>
        <select 
          value={selectedCourse} 
          onChange={(e) => handleCourseSelect(e.target.value)}
          className="course-dropdown"
        >
          <option value="">Choose a course...</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>

      {examData && (
        <>
          {/* Exam Info Banner */}
          <div className="exam-info-banner">
            <div className="exam-date">
              <span className="label">Exam Date:</span>
              <span className="date">{new Date(examData.examDate).toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}</span>
            </div>
            <div className="days-remaining">
              <span className="number">{examData.revisionRoadmap.daysUntilExam}</span>
              <span className="label">Days Until Exam</span>
            </div>
            <div className="study-hours">
              <span className="number">{examData.revisionRoadmap.totalStudyHours}h</span>
              <span className="label">Total Study Time Needed</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="predictor-tabs">
            <button 
              className={activeTab === 'predictions' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('predictions')}
            >
              🎯 Topic Predictions
            </button>
            <button 
              className={activeTab === 'practice' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('practice')}
            >
              📝 Practice Questions
            </button>
            <button 
              className={activeTab === 'roadmap' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('roadmap')}
            >
              🗺️ Revision Roadmap
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'predictions' && (
              <div className="predictions-section">
                <div className="section-card">
                  <h3>📈 Topics Likely to Appear</h3>
                  <div className="topics-list">
                    {examData.topicsLikely.map((item, idx) => (
                      <div key={idx} className="topic-item">
                        <div className="topic-header">
                          <span className="topic-name">{item.topic}</span>
                          <span className={`importance-badge ${item.importance.toLowerCase()}`}>
                            {item.importance}
                          </span>
                        </div>
                        <div className="probability-bar">
                          <div 
                            className="probability-fill" 
                            style={{ width: `${item.probability}%` }}
                          >
                            <span className="probability-text">{item.probability}% likely</span>
                          </div>
                        </div>
                        <div className="topic-footer">
                          <span className="last-appeared">Last appeared: {item.lastAppeared}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section-card">
                  <h3>👨‍🏫 Professor's Emphasis Areas</h3>
                  <p className="section-description">
                    Based on lecture frequency and recent class discussions
                  </p>
                  <div className="emphasis-list">
                    {examData.professorEmphasis.map((item, idx) => (
                      <div key={idx} className="emphasis-item">
                        <div className="emphasis-topic">{item.topic}</div>
                        <div className="emphasis-stats">
                          <span className="mentions">
                            🔁 Mentioned {item.mentions} times
                          </span>
                          <span className="lectures">
                            📚 {item.recentLectures}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'practice' && (
              <div className="practice-section">
                <div className="practice-header">
                  <h3>💪 Recommended Practice Questions</h3>
                  <button className="generate-quiz-btn" onClick={generateQuiz}>
                    ⚡ Generate Custom Quiz
                  </button>
                </div>
                <div className="questions-list">
                  {examData.practiceQuestions.map((q) => (
                    <div key={q.id} className="question-card">
                      <div className="question-header">
                        <span className="question-number">Question {q.id}</span>
                        <div className="question-meta">
                          <span className={`difficulty ${q.difficulty.toLowerCase()}`}>
                            {q.difficulty}
                          </span>
                          <span className="time">⏱️ {q.estimatedTime}</span>
                        </div>
                      </div>
                      <div className="question-text">{q.question}</div>
                      <div className="question-footer">
                        <span className="topic-tag">{q.topic}</span>
                        <button className="attempt-btn">Attempt Now →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'roadmap' && (
              <div className="roadmap-section">
                <div className="roadmap-header">
                  <div>
                    <h3>🗺️ Personalized Revision Roadmap</h3>
                    <p className="roadmap-summary">
                      {examData.revisionRoadmap.totalStudyHours} hours over {examData.revisionRoadmap.daysUntilExam} days 
                      • ~{examData.revisionRoadmap.recommendedDailyHours} hours/day
                    </p>
                  </div>
                  <button className="export-btn" onClick={exportRoadmap}>
                    📅 Export to Calendar
                  </button>
                </div>

                <div className="phases-timeline">
                  {examData.revisionRoadmap.phases.map((phase, idx) => (
                    <div key={idx} className="phase-card">
                      <div className="phase-header">
                        <div className="phase-number">Phase {idx + 1}</div>
                        <div className="phase-info">
                          <h4>{phase.phase}</h4>
                          <p className="phase-duration">
                            📅 {phase.startDate} to {phase.endDate} ({phase.duration})
                          </p>
                        </div>
                      </div>
                      <div className="phase-tasks">
                        {phase.tasks.map((task, taskIdx) => (
                          <div key={taskIdx} className="task-item">
                            <input type="checkbox" id={`task-${idx}-${taskIdx}`} />
                            <label htmlFor={`task-${idx}-${taskIdx}`}>
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
              </div>
            )}
          </div>
        </>
      )}

      {!examData && selectedCourse && (
        <div className="no-data">
          <p>⚠️ No exam data available for this course yet.</p>
          <p>Upload past exam papers and lecture notes to enable predictions.</p>
        </div>
      )}
    </div>
  );
};

export default ExamPredictor;