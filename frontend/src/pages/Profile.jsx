import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, getIdToken } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail, deleteUser, updateEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import '../css/Profile.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const storage = getStorage();

const API_BASE = 'http://localhost:8000';

const Profile = () => {
    const { t } = useTranslation();
    const { user, updateUserProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    const [photoURL, setPhotoURL] = useState('');
    const [theme, setTheme] = useState('light');
    const [showResetModal, setShowResetModal] = useState(false);
    const [emailEditMode, setEmailEditMode] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const fileInputRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoURL(user.photoURL || '');
            setEmail(user.email || '');
        }
    }, [user]);

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
            if (data.email) {
                setEmail(data.email);
            }
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

    const handleEmailUpdate = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        
        if (!newEmail || newEmail === email) {
            setError("Please enter a new email address");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            setError("Please enter a valid email address");
            return;
        }

        try {
            const token = await getIdToken();
            const res = await fetch(`${API_BASE}/profile/email`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: newEmail,
                    display_name: displayName,
                    photo_url: photoURL,
                    theme_preference: theme,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to update email');
            }

            const data = await res.json();
            setProfile(prev => ({ ...prev, email: newEmail }));
            setEmail(newEmail);
            setSuccess("Email updated successfully! Please check your new email for verification.");
            setEmailEditMode(false);
            setNewEmail('');
            
            // Reload user to get updated email
            await reloadUser();
        } catch (err) {
            setError(err.message || "Failed to update email");
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
        return <div className="profile-error">{t('profile.error', { error })}</div>;
    }

    if (!user) {
        return <div className="profile-container">{t('profile.loginToView')}</div>;
    }

    return (
        <div className="profile-container">
            <div className="dashboard-header">
                <h1>Profile</h1>
            </div>
            <div className="profile-avatar-section">
                {photoURL || user.photoURL ? (
                    <img
                        src={photoURL || user.photoURL}
                        alt={t('profile.avatar')}
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
                    {uploading ? t('profile.uploading') : t('profile.uploadPhoto')}
                </button>
            </div>
            
            <p><b>{t('profile.email')}:</b> 
                {emailEditMode ? (
                    <form onSubmit={handleEmailUpdate} style={{ display: 'inline' }}>
                        <input 
                            type="email" 
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder={t('profile.enterNewEmail')}
                            style={{ marginLeft: '8px', width: '200px' }}
                        />
                        <button type="submit" style={{ marginLeft: '8px' }}>{t('general.save')}</button>
                        <button type="button" onClick={() => { setEmailEditMode(false); setNewEmail(''); }} style={{ marginLeft: '8px' }}>{t('general.cancel')}</button>
                    </form>
                ) : (
                    <>
                        {email}
                        <button onClick={() => { setEmailEditMode(true); setNewEmail(email); }} style={{ marginLeft: '8px' }}>{t('general.edit')}</button>
                    </>
                )}
            </p>
            
            <p><b>{t('profile.uid')}:</b> {user.uid}</p>
            <p><b>{t('profile.name')}:</b> {editMode ? (
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            ) : (
                profile?.display_name || t('profile.notSet')
            )}</p>
            <p><b>{t('profile.registered')}:</b> {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : t('profile.na')}</p>
            <p><b>{t('profile.lastSignIn')}:</b> {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : t('profile.na')}</p>
            
            {editMode ? (
                <>
                    <button onClick={handleProfileUpdate}>{t('general.save')}</button>
                    <button onClick={() => setEditMode(false)}>{t('general.cancel')}</button>
                </>
            ) : (
                <button onClick={() => setEditMode(true)} className="edit-profile-btn" style={{ marginTop: '24px', width: '100%' }}>{t('profile.editProfile')}</button>
            )}
            <button onClick={handleChangePassword}>{t('profile.changePassword')}</button>
            <button onClick={handleDeleteAccount} className="delete-account-btn">{t('profile.deleteAccount')}</button>
           
            {success && <div className="success">{success}</div>}
            {showResetModal && (
                <div className="reset-modal">
                    <div className="reset-modal-content">
                        <p>{t('profile.passwordResetSent')}</p>
                        <button onClick={() => setShowResetModal(false)}>{t('general.close')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;