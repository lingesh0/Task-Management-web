import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';
const COLORS = ['#3b82f6', '#22d3ee', '#f472b6', '#facc15', '#a21caf'];

const ProductivityCharts = () => {
  const [summary, setSummary] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('You must be logged in to view insights.');
          navigate('/login');
          return;
        }
        const token = await user.getIdToken();
        const [summaryRes, predRes] = await Promise.all([
          axios.get(`${API_BASE}/insights/weekly-summary`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/insights/predict-completion`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSummary(summaryRes.data);
        setPrediction(predRes.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load productivity insights.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) return <div>Loading productivity insights...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!summary) return null;

  // Prepare data for charts
  const chartData = Object.entries(summary.summary).map(([date, val]) => ({ date, ...val }));
  const pieData = Object.entries(summary.status_breakdown).map(([status, value]) => ({ name: status, value }));

  return (
    <div className="dashboard-chart">
      <h2 style={{ color: '#fff', marginBottom: 24, fontWeight: 700, fontSize: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span role="img" aria-label="insights"></span> Productivity Insights
      </h2>
      <div className="dashboard-charts" style={{ gap: 24, margin: 0, padding: 0 }}>
        <ResponsiveContainer width={400} height={220}>
          <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="created" fill="#3b82f6" name="Created" />
            <Bar dataKey="completed" fill="#22d3ee" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width={320} height={220}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {pieData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 24, color: '#fff', fontSize: 18 }}>
        <b>Predicted tasks completed tomorrow:</b> {prediction?.prediction !== null ? prediction.prediction.toFixed(2) : 'N/A'}
        {prediction?.message && <span style={{ color: '#f472b6', marginLeft: 16 }}>{prediction.message}</span>}
      </div>
    </div>
  );
};

export default ProductivityCharts; 