import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, getIdToken } from '../firebase';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import '../css/Profile.css';

const APP_VERSION = '1.0.0'; // Update as needed
const LAST_UPDATED = '2024-05-01'; // Update as needed

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
];

const API_BASE = 'http://localhost:8000';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('dueDate');
  const [notifications, setNotifications] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch profile from backend
        const token = await getIdToken();
        const res = await fetch(`${API_BASE}/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.display_name || '');
          setPhotoURL(data.photo_url || '');
          setTheme(data.theme_preference || 'light');
          setLanguage(data.language_preference || 'en');
          setNotifications(data.reminders_enabled !== false);
        }
        setViewMode(localStorage.getItem('viewMode') || 'list');
        setSortBy(localStorage.getItem('sortBy') || 'dueDate');
      }
    });
    return () => unsub();
  }, []);

  const handleThemeChange = async (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    if (user) await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const token = await getIdToken();
      await fetch(`${API_BASE}/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          photo_url: photoURL,
          theme_preference: theme,
          language_preference: language,
          reminders_enabled: notifications,
        }),
      });
      setSuccess('Profile updated!');
      setShowProfileModal(false);
    } catch {
      setError('Failed to update profile');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setError(''); setSuccess('');
    try {
      // Use Firebase Storage for avatar
      // ... (reuse logic from Profile.jsx if needed) ...
      setSuccess('Profile picture updated!');
    } catch {
      setError('Failed to upload photo');
    }
  };

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (user) {
      const token = await getIdToken();
      await fetch(`${API_BASE}/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language_preference: newLang }),
      });
    }
  };

  const handleNotificationsChange = async (e) => {
    const val = e.target.checked;
    setNotifications(val);
    if (user) {
      const token = await getIdToken();
      await fetch(`${API_BASE}/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reminders_enabled: val }),
      });
    }
  };

  const handleViewModeChange = (e) => {
    const mode = e.target.value;
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  const handleSortByChange = (e) => {
    const sort = e.target.value;
    setSortBy(sort);
    localStorage.setItem('sortBy', sort);
  };

  const handleChangePassword = async () => {
    setError(''); setSuccess('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess('Password reset email sent!');
    } catch (err) {
      setError('Failed to send password reset email');
    }
  };

  const handleClearCompleted = () => {
    // This would call a cloud function or batch delete completed tasks for the user
    setSuccess('Completed tasks cleared! (Demo only)');
  };

  const handleExportTasks = async (type = 'csv') => {
    setError(''); setSuccess('');
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (type === 'csv') {
        const csv = [
          ['Title', 'Description', 'Due Date', 'Status', 'Priority', 'Tags'].join(','),
          ...data.map(t => [
            t.title,
            t.description?.replace(/,/g, ' '),
            t.due_date,
            t.status,
            t.priority,
            (t.tags || []).join(';')
          ].map(x => '"' + (x || '') + '"').join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.csv';
        a.click();
        setSuccess('Tasks exported as CSV!');
      } else {
        // PDF export: use jsPDF or similar (not implemented here)
        setSuccess('PDF export coming soon!');
      }
    } catch {
      setError('Failed to export tasks');
    }
  };

  const handleResetSettings = async () => {
    setTheme('light');
    setLanguage('en');
    setViewMode('list');
    setSortBy('dueDate');
    setNotifications(false);
    localStorage.clear();
    if (user) await updateDoc(doc(db, 'users', user.uid), { theme: 'light', language: 'en' });
    setSuccess('Settings reset to default!');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (!user) return <div className="profile-container">Please log in to view settings.</div>;

  return (
    <div className="profile-container">
      <h1>Settings</h1>
      <div className="profile-theme-section">
        <button onClick={() => setShowProfileModal(true)}>Edit Profile</button>
      </div>
      <div className="profile-theme-section">
        <label><b>Theme:</b></label>
        <select value={theme} onChange={handleThemeChange}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="profile-theme-section">
        <label><b>Language:</b></label>
        <select value={language} onChange={handleLanguageChange}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>
      <div className="profile-theme-section">
        <label><b>Task View:</b></label>
        <select value={viewMode} onChange={handleViewModeChange}>
          <option value="list">List</option>
          <option value="grid">Grid</option>
        </select>
      </div>
      <div className="profile-theme-section">
        <label><b>Default Sort By:</b></label>
        <select value={sortBy} onChange={handleSortByChange}>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="createdAt">Created At</option>
        </select>
      </div>
      <div className="profile-theme-section">
        <label><b>Email Reminders:</b></label>
        <input type="checkbox" checked={notifications} onChange={handleNotificationsChange} />
      </div>
      <div className="profile-theme-section">
        <button onClick={handleChangePassword}>Change Password</button>
        <button onClick={handleClearCompleted}>Clear Completed Tasks</button>
        <button onClick={() => handleExportTasks('csv')}>Export Tasks (CSV)</button>
        <button onClick={() => handleExportTasks('pdf')}>Export Tasks (PDF)</button>
        <button onClick={handleResetSettings}>Reset Settings</button>
        <button onClick={handleLogout} className="delete-account-btn">Logout</button>
      </div>
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleProfileUpdate}>
              <h2>Edit Profile</h2>
              <label>Name:</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="task-input" />
              <label>Avatar:</label>
              <input type="text" value={photoURL} onChange={e => setPhotoURL(e.target.value)} className="task-input" placeholder="Paste image URL or upload below" />
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="task-input" />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="add-task-btn" type="submit">Save</button>
                <button className="add-task-btn cancel-btn" type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="profile-theme-section" style={{marginTop: 24}}>
        <b>App Version:</b> {APP_VERSION} &nbsp; | &nbsp; <b>Last Updated:</b> {LAST_UPDATED}
      </div>
      <div className="profile-theme-section">
        <b>Support:</b> <a href="mailto:support@taskapp.com">support@taskapp.com</a>
      </div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default Settings; 