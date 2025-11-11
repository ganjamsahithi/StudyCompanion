// src/components/Dashboard/LearningProfileCard.jsx
import React from 'react';
import './LearningProfileCard.css';

const LearningProfileCard = ({ conceptsReviewed, weakAreas, recentQuizCount }) => {
  return (
    <div className="learning-profile-card">
      <h3>🧠 Learning Profile & Weak Areas</h3>
      
      <div className="profile-stats">
        <div className="stat-item">
          <div className="stat-icon concepts">
            <i className="fas fa-book-open"></i>
          </div>
          <div className="stat-content">
            <span className="stat-number">{conceptsReviewed}</span>
            <span className="stat-label">Concepts Reviewed</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon quizzes">
            <i className="fas fa-clipboard-check"></i>
          </div>
          <div className="stat-content">
            <span className="stat-number">{recentQuizCount}</span>
            <span className="stat-label">Recent Quizzes</span>
          </div>
        </div>
      </div>

      <div className="weak-areas-section">
        <h4>📉 Areas Needing Improvement</h4>
        
        {weakAreas && weakAreas.length > 0 ? (
          <div className="weak-areas-list">
            {weakAreas.map((area, index) => (
              <div key={index} className="weak-area-item">
                <div className="area-info">
                  <span className="area-name">{area.topic}</span>
                  <span className="area-course">{area.courseName}</span>
                </div>
                <div className="area-score">
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${area.score}%` }}
                    ></div>
                  </div>
                  <span className="score-text">{area.score}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data-state">
            <i className="fas fa-chart-line"></i>
            <p>Complete quizzes to identify weak areas and track your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningProfileCard;