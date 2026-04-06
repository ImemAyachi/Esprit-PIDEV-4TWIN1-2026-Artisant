import React from 'react';
import { useSelector } from 'react-redux';

const ProfilePage = () => {
  const { user } = useSelector((s) => s.auth);

  if (!user) return null;

  const ROLE_ICON = { SuperAdmin: '', Architecte: '', Ingenieur: '', Artisan: '', Fournisseur: '' };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile header */}
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%', background: 'var(--grad-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '2rem', color: '#fff', margin: '0 auto 1.25rem',
        }}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <h2 style={{ marginBottom: '0.25rem' }}>{user.firstName} {user.lastName}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">{ROLE_ICON[user.role]} {user.role}</span>
          <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-muted'}`}>
            {user.isVerified ? ' Vérifié' : ' En attente de vérification'}
          </span>
          <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
            {user.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      {/* Infos */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}> Informations</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1rem' }}>
          {[
            { label: 'Email',          value: user.email,                     icon: '' },
            { label: 'Téléphone',      value: user.phone || 'Non renseigné',   icon: 'Tel: ' },
            { label: 'Ville',          value: user.location?.city || '—',      icon: 'Lieu: ' },
            { label: 'Membre depuis',  value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—', icon: 'Date: ' },
            user.craft && { label: 'Métier',     value: user.craft,            icon: '' },
            user.companyName && { label: 'Entreprise', value: user.companyName, icon: '' },
            user.specialization && { label: 'Spécialisation', value: user.specialization, icon: '' },
            user.experience && { label: 'Expérience', value: `${user.experience} ans`, icon: '' },
          ].filter(Boolean).map((info) => (
            <div key={info.label} style={{ background: 'var(--clr-surface2)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem' }}>
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{info.icon} {info.label}</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{info.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating (pour artisans et fournisseurs) */}
      {user.rating?.count > 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>* Réputation</h3>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--clr-primary)' }}>{user.rating.average?.toFixed(1)}</div>
          <div style={{ color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>sur {user.rating.count} avis</div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
