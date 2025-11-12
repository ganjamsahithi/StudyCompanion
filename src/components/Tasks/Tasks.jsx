import React, { useState, useEffect, useCallback } from 'react';
// Import useLocation to read the state passed from Sidebar
import { useLocation } from 'react-router-dom'; 
import './Tasks.css';

const API_BASE_URL = 'http://localhost:5000/tasks';

// --- Helper Functions (Unchanged) ---
const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) {
        hours -= 12;
    } else if (hours === 0) {
        hours = 12;
    }
    
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hoursStr}:${minutes} ${ampm}`;
};

const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

const convertTo24Hour = (timeStr, amPm) => {
    let [hours, minutes] = timeStr.split(':').map(Number);
    
    if (amPm === 'AM' && hours !== 12) {
        hours += 12;
    } else if (amPm === 'PM' && hours === 12) {
        hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const createISODateTime = (dateStr, timeStr24Hour) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr24Hour.split(':').map(Number);
    
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    return date.toISOString();
};

const isTimeInPast = (dateStr, timeStr24Hour) => {
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr24Hour.split(':').map(Number);
    
    const selectedDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    return selectedDate < now;
};


// --- Add Task Modal Component ---
const AddTaskModal = ({ onAddTask, onClose, error, setError }) => {
    const [newTaskName, setNewTaskName] = useState('');
    const [newDueDate, setNewDueDate] = useState(getTodayDate());
    const [newTime, setNewTime] = useState(getCurrentTime());
    const [newAmPm, setNewAmPm] = useState('AM');
    const [newType, setNewType] = useState('Assignment');
    const [newCourseName, setNewCourseName] = useState('');
    
    const taskTypes = ['Assignment', 'Exam', 'Project', 'Reading', 'Review'];
    const today = getTodayDate();

    const handleSubmit = () => {
        // Validation logic
        if (newTaskName.trim() === '' || !newDueDate || newCourseName.trim() === '') {
            setError('Please fill in the task name, course, and due date.');
            return;
        }

        const time24Hour = convertTo24Hour(newTime, newAmPm);
        if (isTimeInPast(newDueDate, time24Hour)) {
            setError('Please select a future date and time.');
            return;
        }

        setError('');
        const isoDueDate = createISODateTime(newDueDate, time24Hour);

        const taskData = {
            taskName: newTaskName.trim(),
            courseName: newCourseName.trim(),
            taskType: newType,
            dueDate: isoDueDate,
        };
        
        // Pass data up to the parent and reset form
        onAddTask(taskData);
        // Modal closes in parent component after fetch success/failure
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-task-modal" onClick={e => e.stopPropagation()}>
                <h3>Quick Add New Deadline</h3>
                
                {/* Re-using the existing input structure */}
                <div className="task-input-group">
                    <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                        {taskTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Course Name (e.g., CS 301)"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Task Name (e.g., Study for Midterm)"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                    />
                    <input
                        type="date"
                        title="Select Deadline Date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        min={today}
                    />
                    <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                    />
                    <select value={newAmPm} onChange={(e) => setNewAmPm(e.target.value)}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                    <div className="modal-actions">
                         <button className="add-btn" onClick={handleSubmit}>Add Deadline</button>
                         <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- QUICK ACTION & MODAL STATES ---
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null); // {id, taskName}
    const location = useLocation();

    // --- API Fetching (Wrapped in useCallback) ---
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(API_BASE_URL + '/');
            if (!response.ok) throw new Error('Failed to fetch tasks from server.');
            
            const data = await response.json();
            // Sort tasks by due date ascending
            const sortedData = data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            setTasks(sortedData);
        } catch (err) {
            setError(`Error loading tasks: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []); 

    // Fetch tasks on mount (using stable fetchTasks)
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]); 

    // --- QUICK ACTION EFFECT ---
    useEffect(() => {
        // Check if the navigation state dictates opening the Quick Add modal
        if (location.state && location.state.openModal === 'addTask') {
            setIsAddTaskModalOpen(true);
            // Clear the state so the modal doesn't reopen on future component updates
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [location.state, location.pathname]);


    // --- Add Task Handler ---
    const handleAddTask = async (taskData) => {
        // Clear any previous error messages
        setError('');
        
        try {
            const response = await fetch(API_BASE_URL + '/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add task.');
            }

            // Close the modal and refresh tasks
            setIsAddTaskModalOpen(false);
            fetchTasks();

        } catch (err) {
            setError(`Error adding task: ${err.message}`);
            console.error(err);
        }
    };

    // --- Delete Task Handler ---
    const handleDeleteTask = async () => {
        if (!deleteModal || !deleteModal.id) return;
        
        const id = deleteModal.id;
        setDeleteModal(null); // Close modal immediately

        try {
            const response = await fetch(API_BASE_URL + `/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete task.');
            }

            setTasks(prev => prev.filter(t => t._id !== id));
            setError('');

        } catch (err) {
            setError(`Error deleting task: ${err.message}`);
            console.error(err);
        }
    };

    return (
        <div className="tasks-container">
            <h2>Your Academic Tasks</h2>

            {error && <div className="error-message">{error}</div>}

            {/* Manual button to open the modal */}
            <button 
                className="manual-add-btn"
                onClick={() => setIsAddTaskModalOpen(true)}
                style={{marginBottom: '1rem', padding: '0.75rem 1.5rem'}}
            >
                + Add New Deadline
            </button>
            
            {/* 1. RENDER ADD TASK MODAL (for Quick Add or manual click) */}
            {isAddTaskModalOpen && (
                <AddTaskModal 
                    onAddTask={handleAddTask} 
                    onClose={() => setIsAddTaskModalOpen(false)}
                    error={error}
                    setError={setError}
                />
            )}

            {/* 2. RENDER DELETE CONFIRMATION MODAL (REPLACEMENT FOR window.confirm) */}
            {deleteModal && (
                <div className="delete-modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to permanently delete: <strong>{deleteModal.taskName}</strong>?</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setDeleteModal(null)}>Cancel</button>
                            <button className="confirm-delete-btn" onClick={handleDeleteTask}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- Task List Rendering --- */}
            <div className="task-list card">
                <h4>My To-Do List</h4>
                {loading && <p>Loading...</p>}
                {!loading && tasks.length === 0 ? (
                    <p className="empty-state">No tasks yet! Click "Add New Deadline" above.</p>
                ) : (
                    <ul>
                        {tasks.map(task => (
                            <li key={task._id}>
                                <div className="task-item">
                                    <div className="task-info">
                                        <span className="task-course">[{task.courseName}]</span>
                                        <span 
                                            className="task-type-badge" 
                                            style={{
                                                backgroundColor: {
                                                    'Assignment': '#4CAF50',
                                                    'Exam': '#f44336',
                                                    'Project': '#2196F3',
                                                    'Reading': '#FF9800',
                                                    'Review': '#9C27B0'
                                                }[task.taskType] || '#757575'
                                            }}
                                        >
                                            {task.taskType}
                                        </span>
                                        <span className="task-name">{task.taskName}</span>
                                    </div>
                                    <div className="task-meta">
                                        <span className="due-date">Due: {formatDateDisplay(task.dueDate)}</span>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => setDeleteModal({ id: task._id, taskName: task.taskName })}
                                            title="Delete task"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Tasks;