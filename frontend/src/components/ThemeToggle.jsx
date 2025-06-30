import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import '../css/index.css';

const ThemeToggle = ({ className = '', size = 'medium' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    small: 'w-8 h-4 text-xs',
    medium: 'w-12 h-6 text-sm',
    large: 'w-16 h-8 text-base'
  };

  const iconSizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <button
      className={`theme-toggle transition-colors duration-500 ${sizeClasses[size]} ${className}`}
      onClick={toggleTheme}
      data-theme={theme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`theme-toggle-icon ${iconSizeClasses[size]} absolute`}
          >
            🌙
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`theme-toggle-icon ${iconSizeClasses[size]} absolute`}
          >
            ☀️
          </motion.span>
        )}
      </AnimatePresence>
      {/* Animated slider */}
      <div className="theme-toggle-slider" />
    </button>
  );
};

export default ThemeToggle; 