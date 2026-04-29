import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const SUGGESTIONS = [
  'nhb 3la materiel mta3 koujina',
  'شنو نحتاج باش نركب salle de bain؟',
  'Suggest affordable tools for renovation',
  'What are the best products for painting walls?',
];

function cleanBotText(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function buildSmartFallbackReply(userText, recommendations) {
  const t = String(userText || '').trim();
  const recCount = Array.isArray(recommendations)
    ? recommendations.reduce((acc, c) => acc + (Array.isArray(c?.products) ? c.products.length : 0), 0)
    : 0;

  if (recCount > 0) {
    return `Fhemt 3lik. Bch na3tik des recommandations selon "${t}" w tnajem t7el kol produit mel catalogue.`;
  }
  return `Fhemt 3lik. 3awed a3tini chwaya détails akther 3la "${t}" (budget, catégorie, usage) w n9arrablek choix ahsen.`;
}

export default function BatiBot2Chat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      type: 'text',
      text: "Marhbe bik! Ena BatiBot2.\nNnajjem n3awnek b solutions w produits mta3 el construction.",
      time: new Date(),
    },
  ]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (textArg) => {
    const text = String(textArg || input).trim();
    if (!text) return;

    const userMsg = { id: Date.now(), from: 'user', text, time: new Date() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setTyping(true);
    setShowSuggestions(false);

    try {
      const apiMessages = nextMessages
        // keep only textual turns for chat history
        .filter((m, i) => !(i === 0 && m.from === 'bot'))
        .filter((m) => typeof m?.text === 'string' && m.text.trim())
        .map((m) => ({
          role: m.from === 'bot' ? 'model' : 'user',
          parts: [{ text: m.text }],
        }));

      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [chatRes, recommendRes] = await Promise.allSettled([
        fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: apiMessages }),
        }),
        fetch(`${apiBase}/ai/recommend`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ need: text }),
        }),
      ]);

      let recommendationPayload = [];
      if (recommendRes.status === 'fulfilled') {
        const recRes = recommendRes.value;
        const recData = await recRes.json().catch(() => ({}));
        if (recRes.ok && recData?.success && Array.isArray(recData?.data) && recData.data.length > 0) {
          recommendationPayload = recData.data;
        }
      }

      if (chatRes.status === 'fulfilled') {
        const res = chatRes.value;
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Erreur API');
        const cleanedReply = cleanBotText(data?.reply || buildSmartFallbackReply(text, recommendationPayload));
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, from: 'bot', type: 'text', text: cleanedReply, time: new Date() },
        ]);
      } else {
        const fallbackReply = buildSmartFallbackReply(text, recommendationPayload);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, from: 'bot', type: 'text', text: fallbackReply, time: new Date() },
        ]);
      }

      if (recommendationPayload.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            from: 'bot',
            type: 'recommendations',
            recommendations: recommendationPayload,
            time: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            from: 'bot',
            type: 'text',
            text: "Ma najjamtch njib recommandations taw, 3awed jarrab.",
            time: new Date(),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          type: 'text',
          text: `Saret mochkel fel connexion. Jarrab marra okhra, w aatini details akther (type, budget, usage).`,
          time: new Date(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    setShowSuggestions(true);
    setMessages([
      {
        id: Date.now(),
        from: 'bot',
        type: 'text',
        text: "Marhbe bik! Ena BatiBot2.\nNnajjem n3awnek b solutions w produits mta3 el construction.",
        time: new Date(),
      },
    ]);
  };

  const fmt = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="BatiBot2"
        aria-label="Ouvrir BatiBot2"
        style={{
          position: 'fixed',
          bottom: 100,
          right: 32,
          zIndex: 9999,
          width: 60,
          height: 60,
          borderRadius: 18,
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          color: '#4a5d23',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {open ? (
          <span style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1 }}>×</span>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="BatiBot2 chat"
          style={{
            position: 'fixed',
            bottom: 168,
            right: 32,
            zIndex: 9998,
            width: 'min(420px, calc(100vw - 48px))',
            height: 'min(650px, calc(100vh - 210px))',
            borderRadius: 24,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            boxShadow: '0 12px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg,#3d4e1c,#4a5d23)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            <span>BatiBot2</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={clearChat}
                style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
              >
                New
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer BatiBot2"
                title="Close"
                style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '82%',
                    borderRadius: msg.from === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    padding: '10px 12px',
                    background: msg.from === 'user' ? 'linear-gradient(135deg,#4a5d23,#8b5a2b)' : '#fff',
                    color: msg.from === 'user' ? '#fff' : '#111827',
                    border: msg.from === 'user' ? 'none' : '1px solid #e5e7eb',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.45,
                    fontSize: '0.9rem',
                  }}
                >
                  {msg.type === 'recommendations' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <strong>Voici des produits recommandés :</strong>
                      {msg.recommendations?.map((cat, idx) => (
                        <div key={`${cat.title}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontWeight: 700, color: '#4a5d23' }}>{cat.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{cat.advice}</div>
                          {cat.products?.map((p) => (
                            <div
                              key={p._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '7px 8px',
                                borderRadius: 10,
                                border: '1px solid #e5e7eb',
                                background: '#fff',
                              }}
                            >
                              <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                                {p.mainImage ? (
                                  <img src={p.mainImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : null}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
                                  {p.category || 'catalogue'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#4a5d23', fontWeight: 700 }}>
                                  {p.price} {p.priceUnit}
                                </div>
                              </div>
                              <Link
                                to={`/dashboard/catalog/${p._id}`}
                                target="_blank"
                                style={{
                                  flexShrink: 0,
                                  borderRadius: 8,
                                  padding: '5px 9px',
                                  background: '#4a5d23',
                                  color: '#fff',
                                  textDecoration: 'none',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                Voir
                              </Link>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{fmt(msg.time)}</span>
              </div>
            ))}

            {typing && (
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>BatiBot2 yjewbek...</div>
            )}
            <div ref={bottomRef} />
          </div>

          {showSuggestions && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    style={{
                      border: '1px solid rgba(74,93,35,0.25)',
                      background: 'rgba(74,93,35,0.06)',
                      borderRadius: 999,
                      padding: '5px 10px',
                      color: '#4a5d23',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e5e7eb', background: '#fff' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ekteb chnoua t7eb..."
              style={{
                flex: 1,
                border: '1px solid #d1d5db',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: '0.9rem',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              style={{
                border: 'none',
                borderRadius: 10,
                padding: '0 14px',
                background: input.trim() ? 'linear-gradient(135deg,#4a5d23,#8b5a2b)' : '#d1d5db',
                color: '#fff',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 700,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
