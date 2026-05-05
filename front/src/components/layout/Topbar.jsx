import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { markAllRead } from '../../store/slices/notificationSlice';
import { logout } from '../../store/slices/authSlice';

const PAGE_TITLES = {
  home: 'Tableau de bord', users: 'Utilisateurs', catalog: 'Catalogue',
  artisans: 'Artisans', quotes: 'Devis', projects: 'Chantiers',
  'my-products': 'Mes produits', profile: 'Mon profil',
  planner: 'Planificateur IA',
};

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { items: notifs, unreadCount } = useSelector((s) => s.notifications);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  // Fermer panneau notifs au clic externe
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const seg = window.location.pathname.split('/').pop();
  const title = PAGE_TITLES[seg] || 'Artisanet';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn-ghost" onClick={() => dispatch(toggleSidebar())} style={{ fontSize: '1.2rem', padding: '0.5rem' }}>☰</button>
        <span className="topbar-title">{title}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="btn-ghost"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%', width: 40, height: 40 }}
            onClick={() => setShowNotifs((v) => !v)}
          >
            {/* Icône Cloche SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--clr-text)' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>

            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 16, height: 16, borderRadius: '10px',
                background: '#ef4444', color: '#fff',
                padding: '0 4px',
                fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, border: '2px solid var(--clr-surface)',
                boxSizing: 'content-box'
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', width: 340,
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => dispatch(markAllRead())}
                    style={{ fontSize: '0.75rem', color: 'var(--clr-primary)' }}
                  >
                    Tout lire
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Aucune notification</div>
                ) : notifs.slice(0, 10).map((n) => (
                  <div
                    key={n._id}
                    onClick={() => { setShowNotifs(false); if (n.link) navigate(n.link); }}
                    style={{
                      padding: '0.875rem 1rem', cursor: 'pointer',
                      borderBottom: '1px solid var(--clr-border)',
                      background: n.isRead ? 'transparent' : 'rgba(245,158,11,0.05)',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--clr-surface2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(245,158,11,0.05)'}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{n.title}</div>
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0,
          }}
          onClick={() => navigate('/dashboard/profile')}
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
