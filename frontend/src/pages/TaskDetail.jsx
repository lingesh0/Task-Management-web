import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const TaskDetail = () => {
    const { id } = useParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const taskDoc = doc(db, 'tasks', id);
                const taskSnapshot = await getDoc(taskDoc);
                if (taskSnapshot.exists()) {
                    setTask(taskSnapshot.data());
                } else {
                    setError('Task not found');
                }
            } catch (err) {
                setError('Error fetching task');
            } finally {
                setLoading(false);
            }
        };

        fetchTask();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Task Detail</h1>
            {task ? (
                <div>
                    <h2>{task.title}</h2>
                    <p>{task.description}</p>
                    <p>Status: {task.status}</p>
                    <p>Created At: {task.createdAt.toDate().toString()}</p>
                </div>
            ) : (
                <p>No task details available.</p>
            )}
        </div>
    );
};

export default TaskDetail;