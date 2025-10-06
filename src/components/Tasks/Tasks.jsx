import React, { useState } from 'react';
import './Tasks.css';

// Function to get today's date in YYYY-MM-DD format for the input min attribute
const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const Tasks = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Write essay on Modern History', type: 'Assignment', course: 'History 101', completed: false, dueDate: '2025-10-30' },
    { id: 2, text: 'Midterm Exam Review', type: 'Exam', course: 'CS 301', completed: false, dueDate: '2025-11-07' },
    { id: 3, text: 'Read Chapter 5 for Biology class', type: 'Assignment', course: 'Biology 202', completed: true, dueDate: '2025-10-01' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newType, setNewType] = useState('Assignment');
  const [newCourse, setNewCourse] = useState('');
  
  const today = getTodayDate(); // Get today's date for the calendar minimum

  const handleAddTask = () => {
    if (newTask.trim() !== '' && newDueDate) { // Ensure due date is also checked
      const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
      
      setTasks([
        ...tasks, 
        { 
          id: newId, 
          text: newTask, 
          type: newType, 
          course: newCourse || 'General',
          completed: false, 
          dueDate: newDueDate // Date is now in YYYY-MM-DD format
        }
      ]);
      setNewTask('');
      setNewDueDate('');
      setNewCourse('');
      setNewType('Assignment');
      
      // In a real app, you'd send this data to the backend here.
    }
  };

  const handleToggleComplete = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <div className="tasks-container">
      <h2>Your Academic Tasks</h2>
      <div className="add-task-section card">
        <h4>Add New Deadline</h4>
        <div className="task-input-group">
            {/* Task Type */}
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="Assignment">Assignment</option>
                <option value="Exam">Exam</option>
            </select>
            {/* Course Name */}
            <input
              type="text"
              placeholder="Course Name (e.g., CS 301)"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
            />
            {/* Task Name */}
            <input
              type="text"
              placeholder="Task Name (e.g., Study for Midterm)"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            {/* Due Date - Now a Date Picker */}
            <input
              type="date"
              title="Select Deadline Date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={today} // This prevents selecting previous dates
            />
            <button onClick={handleAddTask}>Add Deadline</button>
        </div>
      </div>
      <div className="task-list card">
        <h4>My To-Do List</h4>
        <ul>
          {tasks.map(task => (
            <li key={task.id} className={task.completed ? 'completed' : ''}>
              <label className="task-item">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task.id)}
                />
                <span className="task-text">
                    <span className="task-course">[{task.course}] </span>
                    {task.text} 
                </span>
                {/* Displaying date directly from the YYYY-MM-DD format */}
                <span className="due-date">Due: {task.dueDate}</span> 
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Tasks;