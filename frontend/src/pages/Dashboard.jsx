import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getIdToken } from '../firebase';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import SmartSuggestions from '../components/SmartSuggestions';
import NaturalLanguageInput from '../components/NaturalLanguageInput';
import '../css/Dashboard.css';

const API_BASE = 'http://localhost:8000';
const STATUS_COLORS = {
  'Pending': '#facc15',
  'In Progress': '#60a5fa',
  'Completed': '#4ade80',
  'Archived': '#a3a3a3',
};
const PRIORITY_COLORS = {
  'Low': '#4ade80',
  'Medium': '#facc15',
  'High': '#f87171',
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showNaturalLanguageInput, setShowNaturalLanguageInput] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        setError(t('general.error', { message: res.statusText }));
      }
    } catch (err) {
      setError(t('general.error', { message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  // Task statistics
  const totalTasks = tasks.length;
  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status || 'Pending'] = (acc[t.status || 'Pending'] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status],
  }));

  const priorityCounts = tasks.reduce((acc, t) => {
    acc[t.priority || 'Low'] = (acc[t.priority || 'Low'] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.keys(priorityCounts).map(priority => ({
    name: priority,
    value: priorityCounts[priority],
  }));

  if (loading) {
    return <div className="dashboard-loading">{t('general.loading')}</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t('tasks.title')}</h1>
        <div className="ai-features">
          <button 
            className="ai-btn smart-suggestions-btn"
            onClick={() => setShowSmartSuggestions(true)}
          >
            AI Smart Suggestions
          </button>
          <button 
            className="ai-btn natural-language-btn"
            onClick={() => setShowNaturalLanguageInput(true)}
          >
            Natural Language Input
          </button>
        </div>
      </div>
      <div className="dashboard-summary">
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-title">Total Tasks</div>
          <div className="dashboard-summary-value">{totalTasks}</div>
        </div>
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-title">Pending</div>
          <div className="dashboard-summary-value">{statusCounts['Pending'] || 0}</div>
        </div>
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-title">In Progress</div>
          <div className="dashboard-summary-value">{statusCounts['In Progress'] || 0}</div>
        </div>
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-title">Completed</div>
          <div className="dashboard-summary-value">{statusCounts['Completed'] || 0}</div>
        </div>
      </div>
      <div className="dashboard-charts">
        <div className="dashboard-chart">
          <h3>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {statusData.map((entry, idx) => (
                  <Cell key={`cell-status-${idx}`} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="dashboard-chart">
          <h3>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Tasks" >
                {priorityData.map((entry, idx) => (
                  <Cell key={`cell-priority-${idx}`} fill={PRIORITY_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* AI Features Modals */}
      {showSmartSuggestions && (
        <SmartSuggestions 
          onSuggestionClick={() => setShowSmartSuggestions(false)}
          onClose={() => setShowSmartSuggestions(false)}
        />
      )}
      {showNaturalLanguageInput && (
        <NaturalLanguageInput 
          onTaskCreate={() => setShowNaturalLanguageInput(false)}
          onClose={() => setShowNaturalLanguageInput(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;