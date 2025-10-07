import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import '../App.css';

const Header = () => {
  return (
    <div className="dashboard-header">
      <div className="header-title">Welcome, Alex!</div>
      <div className="user-profile">
        <span>Hi, user Lirce!</span>
        <FaUserCircle className="icon" />
      </div>
    </div>
  );
};

export default Header;