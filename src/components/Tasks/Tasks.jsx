// src/components/Tasks/Tasks.jsx
import React, { useState, useEffect } from 'react';
import './Tasks.css';

// Base URL for the backend API (Tasks router is mounted at /tasks)
const API_BASE_URL = 'http://localhost:5000/tasks';

// Helper function to get today's date in YYYY-MM-DD format for the date picker minimum
const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const Tasks = () => {
    // State to hold task data fetched from the backend
    const [tasks, setTasks] = useState([]);
    // State for form inputs
    const [newTaskName, setNewTaskName] = useState('');
    const [newDueDate, setNewDueDate] = useState(getTodayDate());
    const [newType, setNewType] = useState('Assignment');
    const [newCourseName, setNewCourseName] = useState('');
    // State for UI feedback
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const today = getTodayDate();

    // --- API Fetching ---

    const fetchTasks = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(API_BASE_URL + '/');
            if (!response.ok) {
                throw new Error('Failed to fetch tasks from server.');
            }
            const data = await response.json();
            // Store tasks, setting the completed status correctly
            setTasks(data.map(task => ({
                ...task,
                isCompleted: task.isCompleted || false
            })));
        } catch (err) {
            setError(`Error loading tasks: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load tasks on component mount
    useEffect(() => {
        fetchTasks();
    }, []);

    // --- Add Task Handler ---

    const handleAddTask = async () => {
        if (newTaskName.trim() === '' || !newDueDate || newCourseName.trim() === '') {
            setError('Please fill in the task name, course, and due date.');
            return;
        }
        setError('');
        
        const taskData = {
            taskName: newTaskName.trim(),
            courseName: newCourseName.trim(),
            taskType: newType,
            dueDate: newDueDate,
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

            // Clear form inputs and refresh the list
            setNewTaskName('');
            setNewCourseName('');
            setNewDueDate(getTodayDate());
            setNewType('Assignment');
            fetchTasks();

        } catch (err) {
            setError(`Error adding task: ${err.message}`);
            console.error(err);
        }
    };

    // --- Toggle Completion Handler (Optimistic UI Update) ---

    const handleToggleComplete = async (id, currentStatus) => {
        // 1. Optimistic Update (Instant visual feedback)
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task._id === id ? { ...task, isCompleted: !currentStatus } : task
            )
        );

        // 2. Send update to the backend
        try {
            const response = await fetch(API_BASE_URL + '/update/' + id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: !currentStatus }),
            });

            if (!response.ok) {
                throw new Error('Error toggling completion status.');
            }
        } catch (err) {
            // 3. Rollback if the API call failed
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task._id === id ? { ...task, isCompleted: currentStatus } : task
                )
            );
            setError(`Error toggling completion status: ${err.message}`);
            console.error(err);
        }
    };

    const taskTypes = ['Assignment', 'Exam', 'Project', 'Reading', 'Review'];

    // Conditional rendering of the main content
    if (loading) {
        return <div className="tasks-container loading-state">Loading tasks from database...</div>;
    }

    return (
        <div className="tasks-container">
            <h2>Your Academic Tasks</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="add-task-section card">
                <h4>Add New Deadline</h4>
                <div className="task-input-group">
                    <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                        {/* Corrected dropdown options: */}
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
                    <button onClick={handleAddTask}>Add Deadline</button>
                </div>
            </div>

            <div className="task-list card">
                <h4>My To-Do List</h4>
                <ul>
                    {tasks.length > 0 ? tasks.map(task => (
                        <li key={task._id} className={task.isCompleted ? 'completed' : ''}>
                            <label className="task-item">
                                <input
                                    type="checkbox"
                                    checked={task.isCompleted}
                                    onChange={() => handleToggleComplete(task._id, task.isCompleted)}
                                />
                                <span className="task-text">
                                    <span className="task-course">[{task.courseName}] </span>
                                    {task.taskName}
                                </span>
                                <span className="due-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                            </label>
                        </li>
                    )) : (
                        <li className="empty-state">No deadlines or tasks yet! Add one above.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Tasks;