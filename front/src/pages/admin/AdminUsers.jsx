import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = ['', 'SuperAdmin', 'Architecte', 'Ingenieur', 'Artisan', 'Fournisseur'];

const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', isVerified: '', search: '' });
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 15 };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const handleVerify = async (id) => {
    try { await api.put(`/admin/users/${id}/verify`); toast.success('Compte vérifié'); load(); } catch (_) { toast.error('Erreur'); }
  };
  const handleToggle = async (id) => {
    try { await api.put(`/admin/users/${id}/toggle`); toast.success('Statut modifié'); load(); } catch (_) { toast.error('Erreur'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('Supprimé'); load(); } catch (_) { toast.error('Erreur'); }
  };

  const ROLE_COLORS = { SuperAdmin: '#ef4444', Architecte: '#f59e0b', Ingenieur: '#3b82f6', Artisan: '#10b981', Fournisseur: '#8b5cf6' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>👥 Gestion des utilisateurs</h2>
        <span className="badge badge-muted">{pagination.total} utilisateurs</span>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            className="form-input" placeholder="Rechercher..." style={{ flex: 1, minWidth: 200 }}
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          <select
            className="form-input form-select" style={{ width: 160 }}
            value={filters.role}
            onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
          >
            {ROLES.map((r) => <option key={r} value={r}>{r || 'Tous les rôles'}</option>)}
          </select>
          <select
            className="form-input form-select" style={{ width: 170 }}
            value={filters.isVerified}
            onChange={(e) => setFilters(f => ({ ...f, isVerified: e.target.value }))}
          >
            <option value="">Tous les statuts</option>
            <option value="true">Vérifiés</option>
            <option value="false">Non vérifiés</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Métier / Entreprise</th>
              <th>Statut</th>
              <th>Inscrit le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>Chargement...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>Aucun utilisateur</td></tr>
            ) : users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `${ROLE_COLORS[u.role] || '#9ca3af'}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.85rem', color: ROLE_COLORS[u.role],
                    }}>
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge" style={{ background: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}44` }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                  {u.craft || u.companyName || u.specialization || '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`} style={{ width: 'fit-content' }}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                    <span className={`badge ${u.isVerified ? 'badge-info' : 'badge-muted'}`} style={{ width: 'fit-content', fontSize: '0.7rem' }}>
                      {u.isVerified ? '✓ Vérifié' : '⏳ En attente'}
                    </span>
                  </div>
                </td>
                <td style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {!u.isVerified && u.role !== 'SuperAdmin' && (
                      <button className="btn btn-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }} onClick={() => handleVerify(u._id)}>
                        ✓ Valider
                      </button>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(u._id)}>
                      {u.isActive ? '🚫 Désactiver' : '✅ Activer'}
                    </button>
                    {u.role !== 'SuperAdmin' && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id)}>🗑</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => load(p)}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
