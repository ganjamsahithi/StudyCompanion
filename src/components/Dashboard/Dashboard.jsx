import React from 'react';
import './Dashboard.css';
import WorkloadMeter from './WorkloadMeter';
import LearningProfileCard from './LearningProfileCard';

const handleMaterialClick = (type, material) => {
    alert(`Action: ${type} requested for material: ${material}`);
};

const Dashboard = ({ setActiveSection }) => { 
  return (
    <div className="dashboard">
      <h2>Welcome Back! Time to study.</h2>
      
      {/* --- WORKLOAD & WEAKNESS TRACKING --- */}
      <div className="top-row-grid">
        <WorkloadMeter stressScore={75} />
        <LearningProfileCard />
      </div>
      
      <div className="dashboard-grid">
        
        {/* HIGH-PRIORITY ALERTS */}
        <div className="card notifications-alerts">
          <h3 style={{color: '#dc3545'}}>🔔 HIGH-PRIORITY ALERTS</h3>
          <ul>
            <li className="alert-item">⚠️ **Midterm Exam (Data Structures) preparation phase starts today!**</li>
            <li className="alert-item">📝 Essay (Modern History) is due in 3 days. Focus!</li>
          </ul>
        </div>
        
        {/* UPCOMING DEADLINES */}
        <div className="card upcoming-tasks">
          <h3>📅 Upcoming Deadlines</h3>
          <ul>
            <li>📝 Essay - Modern History (Due in 3 days)</li>
            <li>📊 Project Proposal - Data Structures (Due in 7 days)</li>
            <li>📚 Read Chapter 5 - Biology (Due in 1 day)</li>
          </ul>
        </div>
        
        {/* EXAM PREDICTION & MATERIALS */}
        <div className="card recommendations material-focus">
          <h3>🎓 Exam Prediction: Data Structures Midterm</h3>
          <p>Agent analysis suggests focusing on these topics for high probability:</p>
          <ul>
            <li onClick={() => handleMaterialClick('Roadmap', '7-Day Plan')}>
                <span className="material-type-tag">[Roadmap]</span> 
                <span className="material-link">Custom 7-Day Revision Plan (Personalized)</span>
            </li>
            <li onClick={() => handleMaterialClick('TopicFocus', 'Emphasis Areas')}>
                <span className="material-type-tag">[Topic Focus]</span> 
                <span className="material-link">Top 5 Emphasis Areas (Professor's Past Tests)</span>
            </li>
            <li onClick={() => handleMaterialClick('Practice', 'Sorting Algorithms')}>
                <span className="material-type-tag">[Practice]</span> 
                <span className="material-link">Advanced Sorting Algorithms Review</span>
            </li>
          </ul>
          
          <hr style={{margin: '10px 0'}} />
          
          <button 
              className="quiz-btn" 
              onClick={() => setActiveSection('quiz')} 
          >
              🧠 Generate Predicted Exam Questions
          </button>
        </div>

        {/* RECENT SUMMARIES */}
        <div className="card recent-summaries">
          <h3>📑 Recent Summaries</h3>
          <ul>
            <li onClick={() => handleMaterialClick('Recent', 'Quantum Mechanics')}>
                <span className="material-link">Quantum Mechanics Lecture 1</span> (4 min read)
            </li>
            <li onClick={() => handleMaterialClick('Recent', 'Industrial Revolution')}>
                <span className="material-link">The Industrial Revolution</span> (3 min read)
            </li>
          </ul>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;