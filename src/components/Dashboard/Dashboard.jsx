import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Welcome Back! Time to study.</h2>
      <div className="dashboard-grid">
        
        {/* New Dedicated Reminders Card */}
        <div className="card notifications-alerts">
          <h3 style={{color: '#dc3545'}}>🔔 HIGH-PRIORITY ALERTS</h3>
          <ul>
            <li className="alert-item">⚠️ **Midterm Exam (CS 301) preparation phase starts today!**</li>
            <li className="alert-item">📝 Essay (History 101) is due in 3 days. Focus!</li>
          </ul>
        </div>
        
        {/* Existing Upcoming Deadlines Card */}
        <div className="card upcoming-tasks">
          <h3>📅 Upcoming Deadlines</h3>
          <ul>
            <li>📝 Essay - Modern History (Due in 3 days)</li>
            <li>📊 Project Proposal - CS (Due in 7 days)</li>
            <li>📚 Read Chapter 5 - Biology (Due in 1 day)</li>
          </ul>
        </div>
        
        {/* Updated Materials Recommendation Card */}
        <div className="card recommendations material-focus">
          <h3>📚 Prep Materials: CS 301 Midterm</h3>
          <p>The agent suggests you review these materials to start preparing:</p>
          <ul>
            <li><a href="#">Summary: Binary Trees & Graph Traversal</a> (Agent-Generated)</li>
            <li><a href="#">Video: CS 301 Review Session (External Resource)</a></li>
            <li><a href="#">Practice: Final Quiz on Sorting Algorithms</a></li>
          </ul>
        </div>

        <div className="card recent-summaries">
          <h3>📑 Recent Summaries</h3>
          <ul>
            <li><a href="#">Quantum Mechanics Lecture 1</a> (4 min read)</li>
            <li><a href="#">The Industrial Revolution</a> (3 min read)</li>
            <li><a href="#">Machine Learning Basics</a> (5 min read)</li>
          </ul>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;