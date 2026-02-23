import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import {
    Trash2, Shield, AlertCircle, Search,
    UserCheck, UserX, RefreshCw, Filter,
    CheckCircle2, XCircle, Loader2
} from 'lucide-react';

const FILTERS = ['All', 'Active', 'Inactive'];
const ROLE_COLORS = {
    Admin: { bg: '#FF6B35', text: '#fff' },
    Expert: { bg: '#1B4D4D', text: '#fff' },
    Artisan: { bg: '#e8f5f5', text: '#1B4D4D' },
    Manufacturer: { bg: '#fef3ec', text: '#FF6B35' },
};

/* ─── Toast Notification ─────────────────────────────────────── */
const Toast = ({ toasts }) => (
    <div className="toast-container">
        {toasts.map(t => (
            <div key={t.id} className={`toast toast--${t.type}`}>
                {t.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{t.message}</span>
            </div>
        ))}
        <style>{`
            .toast-container {
                position: fixed; bottom: 24px; right: 24px;
                display: flex; flex-direction: column; gap: 8px; z-index: 9999;
            }
            .toast {
                display: flex; align-items: center; gap: 10px;
                padding: 12px 20px; border-radius: 0; font-weight: 700;
                font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
                border-left: 4px solid;
                animation: slideIn 0.3s ease forwards;
                box-shadow: 4px 4px 0 rgba(0,0,0,0.15);
            }
            .toast--success { background: #fff; color: #1B4D4D; border-color: #4caf81; }
            .toast--error   { background: #fff; color: #c0392b; border-color: #c0392b; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to   { transform: translateX(0);   opacity: 1; }
            }
        `}</style>
    </div>
);

/* ─── Toggle Switch ──────────────────────────────────────────── */
const ToggleSwitch = ({ isActive, loading, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={loading || disabled}
        title={isActive ? 'Click to deactivate account' : 'Click to activate account'}
        style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            width: 52,
            height: 28,
            background: loading ? '#ccc' : isActive ? '#4caf81' : '#e0e0e0',
            border: `2px solid ${loading ? '#bbb' : isActive ? '#3d9a6e' : '#c0c0c0'}`,
            borderRadius: 0,
            cursor: loading || disabled ? 'not-allowed' : 'pointer',
            transition: 'background 0.25s, border-color 0.25s',
            padding: 0,
            outline: 'none',
            flexShrink: 0,
        }}
    >
        <span style={{
            position: 'absolute',
            left: loading ? 12 : isActive ? 26 : 2,
            width: 20, height: 20,
            background: '#fff',
            borderRadius: 0,
            transition: 'left 0.25s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {loading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: '#1B4D4D' }} />}
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
);

/* ─── Confirm Dialog ─────────────────────────────────────────── */
const ConfirmDialog = ({ isOpen, user, onConfirm, onCancel }) => {
    if (!isOpen || !user) return null;
    const action = user.isActive ? 'deactivate' : 'activate';
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9000, backdropFilter: 'blur(2px)',
        }}>
            <div style={{
                background: '#fff', border: '4px solid #1B4D4D',
                padding: '40px', maxWidth: 440, width: '90%',
                boxShadow: '8px 8px 0 rgba(27,77,77,0.2)',
                animation: 'popIn 0.2s ease',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    {user.isActive
                        ? <UserX size={28} color="#c0392b" />
                        : <UserCheck size={28} color="#4caf81" />
                    }
                    <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 18, color: '#1B4D4D' }}>
                        {action} account?
                    </h3>
                </div>
                <p style={{ margin: '0 0 28px', color: '#555', fontSize: 13, lineHeight: 1.6 }}>
                    You are about to <strong>{action}</strong> the account of <strong>{user.name}</strong> ({user.email}).
                    {user.isActive
                        ? ' They will lose access to the platform immediately.'
                        : ' They will regain full access to the platform.'}
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '12px', fontWeight: 900,
                            textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11,
                            background: user.isActive ? '#c0392b' : '#4caf81',
                            color: '#fff', border: '2px solid currentColor', cursor: 'pointer',
                        }}
                    >
                        {action} Account
                    </button>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '12px', fontWeight: 900,
                            textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11,
                            background: 'transparent', color: '#1B4D4D',
                            border: '2px solid #1B4D4D', cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <style>{`@keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
    );
};

/* ─── Main Component ─────────────────────────────────────────── */
const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [togglingId, setTogglingId] = useState(null);
    const [confirmUser, setConfirmUser] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/users');
            setUsers(res.data.data.users);
        } catch {
            setError('Failed to fetch users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleToggleRequest = (user) => setConfirmUser(user);

    const confirmToggle = async () => {
        const user = confirmUser;
        setConfirmUser(null);
        setTogglingId(user._id);
        try {
            await api.patch(`/users/${user._id}/toggle-status`);
            setUsers(prev => prev.map(u =>
                u._id === user._id ? { ...u, isActive: !u.isActive } : u
            ));
            addToast(
                `"${user.name}" has been ${user.isActive ? 'deactivated' : 'activated'} successfully.`,
                'success'
            );
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to update account status.';
            addToast(msg, 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete ${user.name}'s account? This action is irreversible.`)) return;
        try {
            await api.delete(`/users/${user._id}`);
            setUsers(prev => prev.filter(u => u._id !== user._id));
            addToast(`"${user.name}" has been deleted.`, 'success');
        } catch {
            addToast('Failed to delete account.', 'error');
        }
    };

    const filtered = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'All' || (filter === 'Active' ? u.isActive : !u.isActive);
        return matchSearch && matchFilter;
    });

    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
    };

    return (
        <>
            <Toast toasts={toasts} />
            <ConfirmDialog
                isOpen={!!confirmUser}
                user={confirmUser}
                onConfirm={confirmToggle}
                onCancel={() => setConfirmUser(null)}
            />

            <div style={{ fontFamily: "'Outfit', sans-serif" }}>
                {/* Header */}
                <div style={{
                    background: '#1B4D4D', color: '#fff',
                    padding: '32px 40px', marginBottom: 0,
                    borderBottom: '4px solid #FF6B35',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Shield size={32} color="#FF6B35" />
                        <div>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Account Management
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: 10, letterSpacing: '0.15em', opacity: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>
                                Activate · Deactivate · Remove
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchUsers}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', background: 'transparent',
                            border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
                            cursor: 'pointer', fontWeight: 900, fontSize: 10,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '4px solid #1B4D4D' }}>
                    {[
                        { label: 'Total Accounts', value: stats.total, color: '#1B4D4D', icon: <Shield size={20} /> },
                        { label: 'Active', value: stats.active, color: '#4caf81', icon: <UserCheck size={20} /> },
                        { label: 'Inactive', value: stats.inactive, color: '#c0392b', icon: <UserX size={20} /> },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: '#fff', padding: '24px 32px',
                            borderRight: i < 2 ? '2px solid #e0e0e0' : 'none',
                            display: 'flex', alignItems: 'center', gap: 16,
                        }}>
                            <div style={{ color: s.color }}>{s.icon}</div>
                            <div>
                                <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
                                <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999' }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div style={{
                    background: '#f9f9f9', padding: '20px 32px',
                    borderBottom: '2px solid #e0e0e0',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                }}>
                    {/* Search */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: '2px solid #1B4D4D', background: '#fff',
                        padding: '8px 14px', flex: 1, minWidth: 200,
                    }}>
                        <Search size={14} color="#1B4D4D" style={{ opacity: 0.4, flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="SEARCH BY NAME OR EMAIL..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                border: 'none', outline: 'none', background: 'transparent',
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                                textTransform: 'uppercase', width: '100%', color: '#1B4D4D',
                            }}
                        />
                    </div>
                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Filter size={14} color="#999" />
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '8px 16px', fontSize: 10, fontWeight: 900,
                                    textTransform: 'uppercase', letterSpacing: '0.1em',
                                    border: '2px solid',
                                    cursor: 'pointer',
                                    background: filter === f ? '#1B4D4D' : 'transparent',
                                    borderColor: filter === f ? '#1B4D4D' : '#ddd',
                                    color: filter === f ? '#fff' : '#999',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '4px solid #1B4D4D', borderTop: 'none', overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#1B4D4D' }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>Loading Users...</p>
                        </div>
                    ) : error ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <AlertCircle size={20} />
                            <span style={{ fontWeight: 700, fontSize: 12 }}>{error}</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 60, textAlign: 'center', color: '#999' }}>
                            <p style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No users found</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e0e0e0', background: '#f5f5f5' }}>
                                    {['Identity', 'Role', 'Account Status', 'Toggle', 'Actions'].map(h => (
                                        <th key={h} style={{
                                            padding: '14px 20px', textAlign: 'left',
                                            fontSize: 9, fontWeight: 900,
                                            textTransform: 'uppercase', letterSpacing: '0.15em',
                                            color: '#1B4D4D', opacity: 0.5,
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((user, i) => (
                                    <tr
                                        key={user._id}
                                        style={{
                                            borderBottom: '1px solid #f0f0f0',
                                            background: i % 2 === 0 ? '#fff' : '#fafafa',
                                            opacity: user.isActive ? 1 : 0.6,
                                            transition: 'background 0.2s, opacity 0.3s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f7f7'}
                                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                                    >
                                        {/* Identity */}
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 38, height: 38, flexShrink: 0,
                                                    background: user.isActive ? '#1B4D4D' : '#ccc',
                                                    color: '#fff', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 900, fontSize: 14,
                                                    transition: 'background 0.3s',
                                                }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#1B4D4D' }}>{user.name}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999' }}>{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                background: ROLE_COLORS[user.role]?.bg || '#eee',
                                                color: ROLE_COLORS[user.role]?.text || '#333',
                                                fontSize: 9, fontWeight: 900,
                                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>

                                        {/* Status Badge */}
                                        <td style={{ padding: '16px 20px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                padding: '6px 12px', fontSize: 9, fontWeight: 900,
                                                textTransform: 'uppercase', letterSpacing: '0.1em',
                                                background: user.isActive ? '#e8f5ee' : '#fdecea',
                                                color: user.isActive ? '#2e7d52' : '#c0392b',
                                                border: `1px solid ${user.isActive ? '#b5dfc9' : '#f5c6c0'}`,
                                            }}>
                                                <span style={{
                                                    width: 6, height: 6, borderRadius: '50%',
                                                    background: user.isActive ? '#4caf81' : '#c0392b',
                                                    display: 'inline-block',
                                                    animation: user.isActive ? 'pulse 2s infinite' : 'none',
                                                }} />
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                                        </td>

                                        {/* Toggle */}
                                        <td style={{ padding: '16px 20px' }}>
                                            <ToggleSwitch
                                                isActive={user.isActive}
                                                loading={togglingId === user._id}
                                                onClick={() => handleToggleRequest(user)}
                                            />
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '16px 20px' }}>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                title="Delete user"
                                                style={{
                                                    background: 'transparent', border: '2px solid #e0e0e0',
                                                    color: '#bbb', cursor: 'pointer',
                                                    padding: '6px 10px', display: 'flex', alignItems: 'center',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0392b'; e.currentTarget.style.color = '#c0392b'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#bbb'; }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div style={{
                        padding: '12px 32px', background: '#f5f5f5',
                        borderTop: '2px solid #e0e0e0',
                        fontSize: 10, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999',
                    }}>
                        Showing {filtered.length} of {users.length} accounts
                    </div>
                )}
            </div>
        </>
    );
};

export default UserList;
