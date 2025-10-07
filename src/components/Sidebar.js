import React from 'react';
import { FaTh, FaClipboard, FaTasks, FaComments } from 'react-icons/fa';
import '../App.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-brand">Agent Compass</div>
        <nav>
          <ul>
            <li>
              <a href="#" className="active">
                <FaTh className="mr-3" /> Dashboard
              </a>
            </li>
            <li>
              <a href="#">
                <FaClipboard className="mr-3" /> My Notes
              </a>
            </li>
            <li>
              <a href="#">
                <FaTasks className="mr-3" /> Tasks
              </a>
            </li>
            <li>
              <a href="#">
                <FaComments className="mr-3" /> Chat
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <button className="upload-notes">
          <FaClipboard className="mr-2" /> Upload Notes
        </button>
        <button className="ask-agent">
          <FaComments className="mr-2" /> Ask Agent
        </button>
      </div>
    </div>
  );
};

export default Sidebar;