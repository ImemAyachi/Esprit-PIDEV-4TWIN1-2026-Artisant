import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { registerUser, verify2FACode } from '../../store/slices/authSlice';
import FaceCapture from '../../components/auth/FaceCapture';

const ROLES = [
  { value: 'Architecte', label: 'Architecte', emoji: '' },
  { value: 'Ingenieur', label: 'Ingénieur', emoji: '' },
  { value: 'Artisan', label: 'Artisan', emoji: '' },
  { value: 'Fournisseur', label: 'Fournisseur', emoji: '' },
];

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, require2FA, tempEmail } = useSelector((s) => s.auth);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues: { role: '' } });
  const [selectedRole, setSelectedRole] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [showFaceCapture, setShowFaceCapture] = useState(true);

  const watchRole = watch('role');

  const selectRole = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data) => {
    if (require2FA) {
      const result = await dispatch(verify2FACode({ email: tempEmail, code: data.code }));
      if (result.meta.requestStatus === 'fulfilled') {
        navigate('/dashboard/home');
      }
    } else {
      const payload = { ...data };
      if (faceDescriptor) payload.faceDescriptor = faceDescriptor;
      const result = await dispatch(registerUser(payload));
      if (result.meta.requestStatus === 'fulfilled' && !result.payload.require2FA) {
        navigate('/dashboard/home');
      }
    }
  };

  return (
    <div className="auth-page">
      {/* Visual */}
      <div className="auth-visual">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
            <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '64px', cursor: 'pointer' }} />
          </Link>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem' }}>
            Rejoignez la communauté <span style={{ color: 'var(--clr-primary)' }}>Artisanet</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
            {ROLES.map((r) => (
              <div key={r.value} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center',
              }}>
                <div style={{ fontWeight: 600, fontSize: '1.2rem', marginTop: '0.4rem' }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="auth-form-side" style={{ overflowY: 'auto' }}>
        <div className="auth-box">
          <Link to="/" className="auth-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
            <img src="/Logo-artisanet.png" alt="Artisanet" style={{ height: '40px' }} />
            <span>Artisanet</span>
          </Link>
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-sub">Choisissez votre rôle et commencez</p>

          {!require2FA ? (
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Role Selector */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.6rem' }}>Votre rôle *</label>
                <div className="role-selector">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r.value}
                      id={`role-${r.value.toLowerCase()}`}
                      className={`role-btn ${selectedRole === r.value ? 'selected' : ''}`}
                      onClick={() => selectRole(r.value)}
                    >
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('role', { required: 'Choisissez un rôle' })} />
                {errors.role && <span className="form-error">{errors.role.message}</span>}
              </div>

              {/* Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input id="reg-firstname" className="form-input" placeholder="Sarra" autoComplete="given-name" {...register('firstName', { required: 'Requis' })} />
                  {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input id="reg-lastname" className="form-input" placeholder="Ben Ali" autoComplete="family-name" {...register('lastName', { required: 'Requis' })} />
                  {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input id="reg-email" className="form-input" type="email" placeholder="votre@email.com" autoComplete="email"
                  {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })} />
                {errors.email && <span className="form-error">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input id="reg-phone" className="form-input" placeholder="+216 XX XXX XXX" autoComplete="tel" {...register('phone')} />
              </div>

              {/* Artisan specific */}
              {selectedRole === 'Artisan' && (
                <div className="form-group">
                  <label className="form-label">Métier *</label>
                  <select id="reg-craft" className="form-input form-select" {...register('craft', { required: selectedRole === 'Artisan' ? 'Métier requis' : false })}>
                    <option value="">Sélectionnez votre métier</option>
                    {['maçon', 'plombier', 'électricien', 'peintre', 'carreleur', 'menuisier', 'autre'].map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  {errors.craft && <span className="form-error">{errors.craft.message}</span>}
                </div>
              )}

              {/* Fournisseur specific */}
              {selectedRole === 'Fournisseur' && (
                <div className="form-group">
                  <label className="form-label">Nom de l'entreprise *</label>
                  <input id="reg-company" className="form-input" placeholder="Mon Entreprise SARL" {...register('companyName', { required: selectedRole === 'Fournisseur' ? 'Requis' : false })} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Mot de passe *</label>
                <input id="reg-password" className="form-input" type="password" placeholder="Minimum 8 caractères" autoComplete="new-password"
                  {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Minimum 8 caractères' } })} />
                {errors.password && <span className="form-error">{errors.password.message}</span>}
              </div>

              {/* ── Optional Face Enrollment ─────────────────────── */}
              {showFaceCapture && (
                <FaceCapture
                  onCapture={(descriptor) => setFaceDescriptor(descriptor)}
                  onSkip={() => setShowFaceCapture(false)}
                />
              )}

              {!showFaceCapture && faceDescriptor && (
                <div className="face-capture-success" style={{ fontSize: '0.8rem' }}>
                  <div className="face-capture-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  Visage enregistré
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', color: '#ef4444', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <button id="register-submit" type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? 'Création...' : 'Créer mon compte →'}
              </button>
            </form>
          ) : (
            // Étape 2 : Vérification du Code 2FA
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
                Un e-mail de confirmation contenant un code à 6 chiffres a été envoyé à <strong>{tempEmail}</strong>.<br/>Veuillez le saisir ci-dessous pour finaliser votre inscription.
              </p>
              
              <div className="form-group">
                <label className="form-label">Code de confirmation (6 chiffres)</label>
                <input
                  id="register-code"
                  className={`form-input ${errors.code ? 'is-error' : ''}`}
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem', fontWeight: 'bold' }}
                  {...register('code', { 
                    required: 'Code requis',
                    pattern: { value: /^[0-9]{6}$/, message: 'Doit contenir exactement 6 chiffres' } 
                  })}
                />
                {errors.code && <span className="form-error">{errors.code.message}</span>}
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', color: '#ef4444', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

              <button
                id="verify-submit"
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? 'Vérification...' : 'Valider le code →'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
