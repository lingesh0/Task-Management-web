import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import { TaskViewProvider } from './contexts/TaskViewContext';

// CSS imports
import './css/index.css';
import './css/Home.css';
import './css/Dashboard.css';
import './css/Profile.css';
import './css/Settings.css';
import './css/Login.css';
import './css/Register.css';
import './css/TaskDetail.css';
import './css/TaskTracking.css';
import './css/NotFound.css';

const AppLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Close sidebar when navigating away from home page
  useEffect(() => {
    if (!isHomePage) {
      setSidebarOpen(false);
    }
  }, [isHomePage]);
  
  // Close sidebar when clicking backdrop on mobile
  const handleBackdropClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };
  
  return (
    <>
      <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="app-layout">
        {/* Mobile backdrop */}
        {isHomePage && isMobile && (
          <div 
            className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
            onClick={handleBackdropClick}
          />
        )}
        
        {/* Sidebar - always show on non-home pages, conditional on home page */}
        {(!isHomePage || sidebarOpen) && (
          <Sidebar 
            className={`${isHomePage ? 'home-sidebar' : ''} ${isMobile ? 'mobile-overlay' : ''} ${sidebarOpen ? 'open' : ''}`}
          />
        )}
        
        <main className={`main-content ${isHomePage ? 'home-page' : ''} ${isHomePage && sidebarOpen ? 'with-sidebar' : ''}`}>
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
      {(location.pathname === '/settings') && <ContactBar />}
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
  <ThemeProvider>
    <AuthProvider>
      <TaskViewProvider>
        <Router>
          <AnimatePresence mode="wait">
            <App />
          </AnimatePresence>
        </Router>
      </TaskViewProvider>
      <ToastContainer />
    </AuthProvider>
  </ThemeProvider>
);

export default AppWithRouter;