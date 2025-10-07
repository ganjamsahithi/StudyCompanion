import React from 'react';
import './Dashboard.css';
import WorkloadMeter from './WorkloadMeter'; // NEW IMPORT
import LearningProfileCard from './LearningProfileCard'; // NEW IMPORT

const handleMaterialClick = (type, material) => {
    alert(`Action: ${type} requested for material: ${material}`);
};

const Dashboard = ({ setActiveSection }) => { 
  return (
    <div className="dashboard">
      <h2>Welcome Back! Time to study.</h2>
      
      <div className="top-row-grid">
        <WorkloadMeter stressScore={75} /> {/* Example Data */}
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
        
        {/* AUTOMATED PREP MATERIALS CARD */}
        <div className="card recommendations material-focus">
          <h3>📚 Prep Materials: Data Structures Midterm</h3>
          <p>The agent has automatically curated these resources:</p>
          <ul>
            <li onClick={() => handleMaterialClick('Summary', 'Binary Trees')}>
                <span className="material-type-tag">[Summary]</span> 
                <span className="material-link">Binary Trees & Graph Traversal (Agent-Generated)</span>
            </li>
            <li onClick={() => handleMaterialClick('Video', 'Review Session')}>
                <span className="material-type-tag">[Video]</span> 
                <span className="material-link">Data Structures Review Session (External)</span>
            </li>
            <li onClick={() => handleMaterialClick('Paper', 'Sorting Algorithms')}>
                <span className="material-type-tag">[Paper]</span> 
                <span className="material-link">Advanced Sorting Algorithms Review</span>
            </li>
          </ul>
          
          <hr style={{margin: '10px 0'}} />
          
          {/* Dedicated Quiz Button - ROUTED TO NEW QUIZ COMPONENT */}
          <button 
              className="quiz-btn" 
              onClick={() => setActiveSection('quiz')} 
          >
              🧠 Generate Quick Quiz Now
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