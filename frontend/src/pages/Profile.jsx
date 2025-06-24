import React from 'react';
import { useAuth } from '../firebase'; // Assuming you have a custom hook for authentication
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Profile = () => {
    const { user } = useAuth();
    const [taskStats, setTaskStats] = useState(null);

    useEffect(() => {
        const fetchTaskStats = async () => {
            if (user) {
                const userDoc = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDoc);
                if (docSnap.exists()) {
                    setTaskStats(docSnap.data());
                } else {
                    console.log('No such document!');
                }
            }
        };

        fetchTaskStats();
    }, [user]);

    if (!user) {
        return <div>Please log in to view your profile.</div>;
    }

    return (
        <div>
            <h1>User Profile</h1>
            <p>Email: {user.email}</p>
            {taskStats && (
                <div>
                    <h2>Task Statistics</h2>
                    <p>Total Tasks: {taskStats.totalTasks}</p>
                    <p>Completed Tasks: {taskStats.completedTasks}</p>
                </div>
            )}
        </div>
    );
};

export default Profile;