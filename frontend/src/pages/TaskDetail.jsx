import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../css/TaskDetail.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Archived'];
const PRIORITY_OPTIONS = [
  { value: 'Low', color: '#4ade80' },
  { value: 'Medium', color: '#facc15' },
  { value: 'High', color: '#f87171' }
];

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskDoc = doc(db, 'tasks', id);
        const taskSnapshot = await getDoc(taskDoc);
        if (taskSnapshot.exists()) {
          setTask({ id: taskSnapshot.id, ...taskSnapshot.data() });
          setEditFields({ ...taskSnapshot.data() });
          setActivityLog(taskSnapshot.data().activityLog || []);
        } else {
          setError('Task not found');
        }
      } catch (err) {
        setError('Error fetching task');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleFieldChange = (field, value) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setEditFields(prev => ({ ...prev, status: newStatus }));
    await updateDoc(doc(db, 'tasks', id), {
      status: newStatus,
      lastModifiedAt: serverTimestamp(),
      activityLog: [
        ...(task.activityLog || []),
        { type: 'status', value: newStatus, at: new Date().toISOString(), by: user?.email || 'Unknown' }
      ]
    });
    setTask(prev => ({ ...prev, status: newStatus }));
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    setEditFields(prev => ({ ...prev, priority: newPriority }));
    await updateDoc(doc(db, 'tasks', id), {
      priority: newPriority,
      lastModifiedAt: serverTimestamp(),
      activityLog: [
        ...(task.activityLog || []),
        { type: 'priority', value: newPriority, at: new Date().toISOString(), by: user?.email || 'Unknown' }
      ]
    });
    setTask(prev => ({ ...prev, priority: newPriority }));
  };

  const handleDueDateChange = async (e) => {
    const newDueDate = e.target.value;
    setEditFields(prev => ({ ...prev, dueDate: newDueDate }));
    await updateDoc(doc(db, 'tasks', id), {
      dueDate: newDueDate,
      lastModifiedAt: serverTimestamp(),
      activityLog: [
        ...(task.activityLog || []),
        { type: 'dueDate', value: newDueDate, at: new Date().toISOString(), by: user?.email || 'Unknown' }
      ]
    });
    setTask(prev => ({ ...prev, dueDate: newDueDate }));
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        ...editFields,
        lastModifiedAt: serverTimestamp(),
        activityLog: [
          ...(task.activityLog || []),
          { type: 'edit', value: 'Task edited', at: new Date().toISOString(), by: user?.email || 'Unknown' }
        ]
      });
      setTask(prev => ({ ...prev, ...editFields }));
      setEditMode(false);
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleSubtaskToggle = async (idx) => {
    const updatedSubtasks = editFields.subtasks.map((st, i) => i === idx ? { ...st, done: !st.done } : st);
    setEditFields(prev => ({ ...prev, subtasks: updatedSubtasks }));
    await updateDoc(doc(db, 'tasks', id), {
      subtasks: updatedSubtasks,
      lastModifiedAt: serverTimestamp(),
      activityLog: [
        ...(task.activityLog || []),
        { type: 'subtask', value: 'Toggled subtask', at: new Date().toISOString(), by: user?.email || 'Unknown' }
      ]
    });
    setTask(prev => ({ ...prev, subtasks: updatedSubtasks }));
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    const newSubtasks = [...(editFields.subtasks || []), { text: subtaskInput, done: false }];
    setEditFields(prev => ({ ...prev, subtasks: newSubtasks }));
    await updateDoc(doc(db, 'tasks', id), {
      subtasks: newSubtasks,
      lastModifiedAt: serverTimestamp(),
      activityLog: [
        ...(task.activityLog || []),
        { type: 'subtask', value: 'Added subtask', at: new Date().toISOString(), by: user?.email || 'Unknown' }
      ]
    });
    setTask(prev => ({ ...prev, subtasks: newSubtasks }));
    setSubtaskInput('');
  };

  const handleDeleteSubtask = async (idx) => {
    const newSubtasks = editFields.subtasks.filter((_, i) => i !== idx);
    setEditFields(prev => ({ ...prev, subtasks: newSubtasks }));
    await updateDoc(doc(db, 'tasks', id), {
      subtasks: newSubtasks,
      lastModifiedAt: serverTimestamp(),
      activityLog: [
        ...(task.activityLog || []),
        { type: 'subtask', value: 'Deleted subtask', at: new Date().toISOString(), by: user?.email || 'Unknown' }
      ]
    });
    setTask(prev => ({ ...prev, subtasks: newSubtasks }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!task) return <div>No task details available.</div>;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  const dueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();
  const priorityColor = PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color || '#e5e7eb';

  return (
    <div className="task-detail-container">
      <h1>Task Detail</h1>
      <div className="task-detail-header">
        {editMode ? (
          <input
            className="task-title-input"
            value={editFields.title || ''}
            onChange={e => handleFieldChange('title', e.target.value)}
          />
        ) : (
          <h2>{task.title}</h2>
        )}
        <span className="priority-badge" style={{ background: priorityColor }}>{task.priority || 'No Priority'}</span>
      </div>
      <div className="task-detail-meta">
        <span className={`status-badge status-${task.status?.toLowerCase()}`}>{task.status}</span>
        {isOverdue && <span className="overdue-badge">Overdue</span>}
        {dueToday && <span className="due-today-badge">Due Today</span>}
      </div>
      <div className="task-detail-section">
        <label>Description:</label>
        {editMode ? (
          <textarea
            className="task-desc-input"
            value={editFields.description || ''}
            onChange={e => handleFieldChange('description', e.target.value)}
          />
        ) : (
          <p>{task.description}</p>
        )}
      </div>
      <div className="task-detail-section">
        <label>Due Date:</label>
        {editMode ? (
          <input
            type="date"
            value={editFields.dueDate ? editFields.dueDate.substring(0, 10) : ''}
            onChange={handleDueDateChange}
          />
        ) : (
          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
        )}
      </div>
      <div className="task-detail-section">
        <label>Status:</label>
        {editMode ? (
          <select value={editFields.status || 'Pending'} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <span>{task.status}</span>
        )}
      </div>
      <div className="task-detail-section">
        <label>Priority:</label>
        {editMode ? (
          <select value={editFields.priority || 'Low'} onChange={handlePriorityChange}>
            {PRIORITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.value}</option>)}
          </select>
        ) : (
          <span>{task.priority}</span>
        )}
      </div>
      <div className="task-detail-section">
        <label>Subtasks:</label>
        <ul className="subtask-list">
          {(task.subtasks || []).map((st, idx) => (
            <li key={idx} className={st.done ? 'subtask-done' : ''}>
              <input
                type="checkbox"
                checked={st.done}
                onChange={() => handleSubtaskToggle(idx)}
                disabled={!editMode}
              />
              {editMode ? (
                <span>{st.text}</span>
              ) : (
                <span>{st.text}</span>
              )}
              {editMode && (
                <button className="subtask-delete-btn" onClick={() => handleDeleteSubtask(idx)} type="button">✕</button>
              )}
            </li>
          ))}
        </ul>
        {editMode && (
          <form onSubmit={handleAddSubtask} className="add-subtask-form">
            <input
              type="text"
              value={subtaskInput}
              onChange={e => setSubtaskInput(e.target.value)}
              placeholder="Add subtask"
            />
            <button type="submit">Add</button>
          </form>
        )}
      </div>
      <div className="task-detail-section">
        <label>Created By:</label>
        <span>{task.ownerEmail || 'Unknown'}</span>
      </div>
      <div className="task-detail-section">
        <label>Created At:</label>
        <span>{task.createdAt ? new Date(task.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
      </div>
      <div className="task-detail-section">
        <label>Last Modified:</label>
        <span>{task.lastModifiedAt ? new Date(task.lastModifiedAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
      </div>
      <div className="task-detail-actions">
        {editMode ? (
          <>
            <button className="save-btn" onClick={handleSave}>Save</button>
            <button className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <>
            <button className="edit-btn" onClick={handleEdit}>Edit Task</button>
            <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>Delete Task</button>
          </>
        )}
      </div>
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="delete-confirm-content">
            <p>Are you sure you want to delete this task?</p>
            <button className="delete-btn" onClick={handleDelete}>Yes, Delete</button>
            <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="task-detail-section activity-log-section">
        <label>Activity Log:</label>
        <ul className="activity-log-list">
          {activityLog.length === 0 ? <li>No activity yet.</li> : activityLog.slice().reverse().map((log, idx) => (
            <li key={idx}>
              <span className="activity-type">[{log.type}]</span> {log.value} <span className="activity-meta">by {log.by} at {new Date(log.at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskDetail;