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

function normalizeApiBaseUrl(rawBase) {
  const cleaned = String(rawBase || 'http://localhost:5000/api').replace(/\/$/, '');
  return /\/api$/i.test(cleaned) ? cleaned : `${cleaned}/api`;
}

function buildSmartFallbackReply(userText, recommendations) {
  const t = String(userText || '').trim();
  const recCount = Array.isArray(recommendations)
    ? recommendations.reduce((acc, c) => acc + (Array.isArray(c?.products) ? c.products.length : 0), 0)
    : 0;

  if (recCount > 0) {
    return `Fhemt 3lik. Bch na3tik des recommandations selon "${t}" w tnajem t7el kol produit mel catalogue.`;
  }
  return `Fhemt 3lik. Tawa n9allblek 3la a7sen produits men el catalogue selon "${t}".`;
}

function buildRecommendationQueries(input) {
  const raw = String(input || '').trim();
  if (!raw) return [];

  const normalized = raw.toLowerCase();
  const variants = [raw];

  // Cross-language normalization for common construction intents.
  if (/(painting walls|paint walls|wall paint|paint)/i.test(normalized)) {
    variants.push('peinture murale');
    variants.push('nheb peinture lel 7it');
    variants.push('matériel peinture murs');
  }
  if (/(kitchen|cuisine|koujina)/i.test(normalized)) {
    variants.push('materiel cuisine');
    variants.push('plomberie cuisine');
  }
  if (/(bathroom|salle de bain|toilet|toilette|7ammem|hammem)/i.test(normalized)) {
    variants.push('materiel salle de bain');
    variants.push('carrelage salle de bain');
  }
  if (/(cheap|pas cher|arkhes|arkhess|budget)/i.test(normalized)) {
    variants.push('materiaux pas chers');
    variants.push('matériel budget');
  }

  // Generic safe fallback to avoid empty result on very broad phrasing.
  variants.push(`materiel construction ${raw}`);
  return Array.from(new Set(variants.map((v) => v.trim()).filter(Boolean)));
}

function inferCategoryHints(input) {
  const t = String(input || '').toLowerCase();
  if (/(paint|painting|peinture|mur|walls?)/i.test(t)) return ['peinture', 'autre'];
  if (/(bathroom|salle de bain|toilet|toilette|wc|douche|7ammem|hammem)/i.test(t)) return ['plomberie', 'carrelage', 'verre'];
  if (/(kitchen|cuisine|koujina)/i.test(t)) return ['plomberie', 'carrelage', 'électricité', 'bois'];
  if (/(terrasse|jardin|jnina|exterieur)/i.test(t)) return ['ciment', 'sable', 'brique', 'acier'];
  return [];
}

function toRecommendationPayload(products, originalText) {
  const grouped = {};
  for (const p of products || []) {
    const cat = p?.category || 'autre';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({
      ...p,
      id: p?._id || p?.id,
      mainImage: p?.media?.[0]?.url || p?.mainImage || '',
    });
  }
  return Object.entries(grouped).map(([cat, items]) => ({
    title: cat.charAt(0).toUpperCase() + cat.slice(1),
    advice: `Sélection basée sur "${originalText}"`,
    products: items.slice(0, 6),
  }));
}

function extractAllProducts(recommendations) {
  const arr = [];
  for (const section of recommendations || []) {
    for (const p of section?.products || []) arr.push(p);
  }
  return arr;
}

