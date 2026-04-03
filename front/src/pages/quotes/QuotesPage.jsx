import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuotes } from '../../store/slices/quoteSlice';

const STATUS_LABELS = { open: 'Ouvert', pending: 'En attente', accepted: 'Accepté', refused: 'Refusé', completed: 'Terminé', cancelled: 'Annulé' };
const STATUS_CLASS  = { open: 'badge-info', pending: 'badge-primary', accepted: 'badge-success', refused: 'badge-danger', completed: 'badge-success', cancelled: 'badge-muted' };

const QuotesPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items: quotes, loading, pagination } = useSelector((s) => s.quotes);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchQuotes({ status: statusFilter || undefined }));
  }, [statusFilter]);

  const isRequester = ['Architecte', 'Ingenieur'].includes(user?.role);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>📋 {isRequester ? 'Mes demandes de devis' : 'Devis reçus'}</h2>
          <p style={{ color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>{pagination.total || 0} devis au total</p>
        </div>
        {isRequester && (
          <Link to="/dashboard/artisans" className="btn btn-primary">+ Nouvelle demande</Link>
        )}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[['', 'Tous'], ...Object.entries(STATUS_LABELS)].map(([val, label]) => (
          <button key={val} className="btn btn-sm" style={{
            background: statusFilter === val ? 'rgba(245,158,11,0.15)' : 'var(--clr-surface2)',
            border: `1px solid ${statusFilter === val ? 'rgba(245,158,11,0.4)' : 'var(--clr-border)'}`,
            color: statusFilter === val ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
          }} onClick={() => setStatusFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Quotes list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : quotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clr-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Aucun devis</div>
          {isRequester && <Link to="/dashboard/artisans" className="btn btn-primary btn-sm mt-2">Trouver un artisan</Link>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {quotes.map((q) => {
            const other = isRequester ? q.artisan : q.requester;
            return (
              <Link to={`/dashboard/quotes/${q._id}`} key={q._id} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--grad-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {other?.firstName?.[0]}{other?.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{q.title}</div>
                      <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                        {isRequester ? '🔨 Artisan' : '🏛️ Demandeur'} : {other?.firstName} {other?.lastName}
                        {other?.craft && ` • ${other.craft}`}
                      </div>
                      <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        📅 {new Date(q.createdAt).toLocaleDateString('fr-FR')}
                        {q.location && ` • 📍 ${q.location}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <span className={`badge ${STATUS_CLASS[q.status]}`}>{STATUS_LABELS[q.status]}</span>
                    {q.totalAmount > 0 && (
                      <span style={{ fontWeight: 700, color: 'var(--clr-primary)', fontSize: '1.05rem' }}>
                        {q.totalAmount.toLocaleString()} DT
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuotesPage;
