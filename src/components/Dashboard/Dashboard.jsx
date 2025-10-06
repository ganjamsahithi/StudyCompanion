import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Welcome Back! Time to study.</h2>
      <div className="dashboard-grid">
        
        <div className="card upcoming-tasks">
          <h3>📅 Upcoming Deadlines</h3>
          <ul>
            <li>📝 Essay - Modern History (Due in 3 days)</li>
            <li>📊 Project Proposal - CS (Due in 7 days)</li>
            <li>📚 Read Chapter 5 - Biology (Due in 1 day)</li>
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
        
        <div className="card recommendations">
          <h3>💡 Personalized Recommendations</h3>
          <p>Based on your performance in Physics, check these out:</p>
          <ul>
            <li>Video: Feynman Lectures on Physics (YouTube)</li>
            <li>Practice: Problem Set 2 on Khan Academy</li>
            <li>Paper: Review of Quantum Entanglement (ResearchGate)</li>
          </ul>
        </div>

        <div className="card chat-preview">
          <h3>💬 Chat with Agent</h3>
          <div className="chat-box">
            <p><strong>Agent:</strong> I see you are struggling with 'Centripetal Force'. Would you like a fresh explanation or more practice problems?</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;