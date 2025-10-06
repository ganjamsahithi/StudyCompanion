import React from 'react';
import './Sidebar.css';

const Sidebar = ({ setActiveSection, activeSection }) => {
  const menuItems = [
    { name: 'Dashboard', key: 'dashboard' },
    { name: 'My Notes', key: 'my-notes' },
    { name: 'Tasks & Deadlines', key: 'tasks' },
  ];

  return (
    <div className="sidebar">
      <div className="logo-container">
        {/* Logo/Name is moved to App.jsx header, this keeps the sidebar clean */}
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
        <button className="action-btn add-task">Add New Task</button>
        <button className="action-btn ask-agent">Ask Agent</button>
      </div>
    </div>
  );
};

export default Sidebar;