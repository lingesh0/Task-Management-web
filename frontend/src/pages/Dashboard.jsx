import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import TaskCard from '../components/TaskCard';
import '../css/Dashboard.css';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState('');
    const tasksCollectionRef = collection(db, 'tasks');

    useEffect(() => {
        const unsubscribe = onSnapshot(tasksCollectionRef, (snapshot) => {
            const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(taskList);
        });

        return () => unsubscribe();
    }, []);

    const handleAddTask = async () => {
        if (taskInput) {
            await addDoc(tasksCollectionRef, { name: taskInput });
            setTaskInput('');
        }
    };

    const handleUpdateTask = async (id, newName) => {
        const taskDoc = doc(db, 'tasks', id);
        await updateDoc(taskDoc, { name: newName });
    };

    const handleDeleteTask = async (id) => {
        const taskDoc = doc(db, 'tasks', id);
        await deleteDoc(taskDoc);
    };

    return (
        <div className="dashboard-container">
            <h1>Task Dashboard</h1>
            <input 
                type="text" 
                value={taskInput} 
                onChange={(e) => setTaskInput(e.target.value)} 
                placeholder="Add a new task" 
            />
            <button onClick={handleAddTask}>Add Task</button>
            <div className="task-list">
                {tasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        onUpdate={handleUpdateTask} 
                        onDelete={handleDeleteTask} 
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;