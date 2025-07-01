import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getIdToken } from '../firebase';
import SmartSuggestions from '../components/SmartSuggestions';
import NaturalLanguageInput from '../components/NaturalLanguageInput';
import AIFeatureSlider from '../components/AIFeatureSlider';
import AnimatedSection from '../components/AnimatedSection';
import TaskCard from '../components/TaskCard';
import Typewriter from 'typewriter-effect';
import { motion } from 'framer-motion';
import '../css/Home.css';
import FAB from '../components/FAB';
import TaskSkeleton from '../components/TaskSkeleton';
import TaskCompleteAnimation from '../components/TaskCompleteAnimation';
import Alert from '../components/Alert';
import TypingDots from '../components/TypingDots';
import AIAssistantPanel from '../components/AIAssistantPanel';
import EmptyStateAnimation from '../components/EmptyStateAnimation';
import { TagList } from '../components/Tag';
import { CalendarDropdown } from '../components/CalendarDropdown';
import Modal from '../components/Modal';

const API_BASE = 'http://localhost:8000';

const Home = () => {
    const { user, userProfile, isAuthenticated, logout } = useAuth();
    const { theme, isDark } = useTheme();
    const navigate = useNavigate();
    
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
    const [showNaturalLanguageInput, setShowNaturalLanguageInput] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');
    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [todaysTasks, setTodaysTasks] = useState([]);
    const [highPriorityTasks, setHighPriorityTasks] = useState([]);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch tasks for authenticated users
    useEffect(() => {
        if (isAuthenticated) {
            fetchTasks();
            setTimeout(() => setShowTaskPopup(true), 1000); // Show popup after login
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchTasks = async () => {
        try {
            const token = await getIdToken();
            const res = await fetch(`${API_BASE}/tasks/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
                // Filter today's tasks
                const todayStr = new Date().toISOString().slice(0, 10);
                setTodaysTasks(data.filter(t => t.due_date === todayStr && t.status !== 'Completed'));
                // Filter high priority tasks
                setHighPriorityTasks(data.filter(t => t.priority === 'High' && t.status !== 'Completed'));
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCreated = (newTask) => {
        setTasks(prevTasks => [...prevTasks, newTask]);
        setShowNaturalLanguageInput(false);
        navigate('/task-tracking');
    };

    const handleSuggestionClick = (suggestion) => {
        console.log('Suggestion clicked:', suggestion);
        setShowSmartSuggestions(false);
    };

    // Calculate task statistics
    const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'Pending').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        overdue: tasks.filter(t => {
            if (t.status === 'Completed' || !t.due_date) return false;
            return new Date(t.due_date) < new Date();
        }).length,
        pinned: tasks.filter(t => t.pinned).length,
        withReminders: tasks.filter(t => t.reminder).length,
        recurring: tasks.filter(t => t.recurrence).length
    };

    // Get upcoming tasks (next 7 days)
    const upcomingTasks = tasks.filter(task => {
        if (task.status === 'Completed' || !task.due_date) return false;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return dueDate >= today && dueDate <= nextWeek;
    }).slice(0, 5);

    // Get recent activity
    const recentActivity = tasks
        .filter(task => task.updated_at)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 3);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (!isAuthenticated) {
    return (
        <div className="home">
            <AnimatedSection>
                <div className="home-header">
                    <h1>🚀 TaskFlow Pro</h1>
                    <div className="typewriter-hero">
                      <Typewriter
                        options={{
                          strings: [
                            "AI-powered Task Management.",
                            "Just type. Let AI organize.",
                            "Never miss a deadline again."
                          ],
                          autoStart: true,
                          loop: true,
                        }}
                      />
                    </div>
                    <p className="home-subtitle">Your intelligent task management companion</p>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                <div className="home-features">
                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3>AI-Powered</h3>
                        <p>Smart suggestions and natural language input</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Analytics</h3>
                        <p>Track your productivity with detailed insights</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔄</div>
                        <h3>Smart Sync</h3>
                        <p>Seamless integration across all your devices</p>
                    </div>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                {/* AI Feature Slider */}
                <AIFeatureSlider />
            </AnimatedSection>
            <AnimatedSection>
                <div className="home-auth-buttons">
                    <Link to="/login" className="home-btn">Login</Link>
                    <Link to="/register" className="home-btn home-btn-secondary">Register</Link>
                </div>
            </AnimatedSection>
        </div>
    );
    }

    return (
        <div className="home-dashboard">
            <AnimatedSection>
                {/* Welcome/Header Section */}
                <div className="home-welcome">
                    <div className="welcome-content">
                        <h1>{getGreeting()}, {userProfile?.display_name || user?.displayName || 'User'} 👋</h1>
                        <p className="welcome-subtitle">
                            {currentTime.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })} • {formatTime(currentTime)}
                        </p>
                    </div>
                    <div className="welcome-actions">
                        <button 
                            className="quick-action-btn primary"
                            onClick={() => setShowNaturalLanguageInput(true)}
                        >
                            🧭 AI Task Input
                        </button>
                        <Link to="/task-tracking" className="quick-action-btn">
                            📝 View Tasks
                        </Link>
                    </div>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                {/* AI Feature Slider */}
                <AIFeatureSlider />
            </AnimatedSection>
            <AnimatedSection>
                {/* Quick Actions */}
                <div className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="quick-actions-grid">
                        <button 
                            className="action-card"
                            onClick={() => setShowNaturalLanguageInput(true)}
                        >
                            <div className="action-icon">🧭</div>
                            <span>AI Task Input</span>
                        </button>
                        <button 
                            className="action-card"
                            onClick={() => setShowSmartSuggestions(true)}
                        >
                            <div className="action-icon">🔮</div>
                            <span>Smart Suggestions</span>
                        </button>
                        <Link to="/task-tracking" className="action-card">
                            <div className="action-icon">➕</div>
                            <span>Create Task</span>
                        </Link>
                        <Link to="/dashboard" className="action-card">
                            <div className="action-icon">📊</div>
                            <span>Analytics</span>
                        </Link>
                    </div>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                {/* Task Overview Cards */}
                <div className="task-overview">
                    <h2>Task Overview</h2>
                    <div className="overview-grid">
                        <div className="overview-card">
                            <div className="overview-icon pinned">📌</div>
                            <div className="overview-content">
                                <h3>Pinned Tasks</h3>
                                <p className="overview-count">{taskStats.pinned}</p>
                            </div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-icon upcoming">🕐</div>
                            <div className="overview-content">
                                <h3>Upcoming (7 days)</h3>
                                <p className="overview-count">{upcomingTasks.length}</p>
                            </div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-icon completed">✅</div>
                            <div className="overview-content">
                                <h3>Completed</h3>
                                <p className="overview-count">{taskStats.completed}</p>
                            </div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-icon recurring">🔁</div>
                            <div className="overview-content">
                                <h3>Recurring</h3>
                                <p className="overview-count">{taskStats.recurring}</p>
                            </div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-icon reminders">⏰</div>
                            <div className="overview-content">
                                <h3>With Reminders</h3>
                                <p className="overview-count">{taskStats.withReminders}</p>
                            </div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-icon overdue">🚩</div>
                            <div className="overview-content">
                                <h3>Overdue</h3>
                                <p className="overview-count">{taskStats.overdue}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                {/* Main Content Grid */}
                <div className="home-main-grid">
                    {/* AI Suggestions */}
                    <div className="home-section">
                        <h2>🤖 AI Insights</h2>
                        <div className="ai-insights">
                            <div className="insight-card">
                                <h4>Today's Focus</h4>
                                <p>You have {taskStats.pending} pending tasks. Consider prioritizing the most urgent ones.</p>
                            </div>
                            <div className="insight-card">
                                <h4>Productivity Tip</h4>
                                <p>Try using natural language input to quickly create tasks with AI assistance.</p>
                            </div>
                        </div>
                    </div>
                    {/* Recent Activity */}
                    <div className="home-section">
                        <h2>📜 Recent Activity</h2>
                        <div className="activity-feed">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((task, index) => (
                                    <div key={index} className="activity-item">
                                        <div className="activity-icon">
                                            {task.status === 'Completed' ? '✅' : '📝'}
                                        </div>
                                        <div className="activity-content">
                                            <p className="activity-text">
                                                {task.status === 'Completed' ? 'Completed' : 'Updated'}: {task.title}
                                            </p>
                                            <p className="activity-time">{formatDate(task.updated_at)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-activity">No recent activity</p>
                            )}
                        </div>
                    </div>
                    {/* Upcoming Tasks */}
                    <div className="home-section">
                        <h2>📅 Upcoming Tasks</h2>
                        <div className="upcoming-tasks">
                            {upcomingTasks.length > 0 ? (
                                upcomingTasks.map((task, index) => (
                                    <div key={index} className="upcoming-task-item">
                                        <div className="task-priority" style={{
                                            backgroundColor: task.priority === 'High' ? '#f87171' : 
                                                           task.priority === 'Medium' ? '#facc15' : '#4ade80'
                                        }}></div>
                                        <div className="task-content">
                                            <p className="task-title">{task.title}</p>
                                            <p className="task-date">{formatDate(task.due_date)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-tasks">No upcoming tasks</p>
                            )}
                        </div>
                    </div>
                    {/* User Profile Summary */}
                    <div className="home-section">
                        <h2>👤 Profile Summary</h2>
                        <div className="profile-summary">
                            <div className="profile-info">
                                <h4>{userProfile?.display_name || user?.displayName || 'User'}</h4>
                                <p>{user?.email}</p>
                                <p className="total-tasks">Total Tasks Created: {taskStats.total}</p>
                            </div>
                            <div className="profile-actions">
                                <Link to="/profile" className="profile-btn">View Profile</Link>
                                <Link to="/settings" className="profile-btn">Settings</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                {/* Navigation Cards */}
                <div className="navigation-section">
                    <h2>Quick Navigation</h2>
                    <div className="nav-grid">
                        <Link to="/task-tracking" className="nav-card">
                            <div className="nav-icon">📝</div>
                            <span>Tasks</span>
                        </Link>
                        <Link to="/dashboard" className="nav-card">
                            <div className="nav-icon">📊</div>
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/task-history" className="nav-card">
                            <div className="nav-icon">📜</div>
                            <span>History</span>
                        </Link>
                        <Link to="/profile" className="nav-card">
                            <div className="nav-icon">👤</div>
                            <span>Profile</span>
                        </Link>
                        <Link to="/settings" className="nav-card">
                            <div className="nav-icon">⚙️</div>
                            <span>Settings</span>
                        </Link>
                        <button onClick={logout} className="nav-card logout">
                            <div className="nav-icon">🔓</div>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </AnimatedSection>
            {/* AI Features Modals */}
            {showSmartSuggestions && (
                <SmartSuggestions 
                    onSuggestionClick={handleSuggestionClick}
                    onClose={() => setShowSmartSuggestions(false)}
                />
            )}
            {showNaturalLanguageInput && (
                <NaturalLanguageInput 
                    onTaskCreate={handleTaskCreated}
                    onClose={() => setShowNaturalLanguageInput(false)}
                />
            )}
            {showTaskPopup && (
                <Modal onClose={() => setShowTaskPopup(false)}>
                    <h2>Today's Tasks</h2>
                    {todaysTasks.length > 0 ? (
                        <ul>
                            {todaysTasks.map(task => (
                                <li key={task.id}>{task.title} {task.due_date && <span>({formatDate(task.due_date)})</span>}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No tasks for today!</p>
                    )}
                    <h2>High Priority Tasks</h2>
                    {highPriorityTasks.length > 0 ? (
                        <ul>
                            {highPriorityTasks.map(task => (
                                <li key={task.id}>{task.title} - Due: {formatDate(task.due_date)}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No high priority tasks!</p>
                    )}
                    <button onClick={() => setShowTaskPopup(false)}>Close</button>
                </Modal>
            )}
        </div>
    );
};

export default Home;