// src/components/Tasks/TaskDeleteConfirmation.jsx
import React from 'react';

const TaskDeleteConfirmation = ({ isOpen, taskName, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay" onClick={onCancel}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                <h4>Confirm Task Deletion</h4>
                <p>Are you sure you want to delete the task:</p>
                <strong>{taskName}</strong>
                <p>This action cannot be undone.</p>
                <div className="delete-modal-actions">
                    <button className="cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="confirm-btn" onClick={onConfirm}>
                        Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDeleteConfirmation;