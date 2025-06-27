import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Home.css';

const Home = () => {
    return (
        <div className="home">
            <h1>Welcome to the Task Management App</h1>
            <p>Your one-stop solution for managing tasks efficiently.</p>
            <div className="home-auth-buttons">
                <Link to="/login" className="home-btn">Login</Link>
                <Link to="/register" className="home-btn home-btn-secondary">Register</Link>
            </div>
        </div>
    );
};

export default Home;