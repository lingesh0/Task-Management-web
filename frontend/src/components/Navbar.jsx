import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import ThemeToggle from './ThemeToggle';
import '../css/index.css';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/task-tracking', icon: '📝', label: 'Tasks' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
  { to: '/task-history', icon: '🧾', label: 'Task History' },
];

const Sidebar = ({ className = '' }) => {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <aside className={`sidebar ${className} ${scrolled ? 'sidebar-shadow' : ''}`}>
      <div className="sidebar-content">
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : ''}>
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        {/* Theme Toggle in Sidebar */}
        <div className="sidebar-theme-section">
          <div className="sidebar-theme-label">Theme</div>
          <ThemeToggle size="medium" className="sidebar-theme-toggle" />
        </div>
        
        {user && (
          <button className="sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;