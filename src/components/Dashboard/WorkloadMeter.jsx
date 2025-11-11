// src/components/Dashboard/WorkloadMeter.jsx
import React from 'react';
import './WorkloadMeter.css';

const WorkloadMeter = ({ stressScore }) => {
  // Determine stress level and color
  const getStressLevel = (score) => {
    if (score <= 30) return { level: 'Low', color: '#4CAF50', emoji: '😊' };
    if (score <= 60) return { level: 'Moderate', color: '#FF9800', emoji: '😐' };
    if (score <= 80) return { level: 'High', color: '#FF5722', emoji: '😰' };
    return { level: 'Critical', color: '#f44336', emoji: '😱' };
  };

  const stressInfo = getStressLevel(stressScore);
  const circumference = 2 * Math.PI * 70; // radius = 70
  const offset = circumference - (stressScore / 100) * circumference;

  return (
    <div className="workload-meter-card">
      <h3>📊 Your Workload Status</h3>
      
      <div className="meter-container">
        <svg className="circular-meter" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            className="meter-bg"
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            className="meter-progress"
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={stressInfo.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 80 80)"
          />
          {/* Center text */}
          <text
            x="80"
            y="75"
            textAnchor="middle"
            fontSize="32"
            fontWeight="bold"
            fill={stressInfo.color}
          >
            {stressScore}
          </text>
          <text
            x="80"
            y="95"
            textAnchor="middle"
            fontSize="14"
            fill="#666"
          >
            / 100
          </text>
        </svg>
      </div>

      <div className="stress-info">
        <div className="stress-level" style={{ color: stressInfo.color }}>
          <span className="emoji">{stressInfo.emoji}</span>
          <span className="level-text">{stressInfo.level} Stress</span>
        </div>
        
        <div className="stress-description">
          {stressScore <= 30 && (
            <p>✨ Great job! Your workload is manageable. Keep up the good work!</p>
          )}
          {stressScore > 30 && stressScore <= 60 && (
            <p>👍 Your workload is moderate. Stay organized to keep things under control.</p>
          )}
          {stressScore > 60 && stressScore <= 80 && (
            <p>⚠️ High workload detected. Consider prioritizing urgent tasks first.</p>
          )}
          {stressScore > 80 && (
            <p>🚨 Critical workload! Focus on overdue and today's tasks immediately.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkloadMeter;