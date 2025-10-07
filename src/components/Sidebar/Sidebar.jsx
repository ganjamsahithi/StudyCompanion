import React from 'react';
import './Sidebar.css';

// Added setIsModalOpen prop
const Sidebar = ({ setActiveSection, activeSection, setIsModalOpen }) => {
  const menuItems = [
    { name: 'Dashboard', key: 'dashboard' },
    { name: 'My Notes', key: 'my-notes' },
    { name: 'Tasks & Deadlines', key: 'tasks' },
    { name: 'Agent Chat', key: 'chat' },
    { name: 'Exam Predictor', key: 'exam-prediction' }, // NEW
    { name: 'Career Hub', key: 'career-hub' }, // NEW
  ];
  

  return (
    <div className="sidebar">
      <div className="logo-container">
        {/* Placeholder for future logo */}
      </div>
      <nav className="nav-menu">
        <ul>
          {menuItems.map(item => (
            <li 
              key={item.key}
              className={activeSection === item.key ? 'active' : ''}
              onClick={() => setActiveSection(item.key)}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </nav>
      <div className="quick-actions">
        <h4>Quick Actions</h4>
        <button className="action-btn upload">Upload Notes</button>
        {/* Button to open the Quick Add Modal */}
        <button className="action-btn add-task" onClick={() => setIsModalOpen(true)}>Quick Add</button> 
        <button className="action-btn ask-agent" onClick={() => setActiveSection('chat')}>Ask Agent</button>
      </div>
    </div>
  );
};

export default Sidebar;