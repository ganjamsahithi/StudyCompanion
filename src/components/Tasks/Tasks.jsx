// src/components/Tasks/Tasks.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './Tasks.css';
import TaskDeleteConfirmation from './TaskDeleteConfirmation'; 

const API_BASE_URL = 'http://localhost:5000/tasks';

// Helper to format date for display (FIXED to DD/MM/YYYY and includes time)
const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return 'Invalid Date';
    
    // Using 'en-GB' (Great Britain) locale forces DD/MM/YYYY format
    return date.toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Uses 12-hour format with AM/PM
    });
};

// Helper to get today's date in YYYY-MM-DD for the date input minimum
const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form States
    const [newTaskName, setNewTaskName] = useState('');
    const [newDueDate, setNewDueDate] = useState(getTodayDate());
    const [newTime, setNewTime] = useState('12:00'); 
    const [newAmPm, setNewAmPm] = useState('PM');     
    const [newType, setNewType] = useState('Assignment');
    const [newCourseName, setNewCourseName] = useState('');

    // Delete Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

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

    // --- Core Logic ---

    // Function to combine Date, Time, and AM/PM into a single ISO string for the backend
    const combineDateTime = (dateStr, timeStr, amPm) => {
        let [hours, minutes] = timeStr.split(':').map(Number);
        
        // Convert 12hr to 24hr format
        if (amPm === 'PM' && hours !== 12) {
            hours += 12;
        } else if (amPm === 'AM' && hours === 12) {
            hours = 0;
        }
        
        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);
        
        return date.toISOString();
    };

    // --- Add Task Handler ---

    const handleAddTask = async () => {
        if (newTaskName.trim() === '' || !newDueDate || newCourseName.trim() === '') {
            setError('Please fill in the task name, course, and due date.');
            return;
        }
        setError('');
        
        const isoDueDate = combineDateTime(newDueDate, newTime, newAmPm);

        const taskData = {
            taskName: newTaskName.trim(),
            courseName: newCourseName.trim(),
            taskType: newType,
            dueDate: isoDueDate,
        };

        try {
            const response = await fetch(API_BASE_URL + '/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) {
                throw new Error('Failed to add task.');
            }

            setNewTaskName('');
            setNewCourseName('');
            setNewDueDate(getTodayDate());
            setNewTime('12:00');
            setNewAmPm('PM');
            setNewType('Assignment');
            fetchTasks();

        } catch (err) {
            setError(`Error adding task: ${err.message}`);
            console.error(err);
        }
    };

    // --- Delete Confirmation Logic (Checkbox Click) ---

    // 1. Show the confirmation modal when the user checks the box
    const handleCheckboxClick = (task) => {
        if (task.isCompleted) {
             // If already completed, toggle off immediately without confirmation
            handleToggleComplete(task._id, true); 
        } else {
             // If marking complete, ask for confirmation to delete/remove
            setTaskToDelete(task);
            setIsDeleteModalOpen(true);
        }
    };
    
    // 2. Finalize deletion from the modal
    const handleConfirmDelete = async () => {
        const id = taskToDelete._id;
        setIsDeleteModalOpen(false); // Close the modal

        try {
            // Delete from database
            const deleteResponse = await fetch(API_BASE_URL + `/${id}`, {
                method: 'DELETE'
            });

            if (!deleteResponse.ok) {
                throw new Error('Failed to delete task from database.');
            }
            
            // Remove from local state and clear error
            setTasks(prev => prev.filter(t => t._id !== id));
            setError('');

        } catch (err) {
            setError(`Error deleting task: ${err.message}`);
            console.error(err);
        } finally {
            setTaskToDelete(null);
        }
    };

    // 3. Toggle Complete (used only when un-checking)
    const handleToggleComplete = async (id, currentStatus) => {
        const newStatus = !currentStatus;

        setTasks(prevTasks =>
            prevTasks.map(task =>
                task._id === id ? { ...task, isCompleted: newStatus } : task
            )
        );

        try {
            const response = await fetch(API_BASE_URL + '/update/' + id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: newStatus }),
            });

            if (!response.ok) {
                // Rollback UI if API call failed
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task._id === id ? { ...task, isCompleted: currentStatus } : task
                    )
                );
                throw new Error('Error toggling completion status.');
            }
        } catch (err) {
            setError(`Error: ${err.message}`);
            console.error(err);
        }
    };

    const pendingTasks = tasks.filter(task => !task.isCompleted);

    return (
        <div className="tasks-container">
            {/* Custom Delete Confirmation Modal */}
            {taskToDelete && (
                <TaskDeleteConfirmation
                    isOpen={isDeleteModalOpen}
                    taskName={taskToDelete.taskName}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsDeleteModalOpen(false)}
                />
            )}

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
                    {/* NEW: Time Input Fields */}
                    <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                    />
                    <select value={newAmPm} onChange={(e) => setNewAmPm(e.target.value)}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                    {/* End NEW */}
                    <button onClick={handleAddTask}>Add Deadline</button>
                </div>
            </div>

            <div className="task-list card">
                <h4>My To-Do List</h4>
                {loading && <p>Loading...</p>}
                {!loading && pendingTasks.length === 0 ? (
                    <p className="empty-state">No deadlines or tasks yet! Add one above.</p>
                ) : (
                    <ul>
                        {pendingTasks.map(task => (
                            <li key={task._id} className={task.isCompleted ? 'completed' : ''}>
                                <label className="task-item">
                                    <input
                                        type="checkbox"
                                        checked={task.isCompleted}
                                        onChange={() => handleCheckboxClick(task)}
                                    />
                                    <span className="task-text">
                                        <span className="task-course">[{task.courseName}] </span>
                                        {task.taskName} 
                                    </span>
                                    <span className="due-date">Due: {formatDateDisplay(task.dueDate)}</span> 
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Tasks;