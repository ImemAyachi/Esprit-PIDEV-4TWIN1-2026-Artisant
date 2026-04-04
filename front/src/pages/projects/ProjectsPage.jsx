import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const ProjectsPage = () => {
  const { user } = useSelector((s) => s.auth);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: { city: '' }, budget: '' });

  const load = async () => { try { const r = await api.get('/projects'); setProjects(r.data.projects); } catch (_) {}; setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try { await api.post('/projects', form); setShowCreate(false); load(); } catch (_) {}
  };

  const STATUS_LABEL = { draft: 'Brouillon', open: 'Ouvert', in_progress: 'En cours', completed: 'Terminé', cancelled: 'Annulé' };
  const STATUS_CLASS = { draft: 'badge-muted', open: 'badge-info', in_progress: 'badge-primary', completed: 'badge-success', cancelled: 'badge-danger' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2> Mes chantiers</h2>
        {['Ingenieur', 'Architecte'].includes(user?.role) && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Nouveau chantier</button>
        )}
      </div>

      {loading ? (
        <div className="grid-auto">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />)}</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
          <div>Aucun chantier</div>
        </div>
      ) : (
        <div className="grid-auto">
          {projects.map(p => {
            const isArtisan = user?.role === 'Artisan';
            const myContract = isArtisan 
              ? p.artisans?.find(a => a.artisan?._id === user._id || a.artisan === user._id)?.totalAmount 
              : null;
            const prof = p.financials?.profit || 0;

            return (
              <Link to={`/dashboard/projects/${p._id}`} key={p._id} style={{ textDecoration: 'none' }}>
                <div className="card card-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className={`badge ${STATUS_CLASS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                    {!isArtisan && p.financials?.totalRevenue > 0 && (
                      <span className={`profit-pill ${prof >= 0 ? 'positive' : 'negative'}`}>
                        {prof >= 0 ? 'Bénéfice' : 'Perte'} : {Math.abs(prof).toLocaleString()} DT
                      </span>
                    )}
                    {isArtisan && myContract !== undefined && (
                      <span className="badge badge-success" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        Mon contrat : {myContract.toLocaleString()} DT
                      </span>
                    )}
                  </div>
                  <h3 style={{ marginBottom: '0.5rem' }}>{p.title}</h3>
                  {p.location?.city && <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Lieu: {p.location.city}</div>}
                  <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.description || 'Projet de construction / rénovation'}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-border)', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    {!isArtisan && <span> {p.artisans?.length || 0} artisans</span>}
                    {!isArtisan && p.budget > 0 && <span> Budget : {p.budget.toLocaleString()} DT</span>}
                    {isArtisan && <span>Cliquez pour voir les détails de votre travail</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">+ Nouveau chantier</div>
              <button className="btn-ghost" onClick={() => setShowCreate(false)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Titre *</label><input className="form-input" placeholder="Ex: Construction villa Tunis" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Ville</label><input className="form-input" placeholder="Tunis" value={form.location.city} onChange={e => setForm(f => ({ ...f, location: { city: e.target.value } }))} /></div>
              <div className="form-group"><label className="form-label">Budget (DT)</label><input className="form-input" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={!form.title}>Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
