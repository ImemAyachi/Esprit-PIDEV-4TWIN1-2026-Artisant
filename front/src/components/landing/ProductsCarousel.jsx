import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './ProductsCarousel.css';

// ── Couleurs par catégorie ─────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  marbre: { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#c084fc', icon: '🪨' },
  granit: { bg: 'rgba(107,114,128,0.15)', border: '#6b7280', text: '#9ca3af', icon: '⛰️' },
  ciment: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24', icon: '🏗️' },
  sable: { bg: 'rgba(234,179,8,0.15)', border: '#eab308', text: '#facc15', icon: '🏖️' },
  carrelage: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#60a5fa', icon: '🔷' },
  brique: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#f87171', icon: '🧱' },
  bois: { bg: 'rgba(180,83,9,0.15)', border: '#b45309', text: '#d97706', icon: '🪵' },
  acier: { bg: 'rgba(100,116,139,0.15)', border: '#64748b', text: '#94a3b8', icon: '⚙️' },
  verre: { bg: 'rgba(6,182,212,0.15)', border: '#06b6d4', text: '#22d3ee', icon: '🔹' },
  peinture: { bg: 'rgba(236,72,153,0.15)', border: '#ec4899', text: '#f472b6', icon: '🎨' },
  plomberie: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#34d399', icon: '🔧' },
  électricité: { bg: 'rgba(250,204,21,0.15)', border: '#facc15', text: '#fde047', icon: '⚡' },
  autre: { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#818cf8', icon: '📦' },
};

const getCat = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS.autre;

// ── Stars ──────────────────────────────────────────────────────────────────────
const Stars = ({ avg = 0 }) => (
  <div className="pc-stars">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(avg) ? 'pc-star filled' : 'pc-star'}>★</span>
    ))}
    <span className="pc-rating-num">{avg.toFixed(1)}</span>
  </div>
);

// ── Card individuelle ──────────────────────────────────────────────────────────
const ProductCard = ({ product }) => {
  const cat = getCat(product.category);
  const img = product.media?.find((m) => m.type === 'image')?.url;

  return (
    <div className="pc-card">
      {/* Glow ring */}
      <div className="pc-card-glow" style={{ '--glow-color': cat.border }} />

      {/* Image */}
      <div className="pc-img-wrap">
        {img ? (
          <img src={img} alt={product.name} className="pc-img" loading="lazy" />
        ) : (
          <div className="pc-img-placeholder">
            <span style={{ fontSize: '3rem' }}>{cat.icon}</span>
          </div>
        )}
        {/* Category badge */}
        <div
          className="pc-badge"
          style={{ background: cat.bg, borderColor: cat.border, color: cat.text }}
        >
          {cat.icon} {product.category}
        </div>
        {/* Availability dot */}
        {product.isAvailable && <div className="pc-available-dot" />}
      </div>

      {/* Content */}
      <div className="pc-content">
        <h3 className="pc-name" title={product.name}>{product.name}</h3>
        <p className="pc-desc">{product.description}</p>

        {/* Stars */}
        {product.rating?.count > 0 && (
          <Stars avg={product.rating.average} />
        )}

        {/* Specs preview */}
        {product.specifications?.length > 0 && (
          <div className="pc-specs">
            {product.specifications.slice(0, 2).map((sp) => (
              <div key={sp.key} className="pc-spec-item">
                <span className="pc-spec-key">{sp.key}</span>
                <span className="pc-spec-val">{sp.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pc-footer">
          <div className="pc-price">
            <span className="pc-price-amount">{product.price.toLocaleString('fr-TN')}</span>
            <span className="pc-price-unit"> {product.priceUnit}/{product.unit}</span>
          </div>
        </div>

        {/* Stock */}
        <div className="pc-stock">
          <span className="pc-stock-dot" />
          {product.stock?.quantity ?? 0} en stock · Min. {product.stock?.minOrderQty ?? 1} {product.unit}
        </div>
      </div>
    </div>
  );
};

// ── Skeleton loader ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="pc-card pc-skeleton">
    <div className="pc-sk-img" />
    <div className="pc-content">
      <div className="pc-sk-line" style={{ width: '80%', height: '18px' }} />
      <div className="pc-sk-line" style={{ width: '100%', height: '12px', marginTop: '8px' }} />
      <div className="pc-sk-line" style={{ width: '60%', height: '12px', marginTop: '4px' }} />
      <div className="pc-sk-line" style={{ width: '40%', height: '22px', marginTop: '16px' }} />
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const ProductsCarousel = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);
  const intervalRef = useRef(null);

  // Fetch products
  useEffect(() => {
    api.get('/products?limit=10&isAvailable=true')
      .then((res) => {
        // The API returns { success: true, products: [...] }
        const data = res.data?.products ?? res.data?.data ?? res.data ?? [];
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const total = products.length;
  const VISIBLE = 3; // cards visibles simultanément
  const maxActive = Math.max(0, total - VISIBLE);

  const next = useCallback(() => setActive((a) => Math.min(a + 1, maxActive)), [maxActive]);
  const prev = useCallback(() => setActive((a) => Math.max(a - 1, 0)), []);

  // Auto-play
  useEffect(() => {
    if (paused || total === 0) return;
    intervalRef.current = setInterval(() => {
      setActive((a) => (a >= maxActive ? 0 : a + 1));
    }, 3500);
    return () => clearInterval(intervalRef.current);
  }, [paused, total, maxActive]);

  // Scroll track
  useEffect(() => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.children[0]?.offsetWidth ?? 320;
    const gap = 24;
    trackRef.current.style.transform = `translateX(-${active * (cardWidth + gap)}px)`;
  }, [active]);

  return (
    <section className="pc-section">
      {/* Header */}
      <div className="pc-header">
        <h2 className="pc-title">
          Catalogue <span className="gradient-text">Matériaux</span> de Construction
        </h2>
        <p className="pc-subtitle">
          Découvrez notre sélection de matériaux premium — qualité certifiée, livraison rapide en Tunisie.
        </p>
      </div>

      {/* Carousel */}
      <div
        className="pc-viewport"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left fade */}
        <div className="pc-fade pc-fade-left" />

        {loading ? (
          <div className="pc-track">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="pc-empty">Aucun produit disponible pour le moment.</div>
        ) : (
          <div className="pc-track" ref={trackRef}>
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}

        {/* Right fade */}
        <div className="pc-fade pc-fade-right" />
      </div>

      {/* Controls */}
      {!loading && products.length > 0 && (
        <div className="pc-controls">
          <button
            className="pc-arrow"
            onClick={prev}
            disabled={active === 0}
            aria-label="Précédent"
          >‹</button>

          {/* Dots */}
          <div className="pc-dots">
            {products.map((_, i) => (
              <button
                key={i}
                className={`pc-dot ${i === active ? 'active' : ''}`}
                onClick={() => setActive(Math.min(i, maxActive))}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="pc-arrow"
            onClick={next}
            disabled={active >= maxActive}
            aria-label="Suivant"
          >›</button>
        </div>
      )}
    </section>
  );
};

export default ProductsCarousel;
