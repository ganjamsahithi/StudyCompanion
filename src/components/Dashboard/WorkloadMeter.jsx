import React from 'react';
import './Dashboard.css'; // Uses Dashboard.css for styling

const WorkloadMeter = ({ stressScore = 75 }) => {
    let status = 'High (Focus Needed)';
    let color = '#dc3545'; // Red
    if (stressScore < 40) {
        status = 'Low (Great Job!)';
        color = '#5cb85c'; // Green
    } else if (stressScore < 70) {
        status = 'Medium (Stay on Track)';
        color = '#ffc107'; // Yellow
    }

    return (
        <div className="card workload-meter">
            <h3>Workload Meter</h3>
            <div className="meter-visual" style={{ backgroundColor: color }}>
                {stressScore}%
            </div>
            <p style={{textAlign: 'center', fontWeight: 'bold', color: color}}>{status}</p>
        </div>
    );
};

export default WorkloadMeter;