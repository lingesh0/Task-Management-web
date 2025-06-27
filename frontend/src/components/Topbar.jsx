import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, getIdToken } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import '../css/Navbar.css';

const API_BASE = 'http://localhost:8000';

const Topbar = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

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
      <Link to="/" className="navbar-logo">Task Manager</Link>
      <div className="navbar-links">
        {!user && (
          <>
            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>Login</Link>
            <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>Register</Link>
          </>
        )}
        {user && (
          <>
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
            <button className="navbar-logout-btn" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Topbar; 