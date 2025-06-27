import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import '../css/Dashboard.css';
import { getIdToken } from '../firebase';
import { useNavigate } from 'react-router-dom';

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

const API_BASE = 'http://localhost:8000';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const tasksCollectionRef = collection(db, 'tasks');

  useEffect(() => {
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
        setTasks(data);
      } catch (err) {
        setError('Failed to fetch tasks');
      }
    }
    fetchTasks();
  }, [navigate]);

  // Prepare data for charts
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

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Task Dashboard</h1>
      <div className="dashboard-summary">
        <div className="dashboard-summary-card">
          <div className="dashboard-summary-title">Total Tasks</div>
          <div className="dashboard-summary-value">{tasks.length}</div>
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
    </div>
  );
};

export default Dashboard;