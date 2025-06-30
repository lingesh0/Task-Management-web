import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../css/TaskCard.css';

const TaskCard = ({ task, viewMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/task/${task.id}`);
  };

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div 
      className={`task-card ${viewMode}-view ${getPriorityClass(task.priority)}`}
      onClick={handleClick}
    >
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      <div className="task-content">
        {viewMode === 'grid' && (
          <p className="task-description">{task.description}</p>
        )}
        
        <div className="task-metadata">
          <div className="task-due-date">
            <span className="metadata-label">{t('tasks.dueDate')}:</span>
            <span className="metadata-value">{formatDate(task.dueDate)}</span>
          </div>
          
          {task.tags && task.tags.length > 0 && (
            <div className="task-tags">
              {task.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="task-status">
          <span className={`status-indicator status-${task.status.toLowerCase()}`}>
            {task.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;