import React, { useState } from 'react';
import './QuickAddModal.css';

const QuickAddModal = ({ isOpen, onClose }) => {
    const [task, setTask] = useState('');
    const [date, setDate] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (task.trim()) {
            alert(`Quick Task Added! Task: ${task}, Date: ${date || 'No Date'}`);
            // In a real app, this sends a minimal task payload to the backend
            setTask('');
            setDate('');
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Quick Add Task</h3>
                <input
                    type="text"
                    placeholder="Task Name (e.g., Check LMS for notes)"
                    value={task}
                    onChange={(e) => setTask(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Due Date (e.g., Tomorrow, Friday)"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="submit-btn" onClick={handleSubmit}>Add Task</button>
                </div>
            </div>
        </div>
    );
};

export default QuickAddModal;