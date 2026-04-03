import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ minHeight: '100vh', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
    <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🏗️</div>
    <h1 style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--clr-primary)', marginBottom: '0.5rem' }}>404</h1>
    <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Page introuvable</div>
    <p style={{ color: 'var(--clr-text-muted)', marginBottom: '2rem' }}>Ce chantier est encore en construction... 😄</p>
    <Link to="/" className="btn btn-primary btn-lg">← Retour à l'accueil</Link>
  </div>
);

export default NotFoundPage;
