import React, { useState } from 'react';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Write essay on Modern History', completed: false, dueDate: 'Oct 30, 2025' },
    { id: 2, text: 'Prepare CS project proposal', completed: false, dueDate: 'Nov 7, 2025' },
    { id: 3, text: 'Read Chapter 5 for Biology class', completed: true, dueDate: 'Oct 22, 2025' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const handleAddTask = () => {
    if (newTask.trim() !== '') {
      const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
      setTasks([
        ...tasks, 
        { 
          id: newId, 
          text: newTask, 
          completed: false, 
          dueDate: newDueDate || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) 
        }
      ]);
      setNewTask('');
      setNewDueDate('');
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
        <h4>Add New Task</h4>
        <div className="task-input-group">
            <input
              type="text"
              placeholder="Task name (e.g., Study for Midterm)"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <input
              type="text"
              placeholder="Due Date (e.g., Nov 10)"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
            <button onClick={handleAddTask}>Add Task</button>
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
                <span className="task-text">{task.text}</span>
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