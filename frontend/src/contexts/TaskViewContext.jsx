import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskViewContext = createContext();

export const useTaskView = () => {
  const context = useContext(TaskViewContext);
  if (!context) {
    throw new Error('useTaskView must be used within a TaskViewProvider');
  }
  return context;
};

export const TaskViewProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('dueDate');

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedViewMode = localStorage.getItem('taskViewMode');
    const savedSortBy = localStorage.getItem('taskSortBy');

    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
    if (savedSortBy) {
      setSortBy(savedSortBy);
    }
  }, []);

  const updateViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('taskViewMode', mode);
  };

  const updateSortBy = (sort) => {
    setSortBy(sort);
    localStorage.setItem('taskSortBy', sort);
  };

  const value = {
    viewMode,
    sortBy,
    updateViewMode,
    updateSortBy
  };

  return (
    <TaskViewContext.Provider value={value}>
      {children}
    </TaskViewContext.Provider>
  );
}; 