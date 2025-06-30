import React, { useState, useEffect, useRef } from 'react';
import { getIdToken } from '../firebase';
import '../css/NaturalLanguageInput.css';

const API_BASE = 'http://localhost:8000';

const NaturalLanguageInput = ({ onTaskCreate, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Debounce the parsing to avoid too many API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (inputText.trim().length > 3) {
      debounceTimer.current = setTimeout(() => {
        parseNaturalLanguage();
      }, 500);
    } else {
      setParsedResult(null);
      setShowPreview(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [inputText]);

  const parseNaturalLanguage = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getIdToken();
      const response = await fetch(`${API_BASE}/ai/parse-natural-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse input');
      }

      const result = await response.json();
      setParsedResult(result);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to parse natural language input');
      console.error('Error parsing input:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTaskFromNaturalLanguage = async () => {
    try {
      setIsCreating(true);
      setError('');
      const token = await getIdToken();
      const response = await fetch(`${API_BASE}/ai/create-from-natural-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const result = await response.json();
      
      // Show success message
      alert(`✅ Task created successfully!\n\nTitle: ${result.task.title}\nDue Date: ${result.task.due_date || 'Not set'}\nPriority: ${result.task.priority}\nConfidence: ${Math.round(result.confidence * 100)}%`);
      
      if (onTaskCreate) {
        onTaskCreate(result.task);
      }
      
      // Close the modal
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError('Failed to create task from natural language input');
      console.error('Error creating task:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (parsedResult && parsedResult.confidence > 0.3) {
        createTaskFromNaturalLanguage();
      }
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.4) return 'medium';
    return 'low';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.7) return 'High confidence';
    if (confidence >= 0.4) return 'Medium confidence';
    return 'Low confidence';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="modal-overlay" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="nlp-input-container" onClick={e => e.stopPropagation()}>
        <div className="nlp-input-header">
          <h3>Natural Language Task Input</h3>
          <button onClick={onClose} className="close-btn" aria-label="Close">×</button>
        </div>
        <div className="nlp-input-content">
          <div className="input-section">
            <label htmlFor="nlp-input">Describe your task naturally:</label>
            <textarea
              ref={inputRef}
              id="nlp-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Remind me to send the report tomorrow at 10am"
              className="nlp-textarea"
              rows={3}
            />
            
            {loading && (
              <div className="parsing-indicator">
                <div className="spinner"></div>
                <span>Parsing your input...</span>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </div>

          {showPreview && parsedResult && (
            <div className="preview-section">
              <h4>📋 Task Preview</h4>
              <div className={`preview-card confidence-${getConfidenceColor(parsedResult.confidence)}`}>
                <div className="preview-header">
                  <h5>{parsedResult.title}</h5>
                  <span className={`confidence-badge confidence-${getConfidenceColor(parsedResult.confidence)}`}>
                    {getConfidenceText(parsedResult.confidence)}
                  </span>
                </div>
                
                <div className="preview-details">
                  {parsedResult.due_date && (
                    <div className="preview-item">
                      <span className="preview-label">📅 Due Date:</span>
                      <span className="preview-value">{formatDate(parsedResult.due_date)}</span>
                    </div>
                  )}
                  
                  {parsedResult.due_time && (
                    <div className="preview-item">
                      <span className="preview-label">⏰ Time:</span>
                      <span className="preview-value">{formatTime(parsedResult.due_time)}</span>
                    </div>
                  )}
                  
                  {parsedResult.priority && parsedResult.priority !== 'Medium' && (
                    <div className="preview-item">
                      <span className="preview-label">🎯 Priority:</span>
                      <span className="preview-value">{parsedResult.priority}</span>
                    </div>
                  )}
                  
                  {parsedResult.tags && parsedResult.tags.length > 0 && (
                    <div className="preview-item">
                      <span className="preview-label">🏷️ Tags:</span>
                      <div className="preview-tags">
                        {parsedResult.tags.map((tag, index) => (
                          <span key={index} className="preview-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="examples-section">
            <h4>💡 Examples</h4>
            <div className="examples-grid">
              <div className="example-item" onClick={() => setInputText("Remind me to send the report tomorrow at 10am")}>
                <span className="example-text">"Remind me to send the report tomorrow at 10am"</span>
              </div>
              <div className="example-item" onClick={() => setInputText("Buy groceries this weekend")}>
                <span className="example-text">"Buy groceries this weekend"</span>
              </div>
              <div className="example-item" onClick={() => setInputText("Schedule a meeting with John next week")}>
                <span className="example-text">"Schedule a meeting with John next week"</span>
              </div>
              <div className="example-item" onClick={() => setInputText("Pay electricity bill by Friday")}>
                <span className="example-text">"Pay electricity bill by Friday"</span>
              </div>
            </div>
          </div>
        </div>

        <div className="nlp-input-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={createTaskFromNaturalLanguage}
            disabled={!parsedResult || parsedResult.confidence < 0.3 || isCreating}
            className="create-btn"
          >
            {isCreating ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NaturalLanguageInput; 