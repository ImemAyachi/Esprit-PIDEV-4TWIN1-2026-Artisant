import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

/* ───────── keyframes (injected once) ───────── */
const STYLE_ID = 'batibot-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes batibotSlideUp {
      from { opacity: 0; transform: translateY(24px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    @keyframes batibotDot {
      0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
      40%           { transform: scale(1);   opacity: 1; }
    }
    @keyframes batibotPulse {
      0%   { box-shadow: 0 0 0 0 rgba(74,93,35,0.45); }
      70%  { box-shadow: 0 0 0 12px rgba(74,93,35,0); }
      100% { box-shadow: 0 0 0 0 rgba(74,93,35,0); }
    }
  `;
  document.head.appendChild(style);
}

const AiProductRecommender = () => {
  const [need, setNeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Full conversation history
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', type: 'welcome' }
  ]);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [isOpen]);

  const handleRecommend = async () => {
    const text = need.trim();
    if (!text) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text }]);
    setNeed('');
    setLoading(true);

    try {
      // Normalize user input with NLP processor (Arabizi/typos/mixed language).
      let normalizedNeed = text;
      let nlpMeta = null;
      try {
        const nlpRes = await api.post('/nlp/process', {
          text,
          context: { domain: 'batibot_recommendation' },
          options: {
            correct_errors: true,
            extract_entities: true,
            extract_sentiment: false,
            language_fallback: 'fr',
            confidence_threshold: 0.55,
          },
        });

        const payload = nlpRes?.data?.data;
        const corrected = payload?.corrected_text;
        if (typeof corrected === 'string' && corrected.trim()) {
          normalizedNeed = corrected.trim();
        }
        if (payload) {
          nlpMeta = {
            language: payload.language,
            corrected_text: payload.corrected_text,
            intent: payload.intent,
            intent_confidence: payload.intent_confidence,
            entities: payload.entities,
            correction_detail: payload.correction_detail,
            original_text: payload.original_text,
          };
        }
      } catch {
        // Keep going with raw text if NLP service is unavailable.
      }

      const res = await api.post('/ai/recommend', { need: normalizedNeed, nlp: nlpMeta });
      if (res.data.success && res.data.data?.length) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1, role: 'bot', type: 'recommendations',
          recommendations: res.data.data
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1, role: 'bot', type: 'text',
          text: res.data.message || 'Aucun produit trouvé pour cette demande.'
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot', type: 'error',
        text: err.response?.data?.message || 'Erreur de connexion au serveur.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Render helpers ─── */
  const BotAvatar = () => (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#4a5d23,#6b8c3e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px',
      color: '#fff', boxShadow: '0 2px 6px rgba(74,93,35,0.3)'
    }}>BB</div>
  );

  const TypingBubble = () => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <BotAvatar />
      <div style={{
        background: '#fff', padding: '14px 18px', borderRadius: '2px 18px 18px 18px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
        display: 'flex', gap: 5, alignItems: 'center'
      }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#4a5d23',
            animation: `batibotDot 1.2s ${d}s infinite ease-in-out`
          }} />
        ))}
      </div>
    </div>
  );

  const renderMessage = (msg) => {
    if (msg.role === 'user') {
      return (
        <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', paddingLeft: '15%' }}>
          <div style={{
            background: 'linear-gradient(135deg,#4a5d23,#5c7a2e)', color: '#fff',
            padding: '10px 16px', borderRadius: '18px 2px 18px 18px',
            fontSize: '0.9rem', lineHeight: 1.45, boxShadow: '0 2px 8px rgba(74,93,35,0.25)'
          }}>
            {msg.text}
          </div>
        </div>
      );
    }

    // Bot messages
    return (
      <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', paddingRight: '8%' }}>
        <BotAvatar />
        <div style={{
          background: msg.type === 'error' ? '#fef2f2' : '#fff',
          border: `1px solid ${msg.type === 'error' ? '#fecaca' : '#e5e7eb'}`,
          padding: msg.type === 'recommendations' ? '14px' : '12px 16px',
          borderRadius: '2px 18px 18px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          color: msg.type === 'error' ? '#b91c1c' : '#1f2937',
          fontSize: '0.9rem', lineHeight: 1.5, flex: 1, minWidth: 0
        }}>
          {msg.type === 'welcome' && (
            <>
              <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Bonjour !</p>
              <p style={{ margin: 0 }}>
                Je suis <strong>BatiBot</strong>, votre conseiller expert en <strong>matériaux de construction</strong>.
                Je peux vous aider à trouver les meilleurs produits (ciment, marbre, outils...) pour vos travaux.
              </p>
              <div style={{
                marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6
              }}>
                {['Carreler ma salle de bain', 'Matériaux pas chers', 'Rénovation terrasse'].map(s => (
                  <button key={s} onClick={() => { setNeed(s); }} style={{
                    background: '#f0f5e8', border: '1px solid #c5d6a3', borderRadius: 20,
                    padding: '5px 12px', fontSize: '0.78rem', color: '#4a5d23',
                    cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s'
                  }}
                    onMouseEnter={e => { e.target.style.background = '#e2edcf'; }}
                    onMouseLeave={e => { e.target.style.background = '#f0f5e8'; }}
                  >{s}</button>
                ))}
              </div>
            </>
          )}

          {msg.type === 'text' && <p style={{ margin: 0 }}>{msg.text}</p>}
          {msg.type === 'error' && <p style={{ margin: 0 }}>⚠️ {msg.text}</p>}

          {msg.type === 'recommendations' && (
            <>
              <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>
                Voici mes suggestions pour vous :
              </p>
              {msg.recommendations.map((cat, idx) => (
                <div key={idx} style={{ marginBottom: idx < msg.recommendations.length - 1 ? 16 : 0 }}>
                  <div style={{
                    borderLeft: '3px solid #4a5d23', paddingLeft: 10, marginBottom: 10
                  }}>
                    <div style={{ fontWeight: 700, color: '#4a5d23', fontSize: '0.88rem' }}>{cat.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{cat.advice}</div>
                  </div>

                  {cat.products?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {cat.products.map(p => (
                        <div key={p._id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 12,
                          background: '#f9fafb', border: '1px solid #f3f4f6',
                          transition: 'background 0.15s'
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f0f5e8'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; }}
                        >
                          <div style={{
                            width: 42, height: 42, borderRadius: 8,
                            overflow: 'hidden', flexShrink: 0, background: '#e5e7eb'
                          }}>
                            {p.mainImage ? (
                              <img src={p.mainImage} alt={p.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{
                                width: '100%', height: '100%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', color: '#9ca3af'
                              }}>N/A</div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.82rem', fontWeight: 600,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>{p.name}</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4a5d23' }}>
                              {p.price} {p.priceUnit}
                            </div>
                          </div>
                          <Link
                            to={`/dashboard/catalog/${p._id}`}
                            target="_blank"
                            style={{
                              flexShrink: 0, padding: '4px 10px', borderRadius: 8,
                              fontSize: '0.72rem', fontWeight: 600,
                              background: '#4a5d23', color: '#fff', textDecoration: 'none',
                              transition: 'opacity 0.15s'
                            }}
                            onMouseEnter={e => { e.target.style.opacity = '0.85'; }}
                            onMouseLeave={e => { e.target.style.opacity = '1'; }}
                          >Voir</Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  /* ─── Main render ─── */
  return (
    <>
      {/* ━━━ Floating Action Button ━━━ */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 100, right: 32, zIndex: 9999,
            width: 60, height: 60, borderRadius: 18,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#4a5d23',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          title="Assistant BatiBot IA"
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.06)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(74,93,35,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
          }}
        >
          {/* AI Sparkle icon SVG */}
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>
      )}

      {/* ━━━ Chat Window ━━━ */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 168, right: 32, zIndex: 9998,
          width: 'min(420px, calc(100vw - 48px))',
          height: 'min(650px, calc(100vh - 210px))',
          maxHeight: 'calc(100vh - 200px)',
          borderRadius: 24, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          background: '#fff',
          boxShadow: '0 12px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          animation: 'batibotSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg,#3d4e1c,#4a5d23)',
            padding: '14px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px', color: '#fff'
              }}>BB</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>BatiBot</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)'
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#4ade80',
                    display: 'inline-block'
                  }} />
                  En ligne
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: 'rgba(255,255,255,0.12)', border: 'none',
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            >&times;</button>
          </div>

          {/* ── Messages ── */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '20px 14px',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            {messages.map(renderMessage)}
            {loading && <TypingBubble />}
            <div ref={endRef} />
          </div>

          {/* ── Input bar ── */}
          <div style={{
            padding: '10px 12px', background: '#fff',
            borderTop: '1px solid #e5e7eb',
            display: 'flex', gap: 8, alignItems: 'center'
          }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Décrivez votre projet..."
              value={need}
              onChange={e => setNeed(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRecommend(); }}
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: '#f4f5f0', borderRadius: 24,
                padding: '12px 18px', fontSize: '0.9rem',
                color: '#1f2937'
              }}
            />
            <button
              onClick={handleRecommend}
              disabled={loading || !need.trim()}
              style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none',
                background: (loading || !need.trim()) ? '#d1d5db' : 'linear-gradient(135deg,#4a5d23,#6b8c3e)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (loading || !need.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AiProductRecommender;
