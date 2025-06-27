import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdToken } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import '../css/TaskTracking.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Archived'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const PRIORITY_COLORS = { Low: '#4ade80', Medium: '#facc15', High: '#f87171' };
const API_BASE = 'http://localhost:8000';
const RECURRENCE_OPTIONS = ['None', 'Daily', 'Weekly', 'Monthly'];

const TaskTracking = () => {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Low');
  const [status, setStatus] = useState('Pending');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDue, setFilterDue] = useState('');
  const [reminder, setReminder] = useState('');
  const [tags, setTags] = useState('');
  const [subtasks, setSubtasks] = useState(['']);
  const [recurrence, setRecurrence] = useState('None');
  const [showCalendar, setShowCalendar] = useState(false);
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showEditModal, setShowEditModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  async function fetchTasks() {
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setError('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      const data = await res.json();
      let taskList = data;
      if (filterStatus) taskList = taskList.filter(t => t.status === filterStatus);
      if (filterPriority) taskList = taskList.filter(t => t.priority === filterPriority);
      if (filterDue === 'overdue') taskList = taskList.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed');
      if (filterDue === 'today') taskList = taskList.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());
      setTasks(taskList);
    } catch (err) {
      setError('Failed to fetch tasks');
    }
  }

  useEffect(() => {
    if (user) fetchTasks();
    // eslint-disable-next-line
  }, [user, filterStatus, filterPriority, filterDue]);

  const handleAddSubtask = () => setSubtasks([...subtasks, '']);
  const handleSubtaskChange = (i, val) => setSubtasks(subtasks.map((s, idx) => idx === i ? val : s));
  const handleRemoveSubtask = (i) => setSubtasks(subtasks.filter((_, idx) => idx !== i));

  const handleAddTask = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      const token = await getIdToken();
      await fetch(`${API_BASE}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          due_date: dueDate,
          priority,
          status,
          reminder,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          subtasks: subtasks.filter(s => s.trim()).map(s => ({ text: s, done: false })),
          recurrence: recurrence === 'None' ? null : recurrence,
        }),
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('Low');
      setStatus('Pending');
      setReminder('');
      setTags('');
      setSubtasks(['']);
      setRecurrence('None');
      fetchTasks();
    } catch (err) {
      setError('Failed to add task');
    }
  };

  const handleEdit = (task) => {
    setEditId(task.id);
    setEditFields({
      title: task.title,
      description: task.description || '',
      dueDate: task.due_date ? task.due_date.substring(0, 10) : '',
      priority: task.priority || 'Low',
      status: task.status || 'Pending',
      reminder: task.reminder || '',
      tags: (task.tags || []).join(', '),
      subtasks: task.subtasks && task.subtasks.length ? task.subtasks.map(st => st.text) : [''],
      recurrence: task.recurrence || 'None',
    });
    setShowEditModal(true);
  };

  const handleEditSubtaskChange = (i, val) => setEditFields(f => ({ ...f, subtasks: f.subtasks.map((s, idx) => idx === i ? val : s) }));
  const handleEditAddSubtask = () => setEditFields(f => ({ ...f, subtasks: [...(f.subtasks || []), ''] }));
  const handleEditRemoveSubtask = (i) => setEditFields(f => ({ ...f, subtasks: f.subtasks.filter((_, idx) => idx !== i) }));

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editFields.title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      const token = await getIdToken();
      await fetch(`${API_BASE}/tasks/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editFields.title,
          description: editFields.description,
          due_date: editFields.dueDate,
          priority: editFields.priority,
          status: editFields.status,
          reminder: editFields.reminder,
          tags: editFields.tags.split(',').map(t => t.trim()).filter(Boolean),
          subtasks: (editFields.subtasks || []).filter(s => s.trim()).map(s => ({ text: s, done: false })),
          recurrence: editFields.recurrence === 'None' ? null : editFields.recurrence,
        }),
      });
      setEditId(null);
      setEditFields({});
      setError('');
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const token = await getIdToken();
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handlePinTask = async (task, pin) => {
    try {
      const token = await getIdToken();
      await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pinned: pin }),
      });
      fetchTasks();
    } catch {}
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(tasks);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    // Update positions in backend
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].position !== i) {
        const token = await getIdToken();
        await fetch(`${API_BASE}/tasks/${reordered[i].id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ position: i }),
        });
      }
    }
    fetchTasks();
  };

  // Filter and sort tasks
  let filteredTasks = tasks.filter(t =>
    (t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
  );
  filteredTasks = [...filteredTasks].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditId(null);
    setEditFields({});
  };

  // Add this function to fetch AI suggestions and update priorities
  const handleAISuggestPriorities = async () => {
    setAiLoading(true);
    setAiError('');
    setAISuggestions({});
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/tasks/ai-prioritize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to get AI suggestions');
      const suggestions = await res.json();
      setAISuggestions(suggestions);
      setShowAISuggestions(true);
      // Update priorities in backend and UI
      await Promise.all(
        tasks.map(async (task) => {
          if (suggestions[task.id] && suggestions[task.id] !== task.priority) {
            const token = await getIdToken();
            await fetch(`${API_BASE}/tasks/${task.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: task.title,
                description: task.description,
                due_date: task.due_date,
                status: task.status,
                reminder: task.reminder,
                tags: task.tags,
                subtasks: task.subtasks,
                recurrence: task.recurrence,
                position: task.position,
                deleted: task.deleted,
                pinned: task.pinned,
                priority: suggestions[task.id],
              }),
            });
          }
        })
      );
      fetchTasks();
    } catch (err) {
      setAiError('AI suggestion failed.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!user) {
    return <div className="task-tracking-container"><h2>Please log in to view and manage your tasks.</h2></div>;
  }

  if (error) {
    return <div className="task-error">{error}</div>;
  }

  return (
    <div className={`task-tracking-container${darkMode ? ' dark' : ''}`}>
      <h1>Task Tracking</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowCalendar(false)} style={{ marginRight: 8, fontWeight: !showCalendar ? 'bold' : 'normal' }}>List View</button>
        <button onClick={() => setShowCalendar(true)} style={{ fontWeight: showCalendar ? 'bold' : 'normal' }}>Calendar View</button>
        <button onClick={handleAISuggestPriorities} disabled={aiLoading} style={{ marginLeft: 16, background: '#6366f1', color: 'white', fontWeight: 'bold', borderRadius: 6, padding: '6px 14px' }}>
          {aiLoading ? 'Suggesting...' : 'AI Suggest Priorities'}
        </button>
        {aiError && <span style={{ color: 'red', marginLeft: 12 }}>{aiError}</span>}
      </div>
      {showCalendar ? (
        <div style={{ minHeight: 300, background: '#f3f4f6', borderRadius: 8, padding: 32, textAlign: 'center' }}>
          <h2>Calendar View (Coming Soon)</h2>
          <p>Your tasks will appear on a calendar here.</p>
        </div>
      ) : (
        <>
      <form className="add-task-form" onSubmit={handleAddTask}>
        <input
          type="text"
          placeholder="Task Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="task-input"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="task-textarea"
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="task-input"
        />
        <input
          type="datetime-local"
          value={reminder}
          onChange={e => setReminder(e.target.value)}
          className="task-input"
          placeholder="Reminder"
        />
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="task-input"
          placeholder="Tags (comma separated)"
        />
        <div style={{ marginBottom: 8 }}>
          <label>Subtasks:</label>
          {subtasks.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <input
                type="text"
                value={s}
                onChange={e => handleSubtaskChange(i, e.target.value)}
                className="task-input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => handleRemoveSubtask(i)} style={{ marginLeft: 4 }}>-</button>
            </div>
          ))}
          <button type="button" onClick={handleAddSubtask}>Add Subtask</button>
        </div>
        <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="task-input">
          {RECURRENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} className="task-input">
          {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="task-input">
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <button className="add-task-btn" type="submit">Add Task</button>
        {error && <div className="task-error">{error}</div>}
      </form>
      <div className="task-tracking-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={filterDue} onChange={e => setFilterDue(e.target.value)}>
          <option value="">All Due Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
        </select>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="task-list">
          {provided => (
            <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
              {filteredTasks.length === 0 ? (
                <div className="task-list-placeholder">
                  <p>No tasks yet. Add a new task to get started.</p>
                </div>
              ) : (
                filteredTasks.map((task, idx) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={idx}>
                    {providedDraggable => (
                      <div
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        {...providedDraggable.dragHandleProps}
                        className={`task-card${task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Completed' ? ' overdue' : ''}`}
                      >
                        <div className="task-card-header">
                          <span className="task-title">{task.title}</span>
                          <span className="task-badges">
                            <span className="status-badge" style={{ background: task.status === 'Completed' ? '#4ade80' : task.status === 'In Progress' ? '#60a5fa' : task.status === 'Pending' ? '#facc15' : '#a3a3a3' }}>{task.status}</span>
                            <span className="priority-badge" style={{ background: PRIORITY_COLORS[task.priority] || '#e5e7eb' }}>{task.priority}</span>
                          </span>
                          <button onClick={() => handlePinTask(task, !task.pinned)} style={{ marginLeft: 8 }} title={task.pinned ? 'Unpin' : 'Pin'}>{task.pinned ? '📌' : '📍'}</button>
                        </div>
                        <div className="task-desc">{task.description}</div>
                        <div className="task-meta">
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
                          {task.due_date && (
                            <span style={{ marginLeft: 8, color: '#7c3aed', fontWeight: 500 }}>
                              {(() => {
                                const due = new Date(task.due_date);
                                const now = new Date();
                                const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                                if (task.status === 'Completed') return 'Completed';
                                if (diff > 0) return `Due in ${diff} day${diff > 1 ? 's' : ''}`;
                                if (diff === 0) return 'Due today';
                                return `Overdue by ${-diff} day${-diff > 1 ? 's' : ''}`;
                              })()}
                            </span>
                          )}
                          {task.reminder && <span style={{ marginLeft: 8, color: '#f59e42' }}>⏰ Reminder: {new Date(task.reminder).toLocaleString()}</span>}
                          {task.recurrence && <span style={{ marginLeft: 8, color: '#2563eb' }}>🔁 {task.recurrence}</span>}
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
                        <div className="task-actions">
                          <button className="edit-btn" onClick={() => handleEdit(task)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      </>
      )}
      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <form className="edit-task-form" onSubmit={handleUpdateTask}>
              <h2>Edit Task</h2>
              <input type="text" value={editFields.title} onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))} className="task-input" />
              <textarea value={editFields.description} onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))} className="task-textarea" />
              <input type="date" value={editFields.dueDate} onChange={e => setEditFields(f => ({ ...f, dueDate: e.target.value }))} className="task-input" />
              <input type="datetime-local" value={editFields.reminder} onChange={e => setEditFields(f => ({ ...f, reminder: e.target.value }))} className="task-input" placeholder="Reminder" />
              <input type="text" value={editFields.tags} onChange={e => setEditFields(f => ({ ...f, tags: e.target.value }))} className="task-input" placeholder="Tags (comma separated)" />
              <div style={{ marginBottom: 8 }}>
                <label>Subtasks:</label>
                {(editFields.subtasks || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <input type="text" value={s} onChange={e => handleEditSubtaskChange(i, e.target.value)} className="task-input" style={{ flex: 1 }} />
                    <button type="button" onClick={() => handleEditRemoveSubtask(i)} style={{ marginLeft: 4 }}>-</button>
                  </div>
                ))}
                <button type="button" onClick={handleEditAddSubtask}>Add Subtask</button>
              </div>
              <select value={editFields.recurrence} onChange={e => setEditFields(f => ({ ...f, recurrence: e.target.value }))} className="task-input">
                {RECURRENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select value={editFields.priority} onChange={e => setEditFields(f => ({ ...f, priority: e.target.value }))} className="task-input">
                {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select value={editFields.status} onChange={e => setEditFields(f => ({ ...f, status: e.target.value }))} className="task-input">
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="add-task-btn" type="submit">Save</button>
                <button className="add-task-btn cancel-btn" type="button" onClick={closeEditModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Suggestions Modal */}
      {showAISuggestions && (
        <div className="modal-overlay" onClick={() => setShowAISuggestions(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2>AI Suggested Priorities</h2>
            <ul style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
              {Object.entries(aiSuggestions).map(([id, priority]) => {
                const task = tasks.find(t => String(t.id) === String(id));
                return (
                  <li key={id} style={{ marginBottom: 8 }}>
                    <b>{task ? task.title : `Task #${id}`}</b>: <span style={{ color: PRIORITY_COLORS[priority] || '#333' }}>{priority}</span>
                  </li>
                );
              })}
            </ul>
            <button className="add-task-btn" onClick={() => setShowAISuggestions(false)} style={{ width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTracking; 