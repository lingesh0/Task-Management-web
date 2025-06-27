import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import '../css/index.css';

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/task-tracking', icon: '📝', label: 'Tasks' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
  { to: '/task-history', icon: '🧾', label: 'Task History' },
];

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : ''}>
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      
    </aside>
  );
};

export default Sidebar;