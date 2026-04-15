import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

const SUGGESTIONS = [
  '🔑 What are the roles?',
  '🏗️ How to add a project?',
  '📦 Browse the catalog',
  '👷 Find artisans',
  '📋 Manage quotes',
  '🛒 My orders',
];

function formatMessage(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part.split('\n').map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

// ArtiChat Logo SVG
const ArtiChatIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="10" fill="url(#artigrad)" />
    <path d="M8 10C8 8.9 8.9 8 10 8h12c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-3l-3 3-3-3H10c-1.1 0-2-.9-2-2V10z" fill="white" fillOpacity="0.9"/>
    <circle cx="12" cy="14" r="1.5" fill="#4a5d23"/>
    <circle cx="16" cy="14" r="1.5" fill="#4a5d23"/>
    <circle cx="20" cy="14" r="1.5" fill="#4a5d23"/>
    <defs>
      <linearGradient id="artigrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4a5d23"/>
        <stop offset="1" stopColor="#8b5a2b"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: `Hello! 👋 I'm **ArtiChat**, your Artisanet guide. Ask me anything about the site — roles, projects, catalog, orders and more!`,
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 320);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;

    setShowSuggestions(false);
    const userMsg = { id: Date.now(), from: 'user', text: trimmed, time: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setTyping(true);

    try {
      // Prepare history to send to Gemini API
      // We must filter out the initial welcome message because Gemini history MUST start with a 'user' message
      const apiMessages = updatedMessages
        .filter((m, i) => !(i === 0 && m.from === 'bot'))
        .map(m => ({
          role: m.from === 'bot' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }));

      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const chatUrl = `${apiBase}/chat`;

      const token = localStorage.getItem('token');
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur API');
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: data.reply, time: new Date() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        from: 'bot', 
        text: `⚠️ **Erreur de connexion**\nAvez-vous configuré GEMINI_API_KEY dans le backend ?\n\nDétails: ${err.message}`, 
        time: new Date() 
      }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setShowSuggestions(true);
    setMessages([{
      id: Date.now(), from: 'bot',
      text: `Hello! 👋 I'm **ArtiChat**, your Artisanet guide. Ask me anything about the site — roles, projects, catalog, orders and more!`,
      time: new Date(),
    }]);
  };

  const fmt = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ── FAB ── */}
      <button
        data-sr-ignore
        id="chatbot-fab"
        className={`ac-fab ${open ? 'ac-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Ouvrir ArtiChat"
      >
        <span className="ac-fab-inner">
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M8 10C8 8.9 8.9 8 10 8h12c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-3l-3 3-3-3H10c-1.1 0-2-.9-2-2V10z" fill="white"/>
              <circle cx="12" cy="14" r="1.8" fill="#4a5d23"/>
              <circle cx="16" cy="14" r="1.8" fill="#4a5d23"/>
              <circle cx="20" cy="14" r="1.8" fill="#4a5d23"/>
            </svg>
          )}
        </span>
        {!open && <span className="ac-fab-ping" />}
        {!open && <span className="ac-fab-label">ArtiChat</span>}
      </button>

      {/* ── Chat Window ── */}
      <div
        data-sr-ignore
        className={`ac-window ${open ? 'ac-window--open' : ''}`}
        role="dialog"
        aria-label="ArtiChat — Votre guide Artisanet"
      >
        {/* Header */}
        <div className="ac-header">
          <div className="ac-header-left">
            <div className="ac-header-avatar">
              <ArtiChatIcon size={22} />
            </div>
            <div className="ac-header-text">
              <div className="ac-header-name">
                ArtiChat
                <span className="ac-header-badge">IA</span>
              </div>
              <div className="ac-header-sub">
                <span className="ac-online-dot" />
                Votre guide Artisanet
              </div>
            </div>
          </div>
          <div className="ac-header-actions">
            <button className="ac-hbtn" onClick={clearChat} title="Nouvelle conversation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
            </button>
            <button className="ac-hbtn" onClick={() => setOpen(false)} title="Fermer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ac-messages" id="ac-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`ac-msg ac-msg--${msg.from}`}>
              {msg.from === 'bot' && (
                <div className="ac-msg-avatar">
                  <ArtiChatIcon size={16} />
                </div>
              )}
              <div className="ac-msg-body">
                <div className="ac-bubble">{formatMessage(msg.text)}</div>
                <div className="ac-msg-time">{fmt(msg.time)}</div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="ac-msg ac-msg--bot">
              <div className="ac-msg-avatar"><ArtiChatIcon size={16} /></div>
              <div className="ac-msg-body">
                <div className="ac-bubble ac-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="ac-suggestions">
            <p className="ac-suggestions-label">Suggestions rapides</p>
            <div className="ac-chips">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="ac-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="ac-input-area">
          <input
            ref={inputRef}
            id="chatbot-input"
            className="ac-input"
            type="text"
            placeholder="Posez votre question à ArtiChat..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="off"
          />
          <button
            id="chatbot-send"
            className={`ac-send ${input.trim() ? 'ac-send--active' : ''}`}
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            aria-label="Envoyer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="ac-footer">
          Propulsé par <strong>ArtiChat</strong> · BuildMarket 2026
        </div>
      </div>
    </>
  );
}
