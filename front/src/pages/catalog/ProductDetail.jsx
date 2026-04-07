import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../../store/slices/productSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';

const StarRating = ({ value }) => (
  <div className="stars" style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(n => (
      <span key={n} style={{ 
        color: n <= Math.round(value || 0) ? '#f59e0b' : '#d1d5db', 
        fontSize: '1.2rem',
        cursor: 'default'
      }}>★</span>
    ))}
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: product, loading } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  
  const [orderModal, setOrderModal] = useState(false);
  const [orderData, setOrderData] = useState({ quantity: 1, deliveryAddress: '', projectId: '' });
  const [myProjects, setMyProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', isRecommended: true });
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    dispatch(fetchProductById(id));
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/product/${id}`);
      setReviews(res.data.reviews || []);
    } catch (e) {
      console.error("Error fetching reviews", e);
    }
  };

  const handleOpenOrder = async () => {
    try {
      const res = await api.get('/projects');
      setMyProjects(res.data.projects || []);
      setOrderModal(true);
    } catch(e) { }
  };

  const handlePlaceOrder = async () => {
    try {
      if (!orderData.quantity || !orderData.deliveryAddress) return toast.error("Veuillez remplir les informations de livraison");
      
      const payload = {
        items: [{ product: product._id, quantity: Number(orderData.quantity), unitPrice: parseFloat(product.price) }],
        deliveryAddress: { address: orderData.deliveryAddress || 'Aucune', city: 'Non spécifié' },
        projectId: orderData.projectId || undefined
      };

      await api.post('/orders', payload);
      toast.success("Commande envoyée au fournisseur !");
      setOrderModal(false);
    } catch(e) { 
      toast.error(e.response?.data?.message || "Erreur lors de la commande"); 
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      setReviewError('Veuillez rédiger votre commentaire avant de soumettre votre avis.');
      return;
    }
    setReviewError('');
    try {
      await api.post('/reviews', { productId: id, ...newReview });
      toast.success("Votre avis a été publié !");
      setNewReview({ rating: 5, comment: '', isRecommended: true });
      fetchReviews();
      dispatch(fetchProductById(id)); // Recalculate average
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la publication de l'avis");
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 'var(--radius-xl)' }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
      <div>Produit introuvable</div>
      <button className="btn btn-secondary mt-2" onClick={() => navigate(-1)}>← Retour</button>
    </div>
  );

  const images = product.media?.filter(m => m.type === 'image') || [];
  const pdfs = product.media?.filter(m => m.type === 'pdf') || [];
  const videos = product.media?.filter(m => m.type === 'video') || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ width: 'fit-content' }}>← Retour au catalogue</button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,1fr) minmax(300px,1fr)', gap: '1.5rem' }}>
        {/* Left: Images & Media */}
        <div>
          <div style={{
            borderRadius: 'var(--radius-xl)', overflow: 'hidden',
            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
            height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            {images.length > 0 ? (
              <img src={getImageUrl(images[0].url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '5rem', opacity: 0.3 }}>📦</span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto' }}>
              {images.map((img, i) => (
                <img key={i} src={getImageUrl(img.url)} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--clr-border)' }} />
              ))}
              {videos.map((vid, i) => (
                <div key={i} style={{ width: 60, height: 60, background: '#000', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>▶</div>
              ))}
          </div>

          {videos.length > 0 && (
            <div className="card mt-4">
              <h4>Vidéo de présentation</h4>
              <video src={getImageUrl(videos[0].url)} controls style={{ width: '100%', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }} />
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{product.category}</span>
            <span className={`badge ${product.isAvailable ? 'badge-success' : 'badge-danger'}`}>
              {product.isAvailable ? ' Disponible' : 'Épuisé'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StarRating value={product.rating?.average} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{product.rating?.average?.toFixed(1) || '0.0'}</span>
            <span style={{ color: 'var(--clr-text-muted)' }}>({product.rating?.count || 0} avis)</span>
            <button 
              onClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Donner mon avis
            </button>
          </div>

          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--clr-primary)' }}>
            {product.price} DT <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--clr-text-muted)' }}>/ {product.unit}</span>
          </div>
          
          {(user?.role === 'Artisan' || user?.role === 'Ingenieur') && product.isAvailable && (
            <button className="btn btn-primary" style={{ padding: '1rem', marginTop: '0.5rem', fontSize: '1.1rem' }} onClick={handleOpenOrder}>
              Commander ({product.price} DT / {product.unit})
            </button>
          )}

          {product.stock && (
            <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
              Stock : <strong style={{ color: 'var(--clr-text)' }}>{product.stock.quantity} {product.unit}s</strong>
              {product.stock.minOrderQty > 1 && ` • Commande min : ${product.stock.minOrderQty} ${product.unit}s`}
            </div>
          )}

          <p style={{ color: 'var(--clr-text-muted)', lineHeight: 1.7, borderTop: '1px solid var(--clr-border)', paddingTop: '1rem' }}>
            {product.description}
          </p>

          {/* Supplier */}
          {product.supplier && (
            <div style={{
              background: 'var(--clr-surface2)', borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#fff',
              }}>
                {product.supplier.firstName?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{product.supplier.companyName || `${product.supplier.firstName} ${product.supplier.lastName}`}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Lieu:  {product.supplier.location?.city || 'Tunisie'}</div>
              </div>
            </div>
          )}

          {/* PDF Downloads */}
          {pdfs.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <h5 style={{ marginBottom: '0.5rem' }}>Documents techniques (PDF)</h5>
              {pdfs.map((pdf, i) => (
                <a key={i} href={getImageUrl(pdf.url)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}>
                  📄 Télécharger PDF {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Specifications */}
      {product.specifications?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}> Spécifications techniques</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '0.75rem' }}>
            {product.specifications.map((s, i) => (
              <div key={i} style={{ background: 'var(--clr-surface2)', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>{s.key}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Use cases */}
      {product.useCases?.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}> Cas d'usage</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {product.useCases.map((u, i) => (
              <span key={i} className="badge badge-info">{u}</span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div id="review-section" className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', borderBottom: '2px solid var(--clr-primary)', paddingBottom: '0.5rem', width: 'fit-content' }}>
          Feedback et Avis
        </h2>

        {/* Formulaire pour Architecte */}
        {user?.role === 'Architecte' && (
          <div style={{ background: 'var(--clr-surface2)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Donner mon avis</h4>
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Note :</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <span 
                      key={n} 
                      onClick={() => setNewReview({ ...newReview, rating: n })}
                      style={{ color: n <= newReview.rating ? '#f59e0b' : '#d1d5db', fontSize: '1.5rem', cursor: 'pointer' }}
                    >★</span>
                  ))}
                </div>
              </div>
              <textarea 
                className={`form-input ${reviewError ? 'is-error' : ''}`}
                placeholder="Votre retour sur la qualité du produit..." 
                rows="3"
                value={newReview.comment}
                onChange={e => { setNewReview({ ...newReview, comment: e.target.value }); if (reviewError) setReviewError(''); }}
              />
              {reviewError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--radius-md)', padding: '0.6rem 1rem',
                  color: '#ef4444', fontSize: '0.875rem', fontWeight: 500
                }}>
                  <span style={{ fontSize: '1rem' }}>⚠</span> {reviewError}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Recommandez-vous ce produit ?</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" checked={newReview.isRecommended} onChange={() => setNewReview({ ...newReview, isRecommended: true })} /> Oui
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" checked={!newReview.isRecommended} onChange={() => setNewReview({ ...newReview, isRecommended: false })} /> Non
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }}>
                Soumettre l'avis
              </button>
            </form>
          </div>
        )}

        {/* Liste des avis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.length > 0 ? (
            reviews.map((rev, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700 }}>{rev.author?.firstName} {rev.author?.lastName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{new Date(rev.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <StarRating value={rev.rating} />
                  {rev.isRecommended && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Recommandé</span>}
                </div>
                <p style={{ fontStyle: 'italic', color: 'var(--clr-text)' }}>"{rev.comment}"</p>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', padding: '1rem' }}>Aucun avis pour le moment.</p>
          )}
        </div>
      </div>

      {/* Modal Commande */}
      {orderModal && (
        <div className="modal-overlay" onClick={() => setOrderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📦 Commander : {product.name}</div>
              <button className="btn-ghost" onClick={() => setOrderModal(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Quantité en {product.unit}</label>
                <input className="form-input" type="number" min="1" max={product.stock?.quantity || 1000} value={orderData.quantity} onChange={e => setOrderData(o => ({...o, quantity: e.target.value}))} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Détails de Livraison (Adresse complête, tél, etc.) *</label>
                <textarea className="form-input" rows={3} placeholder="Saisissez vos instructions et adresse de livraison..." value={orderData.deliveryAddress} onChange={e => setOrderData(o => ({...o, deliveryAddress: e.target.value}))}></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Lier à un de mes chantiers (Optionnel)</label>
                <select className="form-input form-select" value={orderData.projectId} onChange={e => setOrderData(o => ({...o, projectId: e.target.value}))}>
                  <option value="">-- Aucun chantier spécifique --</option>
                  {myProjects.map(p => (
                    <option key={p._id} value={p._id}>{p.title}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem' }}>
                  En liant cette commande à un chantier, vous pourrez l'enregistrer automatiquement dans les frais et recalculer votre rentabilité lors de la réception.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--clr-border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--clr-primary)' }}>Total : {((parseFloat(product.price) || 0) * (Number(orderData.quantity) || 1)).toFixed(2)} DT</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={() => setOrderModal(false)}>Annuler</button>
                  <button className="btn btn-primary" onClick={handlePlaceOrder}>Confirmer la commande</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
