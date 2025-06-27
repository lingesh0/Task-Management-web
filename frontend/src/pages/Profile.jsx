import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, getIdToken } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import '../css/Profile.css';

const storage = getStorage();

const API_BASE = 'http://localhost:8000';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    const [photoURL, setPhotoURL] = useState('');
    const [theme, setTheme] = useState('light');
    const [showResetModal, setShowResetModal] = useState(false);
    const fileInputRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) fetchProfile();
        });
        return () => unsubscribe();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = await getIdToken();
            const res = await fetch(`${API_BASE}/profile/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                setError('Session expired. Please log in again.');
                navigate('/login');
                return;
            }
            const data = await res.json();
            setProfile(data);
            setDisplayName(data.display_name || '');
            setPhotoURL(data.photo_url || '');
            setTheme(data.theme_preference || 'light');
        } catch (err) {
            setError('Failed to fetch profile');
        }
    };

    const reloadUser = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser });
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const token = await getIdToken();
            await fetch(`${API_BASE}/profile/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    display_name: displayName,
                    photo_url: photoURL,
                    theme_preference: theme,
                }),
            });
            setProfile(prev => ({ ...prev, display_name: displayName, photo_url: photoURL, theme_preference: theme }));
            setSuccess("Profile updated!");
            setEditMode(false);
        } catch (err) {
            setError("Failed to update profile");
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setError(""); setSuccess("");
        try {
            const storageRef = ref(storage, `profile-pictures/${user.uid}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
            await updateProfile(user, { photoURL: url });
            setPhotoURL(url);
            setProfile(prev => ({ ...prev, photo_url: url }));
            const token = await getIdToken();
            await fetch(`${API_BASE}/profile/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    display_name: displayName,
                    photo_url: url,
                    theme_preference: theme,
                }),
            });
            setSuccess("Profile picture updated!");
            await fetchProfile();
        } catch (err) {
            setError("Failed to upload photo");
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async () => {
        setError(''); setSuccess('');
        try {
            await sendPasswordResetEmail(auth, user.email);
            setShowResetModal(true);
            setSuccess('Password reset email sent!');
        } catch (err) {
            setError('Failed to send password reset email');
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
        setError(''); setSuccess('');
        try {
            if (photoURL) {
                const storageRef = ref(storage, `profile-pictures/${user.uid}`);
                await deleteObject(storageRef).catch(() => {});
            }
            await deleteDoc(doc(db, 'users', user.uid));
            await deleteUser(user);
            setSuccess('Account deleted. Redirecting...');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError('Failed to delete account. You may need to re-login to delete.');
        }
    };

    const handleThemeChange = async (e) => {
        const newTheme = e.target.value;
        setTheme(newTheme);
        if (user) {
            await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
        }
    };

    // Helper to get profile letter
    const getProfileLetter = () => {
        if (displayName && displayName.trim().length > 0) {
            return displayName.trim()[0].toUpperCase();
        } else if (user && user.email) {
            return user.email[0].toUpperCase();
        }
        return 'U';
    };

    if (error) {
        return <div className="profile-error">{error}</div>;
    }

    if (!user) {
        return <div className="profile-container">Please log in to view your profile.</div>;
    }

    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            <div className="profile-avatar-section">
                {photoURL || user.photoURL ? (
                    <img
                        src={photoURL || user.photoURL}
                        alt="avatar"
                        className="profile-avatar-img"
                    />
                ) : (
                    <div className="profile-avatar-img profile-avatar-fallback">
                        {getProfileLetter()}
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                />
                <button onClick={() => fileInputRef.current.click()} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
            </div>
            <p><b>Email:</b> {user.email}</p>
            <p><b>UID:</b> {user.uid}</p>
            <p><b>Name:</b> {editMode ? (
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            ) : (
                profile?.display_name || 'Not set'
            )}</p>
            <p><b>Registered:</b> {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'N/A'}</p>
            <p><b>Last Sign-In:</b> {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}</p>
            <div className="profile-theme-section">
                <label><b>Theme:</b></label>
                <select value={theme} onChange={handleThemeChange}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>
            {editMode ? (
                <>
                    <button onClick={handleProfileUpdate}>Save</button>
                    <button onClick={() => setEditMode(false)}>Cancel</button>
                </>
            ) : (
                <button onClick={() => setEditMode(true)}>Edit Profile</button>
            )}
            <button onClick={handleChangePassword}>Change Password</button>
            <button onClick={handleDeleteAccount} className="delete-account-btn">Delete Account</button>
            {success && <div className="success">{success}</div>}
            {showResetModal && (
                <div className="reset-modal">
                    <div className="reset-modal-content">
                        <p>Password reset email sent! Please check your inbox.</p>
                        <button onClick={() => setShowResetModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;