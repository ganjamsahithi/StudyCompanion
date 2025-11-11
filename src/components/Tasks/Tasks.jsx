// src/components/Tasks/Tasks.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './Tasks.css';

const API_BASE_URL = 'http://localhost:8000/tasks';

// Helper to format date for display (DD/MM/YYYY HH:MM AM/PM)
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

// Helper to get today's date in YYYY-MM-DD
const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Helper to get current time in HH:MM format (24-hour)
const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Helper to convert 12-hour to 24-hour format
const convertTo24Hour = (timeStr, amPm) => {
    let [hours, minutes] = timeStr.split(':').map(Number);
    
    if (amPm === 'PM' && hours !== 12) {
        hours += 12;
    } else if (amPm === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Helper to create ISO string - FIXED to use local time
const createISODateTime = (dateStr, timeStr24Hour) => {
    // dateStr is YYYY-MM-DD
    // timeStr24Hour is HH:MM in 24-hour format
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr24Hour.split(':').map(Number);
    
    // Create date in local timezone
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Convert to ISO string
    return date.toISOString();
};

// Helper to check if time is in the past
const isTimeInPast = (dateStr, timeStr24Hour) => {
    const now = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr24Hour.split(':').map(Number);
    
    const selectedDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    return selectedDate < now;
};

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form States
    const [newTaskName, setNewTaskName] = useState('');
    const [newDueDate, setNewDueDate] = useState(getTodayDate());
    const [newTime, setNewTime] = useState(getCurrentTime());
    const [newAmPm, setNewAmPm] = useState('PM');
    const [newType, setNewType] = useState('Assignment');
    const [newCourseName, setNewCourseName] = useState('');

    const taskTypes = ['Assignment', 'Exam', 'Project', 'Reading', 'Review'];
    const today = getTodayDate();

    // --- API Fetching ---
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(API_BASE_URL + '/');
            if (!response.ok) throw new Error('Failed to fetch tasks from server.');
            
            const data = await response.json();
            setTasks(data);
        } catch (err) {
            setError(`Error loading tasks: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // --- Add Task Handler ---
    const handleAddTask = async () => {
        if (newTaskName.trim() === '' || !newDueDate || newCourseName.trim() === '') {
            setError('Please fill in the task name, course, and due date.');
            return;
        }

        // Convert 12-hour to 24-hour first
        const time24Hour = convertTo24Hour(newTime, newAmPm);

        // Check if time is in the past
        if (isTimeInPast(newDueDate, time24Hour)) {
            setError('Please select a future date and time.');
            return;
        }

        setError('');
        
        // Create ISO string with correct local time
        const isoDueDate = createISODateTime(newDueDate, time24Hour);

        const taskData = {
            taskName: newTaskName.trim(),
            courseName: newCourseName.trim(),
            taskType: newType,
            dueDate: isoDueDate,
        };

        console.log('Sending task data:', taskData);

        try {
            const response = await fetch(API_BASE_URL + '/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) {
                throw new Error('Failed to add task.');
            }

            // Reset form
            setNewTaskName('');
            setNewCourseName('');
            setNewDueDate(getTodayDate());
            setNewTime(getCurrentTime());
            setNewAmPm('PM');
            setNewType('Assignment');
            
            // Refresh tasks
            fetchTasks();

        } catch (err) {
            setError(`Error adding task: ${err.message}`);
            console.error(err);
        }
    };

    // --- Delete Task Handler ---
    const handleDeleteTask = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(API_BASE_URL + `/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete task.');
                }

                setTasks(prev => prev.filter(t => t._id !== id));
                setError('');

            } catch (err) {
                setError(`Error deleting task: ${err.message}`);
                console.error(err);
            }
        }
    };

    return (
        <div className="tasks-container">
            <h2>Your Academic Tasks</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="add-task-section card">
                <h4>Add New Deadline</h4>
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
                    <button onClick={handleAddTask}>Add Deadline</button>
                </div>
            </div>

            <div className="task-list card">
                <h4>My To-Do List</h4>
                {loading && <p>Loading...</p>}
                {!loading && tasks.length === 0 ? (
                    <p className="empty-state">No tasks yet! Add one above.</p>
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
                                            onClick={() => handleDeleteTask(task._id)}
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