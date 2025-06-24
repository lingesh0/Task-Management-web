import React from 'react';
import { Link } from 'react-router-dom';
import '../css/TaskCard.css';

const TaskCard = ({ task, onEdit, onDelete }) => {
    return (
        <div className="task-card">
            <div className="task-card-content">
                <h3>
                  <Link to={`/task/${task.id}`}>{task.title}</Link>
                </h3>
                <p>{task.description}</p>
            </div>
            <div className="task-card-actions">
                <button onClick={() => onEdit(task.id)}>Edit</button>
                <button onClick={() => onDelete(task.id)}>Delete</button>
            </div>
        </div>
    );
};

export default TaskCard;