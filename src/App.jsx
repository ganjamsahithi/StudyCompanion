import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import MyNotes from './components/MyNotes/MyNotes';
import Tasks from './components/Tasks/Tasks';
import './App.css'; // Add a basic App.css for header/user profile if needed

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard/>;
      case 'my-notes':
        return <MyNotes/>;
      case 'tasks':
        return <Tasks/>;
      default:
        return <Dashboard/>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar setActiveSection={setActiveSection} activeSection={activeSection} />
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
    </div>
  );
}

export default App;