import React from 'react';
import { Link } from 'react-router-dom';
import AIProjectPlanner from '../components/dashboard/AIProjectPlanner';
import '../styles/planner-pidev.css';

export default function ProjectPlannerPage() {
  return (
    <div className="hero" style={{ minHeight: '100vh' }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <nav className="nav-landing">
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '40px' }} />
          <span>Artisanet</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/login" className="btn btn-secondary">
            Connexion
          </Link>
          <Link to="/register" className="btn btn-primary">
            S'inscrire
          </Link>
        </div>
      </nav>

      <header className="hero-content" style={{ paddingBottom: '2rem' }}>
        <div className="hero-badge">AI Planner</div>
        <h1 className="hero-title">
          Plan de <span className="gradient-text">production</span>
        </h1>
        <p className="hero-desc">
          Une expérience “PDF‑ready” sur le web: saisissez votre brief, générez un plan structuré, puis exportez en PDF.
        </p>
      </header>

      <main style={{ position: 'relative', zIndex: 10, paddingBottom: '4rem' }}>
        <div className="container px-6 sm:px-10 flex justify-center">
          <div className="planner-pidev w-full max-w-[1240px] px-6 sm:px-10">
            <AIProjectPlanner />
          </div>
        </div>
      </main>
    </div>
  );
}
