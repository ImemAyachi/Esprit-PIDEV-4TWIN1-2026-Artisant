import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar } from '../../store/slices/uiSlice';

const PLANNER_ITEM = { label: 'Planificateur IA', icon: '', path: '/dashboard/planner' };
const AI2D_ITEM    = { label: 'IA 2D',             icon: '', path: '/dashboard/ai-2d-plan' };
const BRAIN_ITEM   = { label: 'Chantier Brain',    icon: '', path: '/dashboard/chantier-brain' };
const LUCKY_DEALS_ITEM = { label: 'Produits Chance', icon: '', path: '/dashboard/lucky-deals' };
const PLAN3D_ITEM = { label: 'Plan 3D', icon: '', path: '/dashboard/plan-3d' };
const VIRTUAL_STAGING_ITEM = { label: 'Rénovation IA', icon: '', path: '/dashboard/virtual-staging' };
const ROLE_MENUS = {
  SuperAdmin: [
    { label: 'Tableau de bord', icon: '', path: '/dashboard/home' },
    PLANNER_ITEM,
    AI2D_ITEM,
    LUCKY_DEALS_ITEM,
    PLAN3D_ITEM,
    VIRTUAL_STAGING_ITEM,
    { label: 'Utilisateurs', icon: '', path: '/dashboard/users' },
    { label: 'Catalogue', icon: '', path: '/dashboard/catalog' },
    { label: 'Artisans', icon: '', path: '/dashboard/artisans' },
  ],
  Architecte: [
    { label: 'Tableau de bord', icon: '', path: '/dashboard/home' },
    PLANNER_ITEM,
    AI2D_ITEM,
    BRAIN_ITEM,
    LUCKY_DEALS_ITEM,
    PLAN3D_ITEM,
    VIRTUAL_STAGING_ITEM,
    { label: 'Catalogue', icon: '', path: '/dashboard/catalog' },
    { label: 'Artisans', icon: '', path: '/dashboard/artisans' },
    { label: 'Mes devis', icon: '', path: '/dashboard/quotes' },
  ],
  Ingenieur: [
    { label: 'Tableau de bord', icon: '', path: '/dashboard/home' },
    PLANNER_ITEM,
    AI2D_ITEM,
    BRAIN_ITEM,
    LUCKY_DEALS_ITEM,
    PLAN3D_ITEM,
    VIRTUAL_STAGING_ITEM,
    { label: 'Mes chantiers', icon: '', path: '/dashboard/projects' },
    { label: 'Artisans', icon: '', path: '/dashboard/artisans' },
    { label: 'Catalogue', icon: '', path: '/dashboard/catalog' },
    { label: 'Mes devis', icon: '', path: '/dashboard/quotes' },
  ],
  Artisan: [
    { label: 'Tableau de bord', icon: '', path: '/dashboard/home' },
    PLANNER_ITEM,
    AI2D_ITEM,
    LUCKY_DEALS_ITEM,
    PLAN3D_ITEM,
    VIRTUAL_STAGING_ITEM,
    { label: 'Mes devis', icon: '', path: '/dashboard/quotes' },
    { label: 'Mes chantiers', icon: '', path: '/dashboard/projects' },
    { label: 'Mes commandes', icon: '', path: '/dashboard/my-orders' },
    { label: 'Catalogue', icon: '', path: '/dashboard/catalog' },
  ],
  Fournisseur: [
    { label: 'Statistiques', icon: '', path: '/dashboard/supplier/stats' },
    PLANNER_ITEM,
    AI2D_ITEM,
    LUCKY_DEALS_ITEM,
    PLAN3D_ITEM,
    VIRTUAL_STAGING_ITEM,
    { label: 'Mon catalogue', icon: '', path: '/dashboard/my-products' },
    { label: 'Commandes reçues', icon: '', path: '/dashboard/supplier/orders' },
    { label: 'Catalogue public', icon: '', path: '/dashboard/catalog' },
  ],
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { sidebarOpen } = useSelector((s) => s.ui);

  const menus = ROLE_MENUS[user?.role] || [
    { label: 'Tableau de bord', icon: '', path: '/dashboard/home' },
    PLANNER_ITEM,
    PLAN3D_ITEM,
    VIRTUAL_STAGING_ITEM,
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '32px' }} />
        {sidebarOpen && <span>Artisanet</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {sidebarOpen && <div className="sidebar-section-label">Navigation</div>}
        {menus.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={!sidebarOpen ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}

        {sidebarOpen && <div className="sidebar-section-label" style={{ marginTop: 'auto' }}>Compte</div>}
        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon"></span>
          {sidebarOpen && <span>Mon profil</span>}
        </NavLink>

        <button className="nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
          <span className="nav-icon"></span>
          {sidebarOpen && <span>Déconnexion</span>}
        </button>
      </nav>

      {/* User info */}
      {sidebarOpen && user && (
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--clr-border)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: '#fff', flexShrink: 0,
          }}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{user.role}</div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
