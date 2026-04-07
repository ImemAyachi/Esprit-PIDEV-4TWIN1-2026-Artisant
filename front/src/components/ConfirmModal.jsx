import React from 'react';
import { AlertTriangle, CheckCircle, Info, Trash2, X } from 'lucide-react';

/**
 * ConfirmModal — Modal de confirmation réutilisable
 * 
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   <ConfirmModal config={confirm} onClose={() => setConfirm(null)} />
 *   
 *   // Pour déclencher :
 *   setConfirm({
 *     type: 'danger',           // 'danger' | 'warning' | 'info'
 *     title: 'Supprimer ?',
 *     message: 'Cette action est irréversible.',
 *     confirmLabel: 'Supprimer',
 *     onConfirm: () => handleDelete(id)
 *   });
 */
const TYPES = {
  danger: {
    icon: <Trash2 size={28} />,
    iconBg: 'rgba(239,68,68,0.12)',
    iconColor: '#ef4444',
    btnClass: 'btn-danger-solid',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  warning: {
    icon: <AlertTriangle size={28} />,
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#f59e0b',
    btnClass: 'btn-warning-solid',
    borderColor: 'rgba(245,158,11,0.2)',
  },
  info: {
    icon: <Info size={28} />,
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#3b82f6',
    btnClass: 'btn-info-solid',
    borderColor: 'rgba(59,130,246,0.2)',
  },
};

const ConfirmModal = ({ config, onClose }) => {
  if (!config) return null;

  const { type = 'danger', title, message, confirmLabel = 'Confirmer', onConfirm } = config;
  const style = TYPES[type] || TYPES.danger;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      <div style={{
        background: 'var(--clr-surface)',
        border: `1px solid ${style.borderColor}`,
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        width: '100%',
        maxWidth: 440,
        animation: 'slideUp 0.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={onClose} style={{
            background: 'var(--clr-surface2)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--clr-text-muted)', transition: 'var(--transition)'
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Icon + Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: style.iconBg, color: style.iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            {style.icon}
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {title}
          </h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary w-full"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1, padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)',
              fontWeight: 600, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
              background: type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6',
              color: '#fff', transition: 'var(--transition)',
              boxShadow: type === 'danger' ? '0 4px 15px rgba(239,68,68,0.35)' : 'none',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