export default function BatiBot2Chat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [catalogFallbackProducts, setCatalogFallbackProducts] = useState([]);
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
    const preloadCatalog = async () => {
      try {
        const apiBase = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${apiBase}/products?isAvailable=false&limit=60`, { method: 'GET', headers });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.success && Array.isArray(json?.products) && json.products.length > 0) {
          setCatalogFallbackProducts(json.products);
        }
      } catch {
        // Keep empty and let normal chat flow retry.
      }
    };
    preloadCatalog();
  }, []);

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
        .filter((m, i) => !(i === 0 && m.from === 'bot'))
        .filter((m) => typeof m?.text === 'string' && m.text.trim())
        .map((m) => ({
          role: m.from === 'bot' ? 'model' : 'user',
          parts: [{ text: m.text }],
        }));

      const apiBase = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let recommendationPayload = [];
      const queryVariants = buildRecommendationQueries(text);

      for (const needVariant of queryVariants) {
        try {
          const recRes = await fetch(`${apiBase}/ai/recommend`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ need: needVariant }),
          });
          const recData = await recRes.json().catch(() => ({}));
          if (recRes.ok && recData?.success && Array.isArray(recData?.data) && recData.data.length > 0) {
            recommendationPayload = recData.data;
            break;
          }
        } catch {
          // Try next variant
        }
      }

      // Strong fallback: direct product search from DB-backed /products endpoint.
      if (recommendationPayload.length === 0) {
        const categoryHints = inferCategoryHints(text);
        for (const q of queryVariants) {
          try {
            const productsRes = await fetch(`${apiBase}/products?search=${encodeURIComponent(q)}&isAvailable=false&limit=18`, {
              method: 'GET',
              headers,
            });
            const productsJson = await productsRes.json().catch(() => ({}));
            if (productsRes.ok && productsJson?.success && Array.isArray(productsJson?.products)) {
              let products = productsJson.products;
              if (categoryHints.length) {
                const filtered = products.filter((p) => categoryHints.includes(p?.category));
                if (filtered.length > 0) products = filtered;
              }
              if (products.length > 0) {
                recommendationPayload = toRecommendationPayload(products, text);
                break;
              }
            }
          } catch {
            // Continue trying other variants
          }
        }
      }

      // Last-resort fallback: fetch available catalog products without search
      // and prioritize inferred categories so BatiBot2 always returns something useful.
      if (recommendationPayload.length === 0) {
        try {
          const categoryHints = inferCategoryHints(text);
          const res = await fetch(`${apiBase}/products?isAvailable=false&limit=40`, {
            method: 'GET',
            headers,
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json?.success && Array.isArray(json?.products) && json.products.length > 0) {
            let products = json.products;
            if (categoryHints.length) {
              const hinted = products.filter((p) => categoryHints.includes(p?.category));
              if (hinted.length > 0) {
                products = hinted;
              }
            }
            setCatalogFallbackProducts(json.products);
            recommendationPayload = toRecommendationPayload(products.slice(0, 18), text);
          }
        } catch {
          // Ignore and keep empty payload if catalog fallback fails
        }
      }

      // Very last fallback: fetch from catalog without isAvailable filter
      // because some databases keep products without this flag set.
      if (recommendationPayload.length === 0) {
        try {
          const categoryHints = inferCategoryHints(text);
          const res = await fetch(`${apiBase}/products?isAvailable=false&limit=60`, {
            method: 'GET',
            headers,
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json?.success && Array.isArray(json?.products) && json.products.length > 0) {
            let products = json.products;
            if (categoryHints.length) {
              const hinted = products.filter((p) => categoryHints.includes(p?.category));
              if (hinted.length > 0) products = hinted;
            }
            setCatalogFallbackProducts(json.products);
            recommendationPayload = toRecommendationPayload(products.slice(0, 18), text);
          }
        } catch {
          // Keep empty if this also fails
        }
      }

      // Hard guarantee: always render product cards if we already have
      // any catalog snapshot from previous successful fetches.
      if (recommendationPayload.length === 0 && catalogFallbackProducts.length > 0) {
        const categoryHints = inferCategoryHints(text);
        let products = catalogFallbackProducts;
        if (categoryHints.length) {
          const hinted = products.filter((p) => categoryHints.includes(p?.category));
          if (hinted.length > 0) products = hinted;
        }
        recommendationPayload = toRecommendationPayload(products.slice(0, 18), text);
      }

      // Restore smart conversational answer via Gemini backend.
      let replyText = '';
      try {
        const chatRes = await fetch(`${apiBase}/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: apiMessages }),
        });
        const chatData = await chatRes.json().catch(() => ({}));
        if (chatRes.ok) {
          replyText = cleanBotText(chatData?.reply || '');
        }
      } catch {
        // Keep fallback below
      }

      const fallbackReply = buildSmartFallbackReply(text, recommendationPayload);
      const fallbackProducts = extractAllProducts(recommendationPayload).slice(0, 3);
      const productHint = fallbackProducts.length
        ? ` Exemples: ${fallbackProducts.map((p) => p?.name).filter(Boolean).join(', ')}.`
        : '';
      const finalReply = replyText || cleanBotText(`${fallbackReply}${productHint}`);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', type: 'text', text: finalReply, time: new Date() },
      ]);

      let finalPayload = recommendationPayload.length > 0
        ? recommendationPayload
        : toRecommendationPayload(catalogFallbackProducts.slice(0, 18), text);

      // If still empty (e.g. preload not finished), force a fresh fetch now.
      if (!Array.isArray(finalPayload) || finalPayload.length === 0) {
        try {
          const res = await fetch(`${apiBase}/products?isAvailable=false&limit=60`, {
            method: 'GET',
            headers,
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json?.success && Array.isArray(json?.products) && json.products.length > 0) {
            setCatalogFallbackProducts(json.products);
            finalPayload = toRecommendationPayload(json.products.slice(0, 18), text);
          }
        } catch {
          // Keep payload as-is and let UI fallback below.
        }
      }

      const hasRenderableProducts = Array.isArray(finalPayload)
        && finalPayload.some((cat) => Array.isArray(cat?.products) && cat.products.length > 0);

      if (hasRenderableProducts) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            from: 'bot',
            type: 'recommendations',
            recommendations: finalPayload,
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
            text: 'Catalogue vide pour le moment. Zid seed lel products w jarreb marra okhra.',
            time: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          type: 'text',
          text: 'Saret mochkel fel connexion taw, n3awed n7awel automatiquement.',
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
        style={{ position: 'fixed', bottom: 100, right: 32, zIndex: 9999, width: 60, height: 60, borderRadius: 18, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', color: '#4a5d23', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        {open ? <span style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1 }}>×</span> : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="BatiBot2 chat" style={{ position: 'fixed', bottom: 168, right: 32, zIndex: 9998, width: 'min(420px, calc(100vw - 48px))', height: 'min(650px, calc(100vh - 210px))', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', boxShadow: '0 12px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)' }}>
          <div style={{ background: 'linear-gradient(135deg,#3d4e1c,#4a5d23)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', fontWeight: 700 }}>
            <span>BatiBot2</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={clearChat} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>New</button>
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
                <div style={{ maxWidth: '82%', borderRadius: msg.from === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px', padding: '10px 12px', background: msg.from === 'user' ? 'linear-gradient(135deg,#4a5d23,#8b5a2b)' : '#fff', color: msg.from === 'user' ? '#fff' : '#111827', border: msg.from === 'user' ? 'none' : '1px solid #e5e7eb', whiteSpace: 'pre-wrap', lineHeight: 1.45, fontSize: '0.9rem' }}>
                  {msg.type === 'recommendations' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <strong>Voici des produits recommandés :</strong>
                      {msg.recommendations?.map((cat, idx) => (
                        <div key={`${cat.title}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontWeight: 700, color: '#4a5d23' }}>{cat.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{cat.advice}</div>
                          {cat.products?.map((p) => (
                            <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}>
                              <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                                {p.mainImage ? <img src={p.mainImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>{p.category || 'catalogue'}</div>
                                <div style={{ fontSize: '0.78rem', color: '#4a5d23', fontWeight: 700 }}>{p.price} {p.priceUnit}</div>
                              </div>
                              <Link to={`/dashboard/catalog/${p._id}`} target="_blank" style={{ flexShrink: 0, borderRadius: 8, padding: '5px 9px', background: '#4a5d23', color: '#fff', textDecoration: 'none', fontSize: '0.72rem', fontWeight: 700 }}>Voir</Link>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : msg.text}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{fmt(msg.time)}</span>
              </div>
            ))}
            {typing && <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>BatiBot2 yjewbek...</div>}
            <div ref={bottomRef} />
          </div>

          {showSuggestions && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => sendMessage(s)} style={{ border: '1px solid rgba(74,93,35,0.25)', background: 'rgba(74,93,35,0.06)', borderRadius: 999, padding: '5px 10px', color: '#4a5d23', fontSize: '0.78rem', cursor: 'pointer' }}>{s}</button>
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
              style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 12px', fontSize: '0.9rem' }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim()} style={{ border: 'none', borderRadius: 10, padding: '0 14px', background: input.trim() ? 'linear-gradient(135deg,#4a5d23,#8b5a2b)' : '#d1d5db', color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed', fontWeight: 700 }}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
