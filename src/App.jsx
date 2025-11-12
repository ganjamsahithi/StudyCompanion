// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import MyNotes from './components/MyNotes/MyNotes';
import Tasks from './components/Tasks/Tasks';
import Chat from './components/Chat/Chat';
import CareerHub from './components/Career/CareerHub'; 
import QuizInterface from './components/Quiz/QuizInterface'; 
import QuickAddModal from './components/Shared/QuickAddModal'; 
import ExamPredictor from './components/ExamPredictor/ExamPredictor.jsx';
import NotificationBadge from './components/Shared/NotificationBadge'; // NEW IMPORT for Reminders

import './App.css'; 
import './index.css'; 

function App() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isModalOpen, setIsModalOpen] = useState(false); 

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
            case 'career-hub': 
                return <CareerHub />;
            case 'exam-prediction':
                return <ExamPredictor />;
            default:
                return <Dashboard setActiveSection={setActiveSection} />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar setActiveSection={setActiveSection} activeSection={activeSection} setIsModalOpen={setIsModalOpen} />
            <div className="main-content">
                <header className="app-header">
                    <h1>Study Companion</h1>
                    <div className="user-profile">
                        <span>Hi, Student!</span>
                        <span className="profile-icon">
                            <NotificationBadge /> {/* Notification Badge added here */}
                            👤
                        </span>
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