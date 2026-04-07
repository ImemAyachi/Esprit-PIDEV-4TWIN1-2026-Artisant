import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyProductsPage = () => {
  const { user } = useSelector((s) => s.auth);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  
  const defaultForm = { name: '', description: '', category: 'marbre', price: '', unit: 'm²', stock: 0, specifications: '', useCases: '', isAvailable: true };
  const [form, setForm] = useState(defaultForm);

  const load = async () => { try { const r = await api.get('/products/my'); setProducts(r.data.products); } catch (_) {}; setLoading(false); };
  useEffect(() => { load(); }, []);

  const openAddModal = () => { setEditId(null); setForm(defaultForm); setFiles([]); setShowModal(true); };
  
  const openEditModal = (p) => {
    setEditId(p._id);
    setForm({
      name: p.name || '', description: p.description || '', category: p.category || 'marbre',
      price: p.price || '', unit: p.unit || 'm²', stock: p.stock?.quantity || 0, isAvailable: p.isAvailable ?? true,
      specifications: p.specifications?.length ? p.specifications.map(s => `${s.key}:${s.value}`).join('\n') : '',
      useCases: p.useCases?.length ? p.useCases.join('\n') : ''
    });
    setFiles([]);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      let mediaUrls = [];
      if (files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('files', f));
        const res = await api.post('/uploads/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (res.data?.urls) mediaUrls = res.data.urls;
      }

      const parsedMedia = mediaUrls.map(url => ({
        type: url.endsWith('.pdf') ? 'pdf' : 'image',
        url: url
      }));

      const payload = {
        ...form,
        stock: { quantity: Number(form.stock) || 0 },
        specifications: form.specifications ? form.specifications.split('\n').map(l => { const [k,...v] = l.split(':'); return { key: k?.trim(), value: v.join(':').trim() }; }).filter(s => s.key && s.value) : [],
        useCases: form.useCases ? form.useCases.split('\n').filter(Boolean) : [],
      };
      
      if (parsedMedia.length > 0) payload.media = parsedMedia;
      
      if (editId) {
        await api.put(`/products/${editId}`, payload);
        toast.success('Produit mis à jour !');
      } else {
        await api.post('/products', payload);
        toast.success('Produit créé !');
      }
      setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Supprimé'); load(); } catch (_) {}
  };

  const handleToggle = async (id, current) => {
    try { await api.put(`/products/${id}`, { isAvailable: !current }); load(); } catch (_) {}
  };

  const CATS = ['marbre', 'granit', 'ciment', 'sable', 'carrelage', 'brique', 'bois', 'acier', 'peinture', 'plomberie', 'électricité', 'autre'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2> Mes produits</h2>
          <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>{products.length} produit(s) dans votre catalogue</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>+ Ajouter un produit</button>
      </div>

      {loading ? (
        <div className="grid-auto">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />)}</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Aucun produit</div>
          <button className="btn btn-primary" onClick={openAddModal}>Ajouter mon premier produit</button>
        </div>
      ) : (
        <div className="grid-auto premium-cards-container">
          <style>{`
            .premium-cards-container {
              display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;
            }
            .premium-product-card {
              background: #ffffff; border-radius: 20px; padding: 1.5rem;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
              border: 1px solid rgba(226, 232, 240, 0.8);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              display: flex; flex-direction: column; height: 100%;
              position: relative; overflow: hidden;
            }
            .premium-product-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
              border-color: rgba(59, 130, 246, 0.3);
            }
            .premium-card-header {
              display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
            }
            .premium-cat-badge {
              background: #f1f5f9; color: #475569; padding: 0.35rem 0.75rem; border-radius: 8px;
              font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
            }
            .premium-status-dot {
              display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 600;
            }
            .premium-status-dot::before {
              content: ''; display: block; width: 8px; height: 8px; border-radius: 50%;
            }
            .premium-status-dot.active { color: #16a34a; }
            .premium-status-dot.active::before { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
            .premium-status-dot.inactive { color: #dc2626; }
            .premium-status-dot.inactive::before { background: #ef4444; }
            
            .premium-card-title {
              font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; line-height: 1.3;
            }
            .premium-card-desc {
              color: #64748b; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;
              display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
            }
            
            .premium-card-price {
              font-size: 1.75rem; font-weight: 800; color: #2563eb; margin-bottom: 0.25rem;
              display: flex; align-items: baseline; gap: 0.25rem;
            }
            .premium-card-price span { font-size: 1rem; color: #64748b; font-weight: 600; }
            
            .premium-card-meta {
              display: flex; border-top: 1px solid #f1f5f9; padding-top: 1rem; margin-top: auto;
              justify-content: space-between; align-items: center; color: #64748b; font-size: 0.85rem;
            }
            .premium-card-meta strong { color: #334155; font-weight: 700; }
            
            .premium-card-actions {
              display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
              margin-top: 1.5rem;
            }
            .premium-action-btn {
              padding: 0.6rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
              transition: all 0.2s; border: none; display: flex; justify-content: center; align-items: center; gap: 0.4rem;
            }
            .premium-btn-edit { background: #f1f5f9; color: #334155; }
            .premium-btn-edit:hover { background: #e2e8f0; color: #0f172a; }
            .premium-btn-toggle { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
            .premium-btn-toggle:hover { background: #fef3c7; color: #b45309; }
            .premium-btn-delete { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
            .premium-btn-delete:hover { background: #fee2e2; color: #dc2626; }
            .btn-single { grid-column: 1 / -1; }
          `}</style>
          {products.map(p => (
            <div key={p._id} className="premium-product-card">
              <div className="premium-card-header">
                <span className="premium-cat-badge">{p.category}</span>
                <span className={`premium-status-dot ${p.isAvailable ? 'active' : 'inactive'}`}>
                  {p.isAvailable ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
              
              <h3 className="premium-card-title">{p.name}</h3>
              <p className="premium-card-desc">{p.description}</p>
              
              <div className="premium-card-price">
                {p.price} <span>DT / {p.unit}</span>
              </div>
              
              <div className="premium-card-meta">
                <div>En stock: <strong>{p.stock?.quantity || 0}</strong> {p.unit}s</div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span title="Vues">👁 {p.views || 0}</span>
                  <span title="Note moy.">★ {p.rating?.average?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              
              <div className="premium-card-actions">
                <button className="premium-action-btn premium-btn-edit btn-single" onClick={() => openEditModal(p)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Modifier
                </button>
                <button className="premium-action-btn premium-btn-toggle" onClick={() => handleToggle(p._id, p.isAvailable)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  {p.isAvailable ? 'Désactiver' : 'Activer'}
                </button>
                <button className="premium-action-btn premium-btn-delete" onClick={() => handleDelete(p._id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="premium-modal-overlay" onClick={() => setShowModal(false)}>
          <style>{`
            .premium-modal-overlay {
              position: fixed; inset: 0;
              background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px);
              display: flex; align-items: center; justify-content: center;
              z-index: 1000; padding: 1rem;
              animation: overlayFadeIn 0.3s ease-out;
            }
            .premium-modal {
              background: #ffffff; border-radius: 24px;
              width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
              padding: 2.5rem;
              animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .premium-header {
              display: flex; justify-content: space-between; align-items: flex-start;
              margin-bottom: 2rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;
            }
            .premium-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em; }
            .premium-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
            .premium-close {
              background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s;
            }
            .premium-close:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
            
            .premium-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
            .premium-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; }
            .premium-group.full { grid-column: 1 / -1; }
            
            .premium-label { font-size: 0.875rem; font-weight: 600; color: #334155; }
            .premium-input {
              width: 100%; padding: 0.875rem 1rem; border-radius: 12px;
              border: 1px solid #e2e8f0; background: #f8fafc; color: #0f172a;
              font-size: 0.95rem; transition: all 0.2s ease;
            }
            .premium-input:focus {
              background: #ffffff; border-color: #3b82f6; outline: none;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            }
            textarea.premium-input { resize: vertical; min-height: 80px; }
            
            .premium-status-badge {
              display: inline-flex; align-items: center; gap: 0.5rem;
              padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; font-size: 0.85rem;
              transition: all 0.3s;
            }
            .premium-status-badge.available { background: #dcfce7; color: #166534; }
            .premium-status-badge.unavailable { background: #fee2e2; color: #991b1b; }
            
            .premium-actions {
              display: flex; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9;
            }
            .premium-btn {
              flex: 1; padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 1rem;
              cursor: pointer; transition: all 0.2s; border: none; display: flex; justify-content: center; align-items: center;
            }
            .premium-btn.cancel { background: #f1f5f9; color: #475569; }
            .premium-btn.cancel:hover { background: #e2e8f0; color: #0f172a; }
            .premium-btn.submit {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;
              box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39);
            }
            .premium-btn.submit:hover:not(:disabled) {
              transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
            }
            .premium-btn.submit:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; background: #94a3b8; }
            
            @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modalSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
          `}</style>
          
          <div className="premium-modal" onClick={e => e.stopPropagation()}>
            <div className="premium-header">
              <div>
                <div className="premium-title">{editId ? '✏️ Modifier le produit' : '✨ Ajouter un produit'}</div>
                <div className="premium-subtitle">{editId ? 'Mettez à jour les informations de votre matériau' : 'Enrichissez votre catalogue avec de nouveaux matériaux'}</div>
              </div>
              <button className="premium-close" onClick={() => setShowModal(false)} title="Fermer">✕</button>
            </div>
            
            <div className="premium-grid">
              <div className="premium-group full">
                <label className="premium-label">Nom du Produit *</label>
                <input className="premium-input" placeholder="Ex: Marbre Blanc Carrara Premium" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              
              <div className="premium-group full">
                <label className="premium-label">Description *</label>
                <textarea className="premium-input" placeholder="Décrivez les qualités de votre produit..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="premium-group">
                <label className="premium-label">Catégorie</label>
                <select className="premium-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div className="premium-group">
                <label className="premium-label">Unité de Vente</label>
                <select className="premium-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {['m²', 'm³', 'kg', 'tonne', 'pièce', 'mètre', 'litre', 'sac'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="premium-group">
                <label className="premium-label">Prix (DT) *</label>
                <input className="premium-input" type="number" min="0" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>

              <div className="premium-group">
                <label className="premium-label">Stock Initial ({form.unit})</label>
                <input className="premium-input" type="number" min="0" placeholder="0" value={form.stock} onChange={e => {
                  const val = e.target.value;
                  const numVal = Number(val);
                  setForm(f => ({ 
                    ...f, 
                    stock: val, 
                    isAvailable: numVal === 0 ? false : f.isAvailable 
                  }));
                }} />
              </div>

              <div className="premium-group full">
                <label className="premium-label">Disponibilité Automatique</label>
                <div style={{ marginTop: '0.25rem' }}>
                  {Number(form.stock) === 0 ? (
                    <span className="premium-status-badge unavailable">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      Indisponible (Stock épuisé)
                    </span>
                  ) : (
                    <span className="premium-status-badge available" style={{ cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))} title="Cliquez pour forcer la disponibilité">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      {form.isAvailable ? 'Disponible pour les clients' : 'Forcé en Indisponible'}
                    </span>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Le statut passe en « Indisponible » si votre stock défini est à 0. (Cliquez le badge pour forcer manuellement)</p>
                </div>
              </div>

              <div className="premium-group full">
                <label className="premium-label">Mots & Spécifications clés (Optionnel)</label>
                <textarea className="premium-input" placeholder={"Épaisseur:2cm\nFormat:60x60cm\nFinition:Poli brillant"} value={form.specifications} onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))} />
              </div>

              <div className="premium-group full">
                <label className="premium-label">Fiche Technique & Images</label>
                <input className="premium-input" type="file" multiple accept=".pdf,image/*" onChange={e => setFiles(e.target.files)} />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Sélectionnez vos images (.jpg, .png) et/ou la fiche technique (.pdf).</p>
              </div>

              <div className="premium-group full">
                <label className="premium-label">Cas d'usage (Optionnel)</label>
                <textarea className="premium-input" rows={2} placeholder={"Sol de salon\nRevêtement mural intérieur"} value={form.useCases} onChange={e => setForm(f => ({ ...f, useCases: e.target.value }))} />
              </div>
            </div>

            <div className="premium-actions">
              <button className="premium-btn cancel" onClick={() => setShowModal(false)} disabled={uploading}>Annuler</button>
              <button className="premium-btn submit" onClick={handleSubmit} disabled={!form.name || !form.description || !form.price || uploading}>
                {uploading ? 'Enregistrement...' : editId ? 'Enregistrer les modifications' : 'Créer le produit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;
