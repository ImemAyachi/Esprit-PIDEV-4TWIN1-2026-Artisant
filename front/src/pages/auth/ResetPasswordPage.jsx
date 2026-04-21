import React, { useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = (searchParams.get('token') || '').trim();
  const email = (searchParams.get('email') || '').trim();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const missingParams = useMemo(() => !token, [token]);

  const onSubmit = async ({ password }) => {
    try {
      await api.post('/auth/reset-password', { email, token, password });
      toast.success('Mot de passe mis à jour. Vous pouvez vous connecter.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 420 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
            <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '64px', cursor: 'pointer' }} />
          </Link>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>
            Nouveau <span style={{ color: 'var(--clr-primary)' }}>mot de passe</span>
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', lineHeight: 1.7 }}>
            Choisissez un mot de passe d’au moins 8 caractères.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-box">
          <Link
            to="/"
            className="auth-logo"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}
          >
            <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '40px' }} />
            <span>Artisanet</span>
          </Link>

          <h1 className="auth-title">Réinitialisation</h1>
          <p className="auth-sub">Définissez votre nouveau mot de passe</p>

          {missingParams ? (
            <p style={{ color: 'var(--clr-danger)', fontSize: '0.95rem' }}>
              Lien incomplet ou expiré.{' '}
              <Link to="/forgot-password" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>
                Demander un nouveau lien
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
                {email ? (
                  <>Compte : <strong>{email}</strong></>
                ) : (
                  <>Compte lié à ce lien de réinitialisation</>
                )}
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-password">Nouveau mot de passe</label>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  className={`form-input ${errors.password ? 'is-error' : ''}`}
                  placeholder="Minimum 8 caractères"
                  {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Minimum 8 caractères' } })}
                />
                {errors.password && <span className="form-error">{errors.password.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer →'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
            <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
