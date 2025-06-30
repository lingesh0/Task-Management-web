import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, getIdToken } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../css/Navbar.css';

const API_BASE = 'http://localhost:8000';

const Topbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await getIdToken();
          const res = await fetch(`${API_BASE}/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
          }
        } catch {}
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Helper to get profile letter
  const getProfileLetter = () => {
    if (profile && profile.display_name && profile.display_name.trim().length > 0) {
      return profile.display_name.trim()[0].toUpperCase();
    } else if (user && user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* Sidebar toggle button - only show on home page */}
        {isHomePage && user && (
          <button 
            className={`navbar-sidebar-toggle ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <Link to="/" className="navbar-logo">Task Manager</Link>
      </div>
      
      <div className="navbar-links">
        {!user && (
          <>
            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>Login</Link>
            <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>Register</Link>
          </>
        )}
        {user && (
          <Link to="/profile" className="navbar-avatar-link">
            {profile && profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt="avatar"
                className="navbar-avatar-img"
              />
            ) : (
              <div className="navbar-avatar-img navbar-avatar-fallback">
                {getProfileLetter()}
              </div>
            )}
          </Link>
        )}
      </div>
    </header>
  );
};

export default Topbar; 