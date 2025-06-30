import React, { useState, useEffect } from 'react';
import { getIdToken } from '../firebase';
import '../css/SmartSuggestions.css';

const API_BASE = 'http://localhost:8000';

const SmartSuggestions = ({ onSuggestionClick, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching AI suggestions...');
      const token = await getIdToken();
      console.log('✅ Token obtained');
      
      const response = await fetch(`${API_BASE}/ai/suggestions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch suggestions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Received data:', data);
      
      setSuggestions(data.suggestions || []);
      console.log('✅ Suggestions set:', data.suggestions?.length || 0);
      
    } catch (err) {
      console.error('❌ Error fetching suggestions:', err);
      setError(`Failed to load smart suggestions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'day_pattern':
        return '📅';
      case 'recurring_pattern':
        return '🔄';
      case 'frequent_task':
        return '📊';
      case 'morning_routine':
        return '🌅';
      default:
        return '💡';
    }
  };

  return (
    <div className="modal-overlay" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="smart-suggestions-container" onClick={e => e.stopPropagation()}>
        <div className="smart-suggestions-header">
          <h3>Smart Suggestions</h3>
          <button onClick={onClose} className="close-btn" aria-label="Close">×</button>
        </div>
        {loading ? (
          <div className="loading-suggestions">
            <div className="spinner"></div>
            <p>Analyzing your patterns...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchSuggestions} className="retry-btn">Retry</button>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="no-suggestions">
            <p>No suggestions yet. Create more tasks to get personalized suggestions!</p>
          </div>
        ) : (
          <>
            <div className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className={`suggestion-item confidence-${getConfidenceColor(suggestion.confidence)}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-icon">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="suggestion-content">
                    <h4 className="suggestion-title">{suggestion.title}</h4>
                    <p className="suggestion-reason">{suggestion.reason}</p>
                    <div className="suggestion-details">
                      {suggestion.suggested_due_date && (
                        <span className="suggestion-date">📅 {suggestion.suggested_due_date}</span>
                      )}
                      {suggestion.suggested_time && (
                        <span className="suggestion-time">⏰ {suggestion.suggested_time}</span>
                      )}
                      {suggestion.suggested_priority && (
                        <span className="suggestion-priority">🎯 {suggestion.suggested_priority}</span>
                      )}
                      {suggestion.recurrence && (
                        <span className="suggestion-recurrence">🔄 {suggestion.recurrence}</span>
                      )}
                    </div>
                  </div>
                  <div className="suggestion-confidence">
                    <div className={`confidence-bar confidence-${getConfidenceColor(suggestion.confidence)}`}>
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${suggestion.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="confidence-text">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="suggestions-footer">
              <p className="suggestions-info">💡 Suggestions are based on your task history and patterns</p>
              <button onClick={fetchSuggestions} className="refresh-btn">🔄 Refresh</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartSuggestions; 