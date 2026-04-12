import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProductsCarousel from '../components/landing/ProductsCarousel';

const FEATURES = [
  {
    icon: '', title: 'Gestion de Chantiers',
    desc: 'Planifiez vos projets, gérez les équipes et suivez l\'avancement en temps réel.',
    color: '#f59e0b',
  },
  {
    icon: '', title: 'Catalogue Matériaux',
    desc: 'Accédez à une large gamme de matériaux : marbre, ciment, carrelage, et plus encore.',
    color: '#3b82f6',
  },
  {
    icon: '', title: 'Réseau d\'Artisans',
    desc: 'Trouvez des artisans qualifiés par métier, localisation et note client.',
    color: '#10b981',
  },
  {
    icon: '', title: 'Gestion des Devis',
    desc: 'Envoyez et recevez des devis détaillés. Acceptez ou refusez en un clic.',
    color: '#8b5cf6',
  },
  {
    icon: '', title: 'Suivi Financier',
    desc: 'Les artisans suivent leurs dépenses et calculent automatiquement leur rentabilité par chantier.',
    color: '#ef4444',
  },
  {
    icon: '', title: 'Avis & Notes',
    desc: 'Consultez et partagez des avis qualifiés sur les produits et les prestations.',
    color: '#f59e0b',
  },
];

const ROLES = [
  { emoji: '', name: 'Architecte', desc: 'Recherche artisans & catalogue produits', color: '#f59e0b' },
  { emoji: '', name: 'Ingénieur', desc: 'Gestion de chantiers & main d\'œuvre', color: '#3b82f6' },
  { emoji: '', name: 'Artisan', desc: 'Devis, commandes & suivi financier', color: '#10b981' },
  { emoji: '', name: 'Fournisseur', desc: 'Catalogue produits & gestion stocks', color: '#8b5cf6' },
];

const STATS = [
  { value: '500+', label: 'Artisans certifiés' },
  { value: '50+', label: 'Fournisseurs partenaires' },
  { value: '200+', label: 'Chantiers actifs' },
  { value: '98%', label: 'Satisfaction client' },
];

const LandingPage = () => {
  const { isAuthenticated } = useSelector((s) => s.auth);

  return (
    <div style={{ background: 'var(--clr-bg)', minHeight: '100vh' }}>
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        {/* Navbar */}
        <nav className="nav-landing">
          <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '40px' }} />
            <span>Artisanet</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAuthenticated ? (
              <Link to="/dashboard/home" className="btn btn-primary">Mon espace</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Connexion</Link>
                <Link to="/register" className="btn btn-primary">S'inscrire</Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero content */}
        <div className="hero-content">
          <h1 className="hero-title">

            Connectez{' '}
            <span className="gradient-text">Architectes, Artisans</span>
            {' '}& Fournisseurs
          </h1>
          <p className="hero-desc">
            Artisanet est la plateforme tout-en-un pour les professionnels du bâtiment.
            Trouvez les bons artisans, les meilleurs matériaux et gérez vos chantiers en temps réel.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Commencer gratuitement

            </Link>
            <Link to="/dashboard/catalog" className="btn btn-secondary btn-lg">
              Voir le catalogue
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: '1px', background: 'var(--clr-border)',
            borderTop: '1px solid var(--clr-border)',
            position: 'relative', zIndex: 10,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(10,15,30,0.9)' }}
            >
              <div className="stat-landing-value">{s.value}</div>
              <div className="stat-landing-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Roles ──────────────────────────────────────────────────── */}
      <section className="roles-section">
        <div className="container text-center">
          <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Pour qui ?</div>
          <h2>Une plateforme, <span style={{ color: 'var(--clr-primary)' }}>quatre communautés</span></h2>
          <p style={{ color: 'var(--clr-text-muted)', maxWidth: 600, margin: '1rem auto 0' }}>
            Chaque utilisateur dispose d'un espace personnalisé adapté à son métier.
          </p>
          <div className="roles-grid" style={{ marginTop: '3rem' }}>
            {ROLES.map((r) => (
              <div key={r.name} className="role-card">
                <div className="role-name">{r.name}</div>
                <div className="role-desc">{r.desc}</div>
                <Link
                  to="/register"
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: 'auto', borderColor: r.color, color: r.color }}
                >
                  Rejoindre
                </Link>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Products Carousel ───────────────────────────────────── */}
      <ProductsCarousel />

      {/* ─── Features ──────────────────────────────────────────────── */}
      <section className="features-section">
        <div className="container text-center">
          <div className="hero-badge" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Fonctionnalités</div>
          <h2>Tout ce dont vous avez besoin</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 5%', textAlign: 'center', background: 'var(--clr-bg)' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(59,130,246,0.1))',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 'var(--radius-xl)', padding: '3rem', maxWidth: 700, margin: '0 auto',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Prêt à rejoindre Artisanet ?</h2>
          <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem' }}>
            Inscription gratuite. Accès immédiat au catalogue et aux artisans.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Créer mon compte

          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--clr-border)', padding: '2rem 5%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--clr-primary)', fontWeight: 700, fontSize: '1rem' }}>
          <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '24px' }} />
          <span>Artisanet</span>
        </div>
        <div>© 2024 Artisanet — Plateforme marketplace BTP Tunisie</div>
      </footer>
    </div>
  );
};

export default LandingPage;
