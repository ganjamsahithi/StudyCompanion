import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import MyNotes from './components/MyNotes/MyNotes';
import Tasks from './components/Tasks/Tasks';
import Chat from './components/Chat/Chat';
import QuizInterface from './components/Quiz/QuizInterface'; // NEW IMPORT
import QuickAddModal from './components/Shared/QuickAddModal'; // NEW IMPORT
import ExamPredictor from './components/ExamPredictor/ExamPredictor.jsx';

import './App.css'; 
import './index.css'; 

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false); // NEW STATE for Quick Add

// src/App.jsx
const renderSection = () => {
    switch (activeSection) {
        case 'dashboard':
            return <Dashboard setActiveSection={setActiveSection} />;
        case 'my-notes':
            return <MyNotes />;
        case 'tasks':
            return <Tasks />;
        case 'chat':
            return <Chat />;
        case 'quiz':
            return <QuizInterface setActiveSection={setActiveSection} />;
        case 'exam-prediction':
            return <ExamPredictor />;
        // Remove this case block:
        // case 'career-path':
        //     return <CareerPath />;
        default:
            return <Dashboard setActiveSection={setActiveSection} />;
    }
};

  return (
    <div className="app-container">
      <Sidebar setActiveSection={setActiveSection} activeSection={activeSection} setIsModalOpen={setIsModalOpen} />
      <div className="main-content">
        <header className="app-header">
          <h1>Agent Compass</h1>
          <div className="user-profile">
            <span>Hi, Student!</span>
            <span className="profile-icon">👤</span>
          </div>
        </header>
        <div className="content-area">
          {renderSection()}
        </div>
      </div>
      
      {/* Renders Quick Add Modal if state is true */}
      <QuickAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /> 
    </div>
  );
}

export default App;