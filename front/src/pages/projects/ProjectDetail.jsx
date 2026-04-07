import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

const CAT_ICON = { matériaux: '', main_d_oeuvre: '', outillage: '', transport: '', autre: '' };

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExpense, setShowExpense] = useState(false);
  const [expense, setExpense] = useState({ description: '', amount: '', category: 'matériaux' });
  const [confirmConfig, setConfirmConfig] = useState(null);

  const load = async () => { try { const r = await api.get(`/projects/${id}`); setProject(r.data.project); } catch (_) { }; setLoading(false); };
  useEffect(() => { load(); }, [id]);

  const handleAddExpense = async () => {
    try { await api.post(`/projects/${id}/expenses`, expense); setShowExpense(false); setExpense({ description: '', amount: '', category: 'matériaux' }); load(); } catch (_) { }
  };

  const handleDelExpense = (expId) => {
    setConfirmConfig({
      type: 'danger',
      title: 'Supprimer cette dépense ?',
      message: 'Cette dépense sera définitivement supprimée du projet.',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try { await api.delete(`/projects/${id}/expenses/${expId}`); toast.success('Dépense supprimée'); load(); } catch (_) { toast.error('Erreur'); }
      }
    });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!project) return <div style={{ padding: '2rem', color: 'var(--clr-text-muted)' }}>Projet introuvable</div>;

  const { financials, expenses = [] } = project;
  const profit = financials?.profit || 0;
  const margin = financials?.profitMargin || 0;
  
  const isArtisan = user?.role === 'Artisan';
  
  const personalExpenses = isArtisan 
    ? expenses.filter(e => e.addedBy?._id === user._id || e.addedBy === user._id)
    : expenses;

  const myContractAmount = isArtisan 
    ? (project.artisans?.find(a => a.artisan?._id === user._id || a.artisan === user._id)?.totalAmount || 0)
    : project.budget;

  // Fusionner les dépenses manuelles et les contrats artisans acceptés pour l'affichage
  const artisanContractExpenses = (project.artisans || [])
    .filter(a => a.status === 'accepted')
    .map(a => ({
      _id: `art-${a.artisan?._id || a.artisan}`,
      description: `Contrat : ${a.artisan?.firstName} ${a.artisan?.lastName}`,
      amount: a.totalAmount,
      category: 'main_d_oeuvre',
      isContract: true,
      date: project.createdAt // Date par défaut
    }));

  const allExpenses = [...expenses, ...artisanContractExpenses].sort((a,b) => new Date(b.date) - new Date(a.date));

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
  const catData = Object.entries(
    allExpenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  if (isArtisan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ width: 'fit-content' }}>Retour</button>


        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: 'var(--clr-primary)' }}>{project.title}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Lieu / Place</div>
              <div style={{ fontSize: '1.1rem' }}>{project.location?.city || project.location?.address || 'Non spécifié'}</div>
            </div>

            <div style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Description du projet</div>
              <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>{project.description || 'Pas de description'}</div>
            </div>

            <div style={{ background: 'var(--clr-surface2)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Montant de mon devis (Accepté)</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--clr-success)' }}>
                {myContractAmount.toLocaleString()} DT
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '1rem', alignSelf: 'flex-start' }}
              onClick={() => setShowExpense(true)}
            >
              + Enregistrer une dépense sur ce chantier
            </button>
          </div>
        </div>

        {personalExpenses.length > 0 && (
          <div className="card">
             <h3>Mes dépenses sur ce projet</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {personalExpenses.map((exp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--clr-surface2)', borderRadius: 'var(--radius-sm)' }}>
                    <span>{exp.description}</span>
                    <span style={{ fontWeight: 700 }}>{exp.amount} DT</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {showExpense && (
          <div className="modal-overlay" onClick={() => setShowExpense(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">Ajouter une dépense</div>
                <button className="btn-ghost" onClick={() => setShowExpense(false)}>X</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Description (ex: Transport, Vis...)</label>
                  <input className="form-input" value={expense.description} onChange={e => setExpense({...expense, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Montant (DT)</label>
                  <input className="form-input" type="number" value={expense.amount} onChange={e => setExpense({...expense, amount: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowExpense(false)}>Annuler</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddExpense}>Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ width: 'fit-content' }}>Retour</button>


      <div className="card">
        <h2 style={{ marginBottom: '0.5rem' }}>{project.title}</h2>
        {project.location?.city && <p style={{ color: 'var(--clr-text-muted)' }}>Lieu:  {project.location.city}</p>}
        {project.description && <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.75rem', lineHeight: 1.7, fontSize: '0.95rem' }}>{project.description}</p>}
      </div>

      <div className="stats-grid">
        {[
          { label: 'Budget', value: `${(project.budget || 0).toLocaleString()} DT`, icon: '', color: '#3b82f6' },
          { label: 'Dépenses', value: `${(financials?.totalExpenses || 0).toLocaleString()} DT`, icon: '', color: '#f59e0b' },
          { label: 'Bénéfice', value: `${profit.toLocaleString()} DT`, icon: '', color: profit >= 0 ? '#10b981' : '#ef4444' },
        ].map(s => (

          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <h3> Indicateur de rentabilité</h3>
        <div className={`profit-pill ${profit >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.25rem', padding: '0.75rem 1.5rem' }}>
          {profit >= 0 ? 'Rentable' : 'Déficitaire'} — Marge : {margin}%
        </div>
        {catData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v.toLocaleString()} DT`]} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3> Dépenses</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpense(true)}>+ Ajouter</button>
        </div>
        {allExpenses.length === 0 ? (
          <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '2rem' }}>Aucune dépense enregistrée</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {allExpenses.map(e => (
              <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: e.isContract ? 'rgba(74,93,35,0.05)' : 'var(--clr-surface2)', border: e.isContract ? '1px dashed var(--clr-primary)' : '1px solid transparent', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                    {/* Emojis removed */}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.description}</div>
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.78rem' }}>{e.category} • {new Date(e.date).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--clr-danger)' }}>{e.amount.toLocaleString()} DT</span>
                  {!e.isContract && (
                    <button className="btn-ghost" style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }} onClick={() => handleDelExpense(e._id)}>Supprimer</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {project.artisans?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}> Équipe</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {project.artisans.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--clr-surface2)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                  {a.artisan?.firstName?.[0]}{a.artisan?.lastName?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600 }}>{a.artisan?.firstName} {a.artisan?.lastName}</span>
                  {a.artisan?.craft && <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}> • {a.artisan.craft}</span>}
                </div>
                <span className={`badge ${a.status === 'accepted' ? 'badge-success' : a.status === 'rejected' ? 'badge-danger' : 'badge-info'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExpense && (
        <div className="modal-overlay" onClick={() => setShowExpense(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">+ Ajouter une dépense</div>
              <button className="btn-ghost" onClick={() => setShowExpense(false)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Description *</label><input className="form-input" placeholder="Ex: Achat de ciment 50 sacs" value={expense.description} onChange={e => setExpense(x => ({ ...x, description: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Montant (DT) *</label><input className="form-input" type="number" min="0" value={expense.amount} onChange={e => setExpense(x => ({ ...x, amount: e.target.value }))} /></div>
              <div className="form-group">
                <label className="form-label">Catégorie</label>
                <select className="form-input form-select" value={expense.category} onChange={e => setExpense(x => ({ ...x, category: e.target.value }))}>
                  {['matériaux', 'main_d_oeuvre', 'outillage', 'transport', 'autre'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowExpense(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddExpense} disabled={!expense.description || !expense.amount}>Ajouter</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
    </div>
  );
};

export default ProjectDetail;
