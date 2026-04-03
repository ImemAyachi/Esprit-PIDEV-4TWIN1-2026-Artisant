import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const CRAFTS = ['', 'maçon', 'plombier', 'électricien', 'peintre', 'carreleur', 'menuisier', 'autre'];

const ArtisansPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [artisans, setArtisans] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({ craft: '', city: '', search: '' });
  const [pagination, setPagination] = useState({ total: 0 });
  const [showQuoteModal, setShowQuoteModal] = useState(null); // artisan sélectionné

  const load = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/users/artisans', { params });
      setArtisans(res.data.artisans);
      setPagination(res.data.pagination);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const StarRating = ({ value }) => (
    <div className="stars" style={{ fontSize: '0.75rem' }}>
      {[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= Math.round(value || 0) ? 'var(--clr-primary)' : 'var(--clr-surface3)' }}>★</span>)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2>🔨 Trouver un artisan</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>{pagination.total} artisans vérifiés</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="Nom de l'artisan..." style={{ flex: 1, minWidth: 200 }} value={filters.search} onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))} />
          <select className="form-input form-select" style={{ width: 160 }} value={filters.craft} onChange={(e) => setFilters(f => ({ ...f, craft: e.target.value }))}>
            {CRAFTS.map(c => <option key={c} value={c}>{c || 'Tous les métiers'}</option>)}
          </select>
          <input className="form-input" placeholder="Ville..." style={{ width: 140 }} value={filters.city} onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))} />
        </div>
      </div>

      {/* Craft chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {CRAFTS.filter(Boolean).map(c => (
          <button key={c} className="btn btn-sm" style={{
            background: filters.craft === c ? 'rgba(245,158,11,0.15)' : 'var(--clr-surface2)',
            border: `1px solid ${filters.craft === c ? 'rgba(245,158,11,0.4)' : 'var(--clr-border)'}`,
            color: filters.craft === c ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
          }} onClick={() => setFilters(f => ({ ...f, craft: f.craft === c ? '' : c }))}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Artisan cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : artisans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔨</div>
          <div>Aucun artisan trouvé</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {artisans.map((a) => (
            <div key={a._id} className="artisan-card">
              <div className="artisan-avatar">
                {a.avatar ? <img src={a.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} /> : `${a.firstName?.[0]}${a.lastName?.[0]}`}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{a.firstName} {a.lastName}</div>
                    <span className="badge badge-primary" style={{ marginTop: '0.25rem' }}>
                      {a.craft?.charAt(0).toUpperCase() + a.craft?.slice(1)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StarRating value={a.rating?.average} />
                    <span style={{ fontWeight: 700 }}>{a.rating?.average?.toFixed(1) || '—'}</span>
                    <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>({a.rating?.count || 0})</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                  {a.location?.city && <span>📍 {a.location.city}</span>}
                  {a.experience && <span>🏆 {a.experience} ans d'expérience</span>}
                </div>
              </div>
              {['Architecte', 'Ingenieur'].includes(user?.role) && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0, alignSelf: 'flex-start' }}
                  onClick={() => setShowQuoteModal(a)}
                >
                  📋 Demande de devis
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Quote Modal */}
      {showQuoteModal && (
        <QuoteModal artisan={showQuoteModal} onClose={() => setShowQuoteModal(null)} />
      )}
    </div>
  );
};

const QuoteModal = ({ artisan, onClose }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', location: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title || !form.description) return;
    setLoading(true);
    try {
      await api.post('/quotes', { artisanId: artisan._id, ...form });
      onClose();
      navigate('/dashboard/quotes');
    } catch (_) {}
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">📋 Demande de devis</div>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'var(--clr-surface2)', borderRadius: 'var(--radius-md)' }}>
          <strong>{artisan.firstName} {artisan.lastName}</strong> — {artisan.craft}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Titre du projet *</label>
            <input className="form-input" placeholder="Ex: Travaux de plomberie salle de bain" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description des travaux *</label>
            <textarea className="form-input" rows={4} placeholder="Décrivez les travaux à réaliser..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Adresse du chantier</label>
            <input className="form-input" placeholder="Ex: 15 Rue de la République, Tunis" value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading || !form.title || !form.description} onClick={submit}>
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtisansPage;
