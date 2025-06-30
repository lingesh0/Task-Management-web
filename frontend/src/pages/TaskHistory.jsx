import React, { useEffect, useState } from 'react';
import { getIdToken } from '../firebase';
import { useNavigate } from 'react-router-dom';
import '../css/TaskTracking.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Archived'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const API_BASE = 'http://localhost:8000';

const TaskHistory = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = await getIdToken();
        const res = await fetch(`${API_BASE}/tasks/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          setError('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        setError('Failed to fetch task history');
      }
    }
    fetchHistory();
  }, [navigate]);

  const handleRestore = async (taskId) => {
    try {
      const token = await getIdToken();
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deleted: false }),
      });
      setTasks(tasks => tasks.filter(t => t.id !== taskId));
    } catch {}
  };

  let filteredTasks = tasks.filter(t =>
    (t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || t.status === filterStatus) &&
    (!filterPriority || t.priority === filterPriority) &&
    (!filterTag || (t.tags && t.tags.includes(filterTag)))
  );

  return (
    <div className="task-tracking-container">
      <div className="dashboard-header">
        <h1>Task History</h1>
      </div>
      <input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="task-input"
        style={{ marginBottom: 16, width: '100%' }}
      />
      <div className="task-tracking-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)}>
          <option value="">All Tags</option>
          {[...new Set(tasks.flatMap(t => t.tags || []))].map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </div>
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="task-list-placeholder">
            <p>No completed or deleted tasks found.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={`task-card${task.deleted ? ' overdue' : ''}`}>
              <div className="task-card-header">
                <span className="task-title">{task.title}</span>
                <span className="task-badges">
                  <span className="status-badge">{task.status}</span>
                  <span className="priority-badge">{task.priority}</span>
                </span>
              </div>
              <div className="task-desc">{task.description}</div>
              <div className="task-meta">
                <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
                {task.deleted && <span className="overdue-badge">Deleted</span>}
                {task.status === 'Completed' && <span className="overdue-badge" style={{ background: '#4ade80' }}>Completed</span>}
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="task-tags" style={{ margin: '4px 0' }}>
                  {task.tags.map((tag, i) => <span key={i} className="task-tag">#{tag}</span>)}
                </div>
              )}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="task-subtasks" style={{ margin: '4px 0' }}>
                  <b>Subtasks:</b>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {task.subtasks.map((st, i) => <li key={i}>{st.text}</li>)}
                  </ul>
                </div>
              )}
              {task.deleted && (
                <button className="edit-btn" onClick={() => handleRestore(task.id)} style={{ marginTop: 8 }}>Restore</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskHistory; 