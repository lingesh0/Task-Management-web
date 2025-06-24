import React from 'react';
import '../css/TaskTracking.css';

const TaskTracking = () => {
  return (
    <div className="task-tracking-container">
      <h1>Task Tracking</h1>
      <button className="add-task-btn">Add New Task</button>
      <div className="task-list-placeholder">
        {/* Task list will go here */}
        <p>No tasks yet. Click "Add New Task" to create one.</p>
      </div>
    </div>
  );
};

export default TaskTracking; 