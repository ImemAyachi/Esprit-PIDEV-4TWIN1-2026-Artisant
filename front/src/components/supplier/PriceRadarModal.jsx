import React from 'react';
import { AlertTriangle, TrendingUp, Zap, ArrowRight, ShieldCheck, TrendingDown } from 'lucide-react';

const PriceRadarModal = ({ data, onCancel, onConfirm, onModify }) => {
  const { status, marketAvg, deviationPercent, opportunityScore, transparency } = data;

  return (
    <div className="radar-overlay" style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'
    }}>
      <div className="radar-modal" style={{
        background: '#fff', borderRadius: '32px', width: '100%', maxWidth: '500px',
        padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center',
        margin: '0 auto'
      }}>
        {status === 'high' ? (
          <>
            <div style={{ background: '#fef2f2', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <TrendingUp size={40} color="#ef4444" />
            </div>
            
            {/* Transparency Badge (PriceRadar 3.0) */}
            <div style={{ 
                display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '100px', 
                background: transparency?.color === 'red' ? '#fee2e2' : '#ffedd5',
                color: transparency?.color === 'red' ? '#ef4444' : '#f59e0b',
                fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem'
            }}>
                {transparency?.label || 'Prix Élevé'}
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Vérification Tarifaire</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2rem' }}>
              Votre prix est <strong style={{ color: '#ef4444' }}>{deviationPercent}% plus cher</strong> que la moyenne du marché (<strong style={{ color: '#0f172a' }}>{marketAvg} DT</strong>).
            </p>
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
                <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>Si vous publiez à ce prix, un badge d'alerte sera visible par les acheteurs.</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={onModify} className="btn btn-primary" style={{ height: '56px', borderRadius: '16px', fontSize: '1rem', fontWeight: 700 }}>
                Modifier mon prix
              </button>
              <button onClick={onConfirm} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: '0.5rem' }}>
                Publier quand même (Assumer l'écart)
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: '#ecfdf5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <Zap size={40} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Offre Exceptionnelle !</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              Votre prix est <strong style={{ color: '#10b981' }}>{Math.abs(deviationPercent)}% plus bas</strong> que le marché. 
              Votre produit sera mis en avant sur la page <strong style={{ color: '#0f172a' }}>Produits Chance</strong>.
            </p>
            
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', padding: '1.5rem', borderRadius: '20px', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Score d'Opportunité</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#064e3b' }}>{opportunityScore} / 100</div>
              </div>
              <TrendingDown size={32} color="#10b981" />
            </div>

            <button onClick={onConfirm} className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', width: '100%', height: '56px', borderRadius: '16px', fontSize: '1rem', fontWeight: 700 }}>
              Confirmer la publication
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PriceRadarModal;
