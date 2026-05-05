import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, fetchMe } from '../../store/slices/authSlice';
import api from '../../services/api';
import { Edit3, Save, X, User as UserIcon, Briefcase, MessageSquareText, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [receivedReviews, setReceivedReviews] = useState([]);

  useEffect(() => {
    if (user?.role !== 'Artisan' || !user._id) return;
    dispatch(fetchMe());
    (async () => {
      try {
        const res = await api.get(`/reviews/artisan/${user._id}`);
        setReceivedReviews(res.data.reviews || []);
      } catch {
        setReceivedReviews([]);
      }
    })();
  }, [user?.role, user?._id, dispatch]);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
    specialization: user?.specialization || '',
    experience: user?.experience || '',
    craft: user?.craft || '',
    location: { city: user?.location?.city || '' }
  });


  if (!user) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setFormData({ ...formData, location: { ...formData.location, city: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = () => {
    dispatch(updateProfile(formData));
    setIsEditing(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>

      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: '3rem 2rem' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--grad-primary)', height: 120, opacity: 0.1, zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%', background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '2.5rem', color: '#fff', border: '5px solid var(--clr-surface)',
            overflow: 'hidden', boxShadow: 'var(--shadow-lg)', marginBottom: '1.5rem'
          }}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>

          {!isEditing ? (
            <>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{user.firstName} {user.lastName}</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{user.role}</span>
                <span className={`badge ${user.isVerified ? 'badge-success' : 'badge-muted'}`}>
                  {user.isVerified ? '✓ Vérifié' : 'En attente'}
                </span>
              </div>
              <button className="btn btn-secondary mt-4" onClick={() => setIsEditing(true)}>
                <Edit3 size={16} style={{ marginRight: '0.5rem' }} /> Modifier le profil
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
               <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                 <Save size={16} style={{ marginRight: '0.5rem' }} /> Enregistrer
               </button>
               <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                 <X size={16} style={{ marginRight: '0.5rem' }} /> Annuler
               </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserIcon size={20} className="text-primary" /> Informations Personnelles
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Prénom</label>
            <input 
              className="form-input" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleInputChange} 
              disabled={!isEditing} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input 
              className="form-input" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleInputChange} 
              disabled={!isEditing} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email (Non modifiable)</label>
            <input className="form-input" value={user.email} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input 
              className="form-input" 
              name="phone" 
              value={formData.phone} 
              onChange={handleInputChange} 
              disabled={!isEditing} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ville</label>
            <input 
              className="form-input" 
              name="city" 
              value={formData.location.city} 
              onChange={handleInputChange} 
              disabled={!isEditing} 
            />
          </div>
        </div>
      </div>

      {(user.role !== 'SuperAdmin') && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={20} className="text-primary" /> Détails Professionnels ({user.role})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {user.role === 'Artisan' && (
              <div className="form-group">
                <label className="form-label">Métier / Spécialité</label>
                <select className="form-input" name="craft" value={formData.craft} onChange={handleInputChange} disabled={!isEditing}>
                   <option value="maçon">Maçon</option>
                   <option value="plombier">Plombier</option>
                   <option value="électricien">Électricien</option>
                   <option value="peintre">Peintre</option>
                   <option value="carreleur">Carreleur</option>
                   <option value="menuisier">Menuisier</option>
                   <option value="autre">Autre</option>
                </select>
              </div>
            )}

            {(user.role === 'Fournisseur' || user.companyName) && (
              <div className="form-group">
                <label className="form-label">Nom de l'entreprise</label>
                <input className="form-input" name="companyName" value={formData.companyName} onChange={handleInputChange} disabled={!isEditing} />
              </div>
            )}

            {(user.role === 'Architecte' || user.role === 'Ingenieur') && (
               <div className="form-group">
                 <label className="form-label">Spécialisation</label>
                 <input className="form-input" name="specialization" value={formData.specialization} onChange={handleInputChange} disabled={!isEditing} />
               </div>
            )}

            <div className="form-group">
              <label className="form-label">Années d'expérience</label>
              <input type="number" className="form-input" name="experience" value={formData.experience} onChange={handleInputChange} disabled={!isEditing} />
            </div>
          </div>
        </div>
      )}

      {(user.rating?.count > 0 || user.role === 'Fournisseur') && (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '2rem' }}>
          {user.rating?.count > 0 && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--clr-primary)' }}>{user.rating.average?.toFixed(1)}</div>
                <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>Note moyenne</div>
              </div>
              <div style={{ width: 1, height: 60, background: 'var(--clr-border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--clr-primary)' }}>{user.rating.count}</div>
                <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>Avis reçus</div>
              </div>
            </>
          )}
          
          {user.role === 'Fournisseur' && (
            <>
              {user.rating?.count > 0 && <div style={{ width: 1, height: 60, background: 'var(--clr-border)' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: (user.supplierTrustScore || 80) >= 80 ? '#10b981' : (user.supplierTrustScore || 80) >= 50 ? '#f59e0b' : '#ef4444' }}>
                  {user.supplierTrustScore || 80}%
                </div>
                <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={14} /> Confiance Tarifaire
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {user.role === 'Artisan' && receivedReviews.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquareText size={20} className="text-primary" /> Retours clients (chantiers et avis)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {receivedReviews.map((r) => (
              <div
                key={r._id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--clr-border)',
                  background: 'var(--clr-surface2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {r.author?.firstName} {r.author?.lastName}
                      <span style={{ color: 'var(--clr-text-muted)', fontWeight: 500, fontSize: '0.85rem' }}> · {r.author?.role}</span>
                    </div>
                    {r.project?.title && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--clr-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                        Chantier : {r.project.title}
                      </div>
                    )}
                  </div>
                  <span style={{ color: '#f59e0b', fontWeight: 800, whiteSpace: 'nowrap' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p style={{ margin: '0.75rem 0 0', lineHeight: 1.6 }}>{r.comment}</p>}
                <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>
                  {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
