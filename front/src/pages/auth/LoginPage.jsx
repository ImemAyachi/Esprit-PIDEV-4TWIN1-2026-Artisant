import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { loginUser } from '../../store/slices/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/dashboard/home');
    }
  };

  return (
    <div className="auth-page">
      {/* Visual side */}
      <div className="auth-visual">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 400 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '64px', cursor: 'pointer' }} />
          </Link>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
            Bienvenue sur <span style={{ color: 'var(--clr-primary)' }}>Artisanet</span>
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', lineHeight: 1.7 }}>
            La plateforme marketplace BTP qui connecte architectes, ingénieurs, artisans et fournisseurs de matériaux.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['Gestion de chantiers', 'Catalogue matériaux', 'Devis en ligne', 'Suivi financier'].map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--clr-text-muted)', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--clr-primary)' }}> </span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="auth-form-side">
        <div className="auth-box">
          <Link to="/" className="auth-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
            <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '40px' }} />
            <span>Artisanet</span>
          </Link>
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-sub">Accédez à votre espace professionnel</p>


          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="login-email"
                className={`form-input ${errors.email ? 'is-error' : ''}`}
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                {...register('email', { required: 'Email requis' })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
                <label className="form-label" htmlFor="login-password">Mot de passe</label>
                <Link
                  to="/forgot-password"
                  style={{ color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="login-password"
                className={`form-input ${errors.password ? 'is-error' : ''}`}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password', { required: 'Mot de passe requis' })}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', color: '#ef4444', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
