import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Card from './Card';
import { FaCalendarAlt, FaCheckCircle, FaLightbulb, FaUserCircle } from 'react-icons/fa';
import '../App.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="content-area">
        <Header />
        <div className="dashboard-grid">
          
          {/* Upcoming Deadlines Card */}
          <Card title="Upcoming Deadlines" icon={<FaCalendarAlt className="text-blue-500" />}>
            <ul className="upcoming-deadlines-list">
              <li>
                <span><span className="deadline-text">Essay - Modern History</span></span>
                <span style={{ color: 'red' }}>Due in 3 days</span>
              </li>
              <li>
                <span><span className="deadline-text">Problem Set 7 - Physics</span></span>
                <span style={{ color: 'orange' }}>Due tomorrow</span>
              </li>
              <li>
                <span><span className="deadline-text">Final Project Proposal - CS</span></span>
                <span style={{ color: 'gray' }}>Due in 7 days</span>
              </li>
            </ul>
          </Card>

          {/* Recent Summaries Card */}
          <Card title="Recent Summaries" icon={<FaCheckCircle className="text-green-500" />}>
            <ul>
              <li>Quantum Mechanics Hle 1</li>
              <li>The Industrial - Physics</li>
              <li>Machine Learning Basics</li>
            </ul>
          </Card>

          {/* My Notes Card */}
          <Card title="My Notes" className="my-notes-card">
            <div className="input-group">
              <input type="text" placeholder="Input file" />
              <button className="upload-btn">Upload</button>
            </div>
            <div className="input-group">
              <input type="text" placeholder="Cepa Name" />
              <button className="active-btn">Active</button>
            </div>
          </Card>

          {/* Personalized Recommendations Card */}
          <Card title="Personalized Recommendations" icon={<FaLightbulb className="text-yellow-500" />}>
            <ul>
              <li>Video: Feynman Lectures on Physics</li>
              <li>Practice Problems</li>
              <li>Research: Deep Learning Architectures</li>
            </ul>
          </Card>

          {/* Task View */}
          <Card title="Task View" className="task-view-card">
            <div className="input-group">
              <input type="text" placeholder="Task Name" />
              <button className="add-task-btn">Add Task</button>
              <button className="done-task-btn">Done</button>
            </div>
          </Card>

          {/* Donns View */}
          <Card title="Donns View">
            <div className="input-group">
              <input type="text" placeholder="Task Name" />
              <button className="send-btn">Send</button>
            </div>
          </Card>

          {/* Chat with Agent */}
          <Card title="Chat with Agent" className="chat-card">
            <div className="chat-box">
              <textarea placeholder="SemssageBn"></textarea>
              <button className="send-btn">Send</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;