import React from 'react';
import '../App.css'; // Import the main CSS file

const Card = ({ title, icon, children, className }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        {icon && <div className="icon">{icon}</div>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
};

export default Card;