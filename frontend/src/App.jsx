import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Sidebar from './components/Navbar';
import TaskTracking from './pages/TaskTracking';
import Topbar from './components/Topbar';
import ContactBar from './components/ContactBar';
import Settings from './pages/Settings';
import TaskHistory from './pages/TaskHistory';

const AppLayout = () => {
  const location = useLocation();
  return (
    <>
      <Topbar />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/task-tracking" element={<TaskTracking />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/task-history" element={<TaskHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      {(location.pathname === '/' || location.pathname === '/settings') && <ContactBar />}
    </>
  );
};

const App = () => {
  const location = useLocation();
  if (location.pathname === '/login') {
    return <Login />;
  }
  if (location.pathname === '/register') {
    return <Register />;
  }
  return <AppLayout />;
};

const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;