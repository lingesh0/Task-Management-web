import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash.debounce';
import { sendChatMessage } from '../utils/chatApi';
import TypingDots from './TypingDots';
import './AIAssistantPanel.css';
import chatbotAvatar from '../assets/chatbot-avatar.svg';

const API_BASE = 'http://localhost:8000';

const AIAssistantPanel = React.memo(function AIAssistantPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  // Debounced send
  const debouncedSend = useMemo(() => debounce(async (msg) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendChatMessage(msg);
      setMessages(msgs => [...msgs.slice(-29), { role: 'assistant', content: response }]);
    } catch (e) {
      setError('AI assistant is unavailable.');
    } finally {
      setLoading(false);
      setInput('');
      inputRef.current?.focus();
    }
  }, 400), []);

  // Send message handler
  const sendMessage = useCallback((customInput) => {
    const messageToSend = typeof customInput === 'string' ? customInput : input;
    if (!messageToSend.trim()) return;
    setMessages(msgs => [...msgs.slice(-29), { role: 'user', content: messageToSend }]);
    debouncedSend(messageToSend);
  }, [input, debouncedSend]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { debouncedSend.cancel(); };
  }, [debouncedSend]);

  // Quick action prompts
  const quickPrompts = [
    {
      label: 'Break a task into subtasks',
      prompt: 'Break the following task into subtasks: [Describe your task here]'
    },
    {
      label: 'Productivity tips',
      prompt: 'Give me a productivity tip.'
    },
    {
      label: 'Summarize my day',
      prompt: 'Summarize my day based on my completed tasks.'
    },
    {
      label: 'Summarize my week',
      prompt: 'Summarize my week based on my completed tasks.'
    }
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="ai-assistant-panel"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-2xl bg-white/20 hover:bg-white/40 dark:bg-gray-800/40 dark:hover:bg-gray-800/60 rounded-full w-10 h-10 flex items-center justify-center shadow-md transition">×</button>
          <div className="ai-assistant-header">
            <img
              src={chatbotAvatar}
              alt="AI Assistant"
              style={{
                width: 72,
                height: 72,
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(99,102,241,0.10)',
                border: '3px solid #fff',
                objectFit: 'cover',
                marginBottom: 8
              }}
            />
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '12px 0 2px 0', letterSpacing: 0.5 }}>AI Assistant</h2>
            <div style={{ color: '#c7d2fe', fontSize: 13, marginBottom: 12, maxWidth: 320, fontWeight: 500 }}>
              Your smart productivity companion. Ask about tasks, get productivity tips, break tasks into subtasks, or get a summary of your day/week.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 8 }}>
              {quickPrompts.map((q, i) => (
                <button
                  key={i}
                  style={{
                    background: 'linear-gradient(90deg, #60a5fa 0%, #818cf8 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '7px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    border: 0,
                    outline: 0,
                    boxShadow: '0 1px 4px rgba(99,102,241,0.10)',
                    cursor: 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'background 0.2s, opacity 0.2s',
                  }}
                  onClick={() => sendMessage(q.prompt)}
                  disabled={loading}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <div style={{ color: '#a5b4fc', fontSize: 12, marginBottom: 2 }}>Supports GPT or local chatbot (backend controlled)</div>
          </div>
          <div className="ai-assistant-content">
            <div className="ai-assistant-welcome">
              👋 Welcome! How can I help you today?
            </div>
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-assistant-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div style={{ textAlign: 'center', color: '#a5b4fc', fontSize: 14 }}>AI is typing...</div>}
            {error && <div style={{ textAlign: 'center', color: '#f87171', fontSize: 14 }}>{error}</div>}
          </div>
          <form className="ai-assistant-input-row" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
            <textarea
              ref={inputRef}
              className="chat-textarea"
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !loading) sendMessage();
                }
              }}
              placeholder="Ask me anything..."
              disabled={loading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default AIAssistantPanel; 