import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyProductsPage = () => {
  const { user } = useSelector((s) => s.auth);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'marbre', price: '', unit: 'm²', specifications: '', useCases: '', isAvailable: true });

  const load = async () => { try { const r = await api.get('/products/my'); setProducts(r.data.products); } catch (_) {}; setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const payload = {
        ...form,
        specifications: form.specifications ? form.specifications.split('\n').map(l => { const [k,...v] = l.split(':'); return { key: k?.trim(), value: v.join(':').trim() }; }).filter(s => s.key && s.value) : [],
        useCases: form.useCases ? form.useCases.split('\n').filter(Boolean) : [],
      };
      await api.post('/products', payload);
      toast.success('Produit créé !'); setShowModal(false); load();
    } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
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
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Ajouter un produit</button>
      </div>

      {loading ? (
        <div className="grid-auto">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />)}</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Aucun produit</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Ajouter mon premier produit</button>
        </div>
      ) : (
        <div className="grid-auto">
          {products.map(p => (
            <div key={p._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="badge badge-primary">{p.category}</span>
                <span className={`badge ${p.isAvailable ? 'badge-success' : 'badge-muted'}`}>{p.isAvailable ? 'Disponible' : 'Indisponible'}</span>
              </div>
              <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>{p.name}</h3>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.description}</p>
              <div style={{ fontWeight: 800, color: 'var(--clr-primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>{p.price} DT / {p.unit}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
                 Stock : {p.stock?.quantity || 0} {p.unit}s • Vues:  {p.views || 0} vues • * {p.rating?.average?.toFixed(1) || '0.0'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => handleToggle(p._id, p.isAvailable)}>
                  {p.isAvailable ? ' Désactiver' : 'Accepter Activer'}
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p._id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">+ Nouveau produit</div>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Catégorie</label>
                  <select className="form-input form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unité</label>
                  <select className="form-input form-select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {['m²', 'm³', 'kg', 'tonne', 'pièce', 'mètre', 'litre', 'sac'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Prix (DT) *</label><input className="form-input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div className="form-group">
                <label className="form-label">Spécifications (clé:valeur, une par ligne)</label>
                <textarea className="form-input" rows={3} placeholder={"Épaisseur:2cm\nFormat:60x60cm\nFinition:Poli brillant"} value={form.specifications} onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Cas d'usage (un par ligne)</label>
                <textarea className="form-input" rows={2} placeholder={"Sol de salon\nRevêtement mural"} value={form.useCases} onChange={e => setForm(f => ({ ...f, useCases: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreate} disabled={!form.name || !form.description || !form.price}>Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;
