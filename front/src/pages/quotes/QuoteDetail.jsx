import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { acceptQuote, refuseQuote, submitQuote } from '../../store/slices/quoteSlice';
import api from '../../services/api';

const STATUS_LABELS = { open: 'Ouvert', pending: 'En attente', accepted: '✅ Accepté', refused: '❌ Refusé', completed: 'Terminé', cancelled: 'Annulé' };
const STATUS_CLASS  = { open: 'badge-info', pending: 'badge-primary', accepted: 'badge-success', refused: 'badge-danger', completed: 'badge-success', cancelled: 'badge-muted' };

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [quote, setQuote]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitData, setSubmitData] = useState({ notes: '', proposedDeadline: '', items: [{ description: '', quantity: 1, unit: 'unité', unitPrice: 0 }] });

  const load = async () => {
    try { const r = await api.get(`/quotes/${id}`); setQuote(r.data.quote); } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const isRequester = ['Architecte', 'Ingenieur'].includes(user?.role);
  const isArtisan   = user?.role === 'Artisan'   && quote?.artisan?._id === user?._id;

  const handleAccept = async () => {
    if (!window.confirm('Accepter ce devis ?')) return;
    const r = await dispatch(acceptQuote(id));
    if (r.meta.requestStatus === 'fulfilled') load();
  };

  const handleRefuse = async () => {
    const reason = window.prompt('Motif du refus (optionnel):');
    if (reason === null) return;
    const r = await dispatch(refuseQuote({ id, reason }));
    if (r.meta.requestStatus === 'fulfilled') load();
  };

  const addItem = () => setSubmitData(d => ({ ...d, items: [...d.items, { description: '', quantity: 1, unit: 'unité', unitPrice: 0 }] }));
  const removeItem = (i) => setSubmitData(d => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => setSubmitData(d => ({ ...d, items: d.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));

  const total = submitData.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice)), 0);

  const handleSubmitQuote = async () => {
    const r = await dispatch(submitQuote({ id, data: submitData }));
    if (r.meta.requestStatus === 'fulfilled') { setShowSubmit(false); load(); }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!quote)  return <div style={{ padding: '2rem', color: 'var(--clr-text-muted)' }}>Devis introuvable</div>;

  const other = isRequester ? quote.artisan : quote.requester;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 860, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ width: 'fit-content' }}>← Retour</button>

      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className={`badge ${STATUS_CLASS[quote.status]}`} style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
              {STATUS_LABELS[quote.status]}
            </span>
            <h2>{quote.title}</h2>
            {quote.location && <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>📍 {quote.location}</p>}
          </div>
          {quote.totalAmount > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>Montant proposé</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--clr-primary)' }}>{quote.totalAmount.toLocaleString()} DT</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Description */}
        <div className="card">
          <h3 style={{ marginBottom: '0.875rem' }}>📝 Description</h3>
          <p style={{ color: 'var(--clr-text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>{quote.description}</p>
          {quote.desiredDeadline && (
            <p style={{ marginTop: '1rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
              🗓️ Deadline souhaitée : <strong style={{ color: 'var(--clr-text)' }}>{new Date(quote.desiredDeadline).toLocaleDateString('fr-FR')}</strong>
            </p>
          )}
        </div>

        {/* Interlocuteur */}
        <div className="card">
          <h3 style={{ marginBottom: '0.875rem' }}>{isRequester ? '🔨 Artisan' : '🏛️ Demandeur'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '1.1rem', flexShrink: 0 }}>
              {other?.firstName?.[0]}{other?.lastName?.[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{other?.firstName} {other?.lastName}</div>
              {other?.craft && <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>{other.craft}</div>}
              {other?.phone && <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>📞 {other.phone}</div>}
              {other?.location?.city && <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>📍 {other.location.city}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Détail du devis soumis */}
      {quote.items?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>💰 Détail du devis</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Description</th><th>Qté</th><th>Unité</th><th>Prix unit.</th><th>Total</th></tr></thead>
              <tbody>
                {quote.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.unitPrice} DT</td>
                    <td style={{ fontWeight: 700 }}>{(item.quantity * item.unitPrice).toLocaleString()} DT</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(245,158,11,0.05)' }}>
                  <td colSpan={4} style={{ fontWeight: 700, textAlign: 'right' }}>TOTAL</td>
                  <td style={{ fontWeight: 900, color: 'var(--clr-primary)', fontSize: '1.1rem' }}>{quote.totalAmount?.toLocaleString()} DT</td>
                </tr>
              </tbody>
            </table>
          </div>
          {quote.notes && <p style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--clr-surface2)', borderRadius: 'var(--radius-md)', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>💬 {quote.notes}</p>}
          {quote.proposedDeadline && <p style={{ marginTop: '0.75rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>🗓️ Délai proposé : {new Date(quote.proposedDeadline).toLocaleDateString('fr-FR')}</p>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Architecte : accepter / refuser si pending */}
        {isRequester && quote.status === 'pending' && (
          <>
            <button className="btn btn-primary" onClick={handleAccept}>✅ Accepter le devis</button>
            <button className="btn btn-danger"   onClick={handleRefuse}>❌ Refuser</button>
          </>
        )}
        {/* Artisan : soumettre si open */}
        {isArtisan && quote.status === 'open' && (
          <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>📤 Soumettre mon devis</button>
        )}
      </div>

      {/* Submit devis modal */}
      {showSubmit && (
        <div className="modal-overlay" onClick={() => setShowSubmit(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📤 Soumettre mon devis</div>
              <button className="btn-ghost" onClick={() => setShowSubmit(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4>Lignes de devis</h4>
              {submitData.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.8fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                  <div className="form-group">
                    {i === 0 && <label className="form-label">Description</label>}
                    <input className="form-input" placeholder="Ex: Main d'œuvre plomberie" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                  </div>
                  <div className="form-group">
                    {i === 0 && <label className="form-label">Qté</label>}
                    <input className="form-input" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="form-group">
                    {i === 0 && <label className="form-label">Unité</label>}
                    <input className="form-input" placeholder="jour" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
                  </div>
                  <div className="form-group">
                    {i === 0 && <label className="form-label">Prix unit. (DT)</label>}
                    <input className="form-input" type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                  </div>
                  {submitData.items.length > 1 && (
                    <button className="btn btn-danger btn-sm" style={{ marginBottom: i === 0 ? '1px' : 0 }} onClick={() => removeItem(i)}>✕</button>
                  )}
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" style={{ width: 'fit-content' }} onClick={addItem}>+ Ajouter une ligne</button>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Total estimé :</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--clr-primary)' }}>{total.toLocaleString()} DT</span>
              </div>
              <div className="form-group">
                <label className="form-label">Note / Commentaires</label>
                <textarea className="form-input" rows={3} placeholder="Remarques, conditions particulières..." value={submitData.notes} onChange={(e) => setSubmitData(d => ({ ...d, notes: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Délai proposé</label>
                <input className="form-input" type="date" value={submitData.proposedDeadline} onChange={(e) => setSubmitData(d => ({ ...d, proposedDeadline: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowSubmit(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmitQuote}>Envoyer le devis</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteDetail;
