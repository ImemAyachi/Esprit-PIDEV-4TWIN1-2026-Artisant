import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useState } from 'react';

const ROLE_INFO = {
  SuperAdmin:  { greeting: 'Vue globale', badge: '🛡️' },
  Architecte:  { greeting: 'Espace Architecte', badge: '🏛️' },
  Ingenieur:   { greeting: 'Espace Ingénieur',  badge: '⚙️' },
  Fournisseur: { greeting: 'Espace Fournisseur', badge: '🏭' },
  Artisan:     { greeting: 'Espace Artisan',     badge: '🔨' },
};

const AdminDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'SuperAdmin') {
          const res = await api.get('/admin/dashboard');
          setStats(res.data.dashboard);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [user]);

  const info = ROLE_INFO[user?.role] || {};

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(59,130,246,0.05))',
        border: '1px solid rgba(245,158,11,0.15)',
        borderRadius: 'var(--radius-xl)', padding: '2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ color: 'var(--clr-text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{info.badge} {info.greeting}</div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Bonjour, <span style={{ color: 'var(--clr-primary)' }}>{user?.firstName}</span> 👋
          </h2>
          <p style={{ color: 'var(--clr-text-muted)' }}>Voici votre résumé du jour</p>
        </div>
        <div style={{ fontSize: '4rem' }}>{info.badge}</div>
      </div>

      {/* Stats globales (SuperAdmin) */}
      {user?.role === 'SuperAdmin' && stats && (
        <>
          <div className="stats-grid">
            {[
              { label: 'Utilisateurs', value: stats.totalUsers,    icon: '👥', color: '#3b82f6' },
              { label: 'Produits',     value: stats.totalProducts,  icon: '📦', color: '#f59e0b' },
              { label: 'Devis',        value: stats.totalQuotes,    icon: '📋', color: '#10b981' },
              { label: 'Commandes',    value: stats.totalOrders,    icon: '🛒', color: '#8b5cf6' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-icon">{s.icon}</div>
              </div>
            ))}
          </div>

          {/* En attente de validation */}
          {stats.pendingVerification > 0 && (
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ {stats.pendingVerification} compte(s) en attente de validation</div>
                <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Des professionnels attendent votre validation.</div>
              </div>
              <Link to="/dashboard/users" className="btn btn-primary btn-sm">Voir →</Link>
            </div>
          )}

          {/* Revenue chart */}
          {stats.monthlyRevenue?.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>📈 Chiffre d'affaires (12 derniers mois)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="_id.month" stroke="var(--clr-text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--clr-text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)', borderRadius: 8 }}
                    formatter={(v) => [`${v.toLocaleString()} DT`, 'CA']}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Utilisateurs par rôle */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem' }}>👥 Utilisateurs par rôle</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.usersByRole?.map((r) => (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 100, fontSize: '0.85rem', fontWeight: 600 }}>{r._id}</div>
                  <div style={{ flex: 1, background: 'var(--clr-surface2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: 'var(--grad-primary)', borderRadius: 99,
                      width: `${Math.min((r.count / stats.totalUsers) * 100, 100)}%`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div style={{ width: 30, textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>{r.count}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick actions par rôle */}
      <div className="card">
        <h3 style={{ marginBottom: '1.25rem' }}>⚡ Actions rapides</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.75rem' }}>
          {user?.role !== 'Fournisseur' && (
            <Link to="/dashboard/catalog" className="btn btn-secondary" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              📦 Catalogue
            </Link>
          )}
          {['Architecte', 'Ingenieur'].includes(user?.role) && (
            <Link to="/dashboard/artisans" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              🔨 Trouver un artisan
            </Link>
          )}
          {['Architecte', 'Ingenieur', 'Artisan'].includes(user?.role) && (
            <Link to="/dashboard/quotes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              📋 Mes devis
            </Link>
          )}
          {['Ingenieur', 'Architecte', 'Artisan'].includes(user?.role) && (
            <Link to="/dashboard/projects" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              🏗️ Chantiers
            </Link>
          )}
          {user?.role === 'Fournisseur' && (
            <Link to="/dashboard/my-products" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              + Ajouter produit
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
