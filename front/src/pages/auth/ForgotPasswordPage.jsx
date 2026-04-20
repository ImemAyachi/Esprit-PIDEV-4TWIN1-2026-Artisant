import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data?.message || 'Si un compte existe, un e-mail a été envoyé.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible d’envoyer l’e-mail');
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
            Récupérez votre <span style={{ color: 'var(--clr-primary)' }}>compte</span>
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', lineHeight: 1.7 }}>
            Entrez votre e-mail et nous vous enverrons les instructions pour réinitialiser votre mot de passe.
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

          <h1 className="auth-title">Mot de passe oublié</h1>
          <p className="auth-sub">Recevez un lien de réinitialisation par e-mail</p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                className={`form-input ${errors.email ? 'is-error' : ''}`}
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                {...register('email', { required: 'Email requis' })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi...' : 'Envoyer le lien →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
            Vous avez déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

