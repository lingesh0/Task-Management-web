import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, provider, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import '../css/Login.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName || '',
                createdAt: serverTimestamp(),
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: user.displayName || '',
                createdAt: serverTimestamp(),
            }, { merge: true });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-bg-gradient">
            <div className="login-card-split">
                <div className="login-illustration">
                    {/* SVG illustration placeholder */}
                    <svg width="260" height="260" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="130" cy="130" r="130" fill="#a78bfa"/>
                        <ellipse cx="130" cy="200" rx="80" ry="20" fill="#7c3aed" opacity="0.2"/>
                        <path d="M90 180 Q130 100 170 180" stroke="#fff" strokeWidth="8" fill="none"/>
                        <circle cx="130" cy="120" r="40" fill="#fff"/>
                        <rect x="110" y="140" width="40" height="60" rx="20" fill="#f472b6"/>
                        <rect x="120" y="160" width="10" height="30" rx="5" fill="#6366f1"/>
                        <rect x="130" y="160" width="10" height="30" rx="5" fill="#6366f1"/>
                    </svg>
                    <div className="login-illustration-caption">
                        Create your account<br/>and start managing tasks!
                    </div>
                </div>
                <div className="login-form-side">
                    <div className="login-form-header">Create Account</div>
                    <form className="login-form" onSubmit={handleRegister}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                        {error && <p className="error">{error}</p>}
                        <button className="login-btn" type="submit">Register</button>
                        <button className="google-login-btn" onClick={handleGoogleLogin} type="button">
                            <span className="google-icon" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                <svg width="20" height="20" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.68 2.7 30.74 0 24 0 14.82 0 6.73 5.8 2.69 14.09l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.39c-.53 2.84-2.13 5.24-4.54 6.87l7.02 5.46C43.99 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.29c-1.13-3.37-1.13-7.01 0-10.38l-7.98-6.2C.99 16.09 0 19.94 0 24c0 4.06.99 7.91 2.69 12.29l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.74 0 12.42-2.23 16.56-6.07l-7.02-5.46c-2.01 1.35-4.59 2.14-7.54 2.14-6.38 0-11.87-3.59-14.33-8.79l-7.98 6.2C6.73 42.2 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
                            </span>
                            Sign up with Google
                        </button>
                    </form>
                    <div className="login-form-footer">
                        <Link to="/login">Already have an account? Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;