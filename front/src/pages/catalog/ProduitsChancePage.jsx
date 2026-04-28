import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Zap, TrendingDown, ArrowRight, Bell, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProduitsChancePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/products/lucky-deals');
        setProducts(res.data.products || []);
      } catch (e) {
        console.error("Erreur chargement deals", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
        borderRadius: '32px', padding: '3rem', color: '#fff', marginBottom: '3rem',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1.25rem', borderRadius: '100px', marginBottom: '1.5rem' }}>
            <Zap size={18} fill="#fff" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Opportunités PriceRadar 2.0</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.03em' }}>Produits Chance</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px' }}>
            Découvrez les meilleures offres du marché BTP en temps réel. Notre algorithme sélectionne pour vous les produits dont le prix est exceptionnellement bas par rapport à la moyenne.
          </p>
        </div>
        <div style={{ position: 'absolute', right: '-50px', bottom: '-50px', opacity: 0.2 }}>
            <TrendingDown size={300} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 800 }}>{products.length} Opportunités détectées</h3>
        <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={18} /> M'alerter des nouveaux arrivages
        </button>
      </div>

      {loading ? (
        <div className="grid-auto">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 350, borderRadius: 24 }} />)}</div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem' }}>
            <p style={{ color: 'var(--clr-text-muted)' }}>Aucune opportunité exceptionnelle n'est disponible pour le moment. Revenez plus tard !</p>
        </div>
      ) : (
        <div className="grid-auto" style={{ gap: '2rem' }}>
          {products.map(p => (
            <div key={p._id} className="premium-product-card" style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', top: '1.5rem', right: '1.5rem', 
                background: '#10b981', color: '#fff', padding: '0.5rem 1rem', 
                borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)', zIndex: 2
              }}>
                -{Math.abs(p.priceRadar.deviationPercent)}%
              </div>

              <div style={{ height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', background: '#f1f5f9' }}>
                <img 
                  src={p.mainImage || '/placeholder-bg.png'} 
                  alt={p.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--clr-primary)' }}>{p.category}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>Score: {p.priceRadar.opportunityScore}</span>
                </div>
              </div>

              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>{p.name}</h4>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{p.price} DT</div>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', textDecoration: 'line-through' }}>{p.priceRadar.marketAvg} DT</div>
              </div>

              <Link to={`/dashboard/catalog/${p._id}`} className="btn btn-primary" style={{ width: '100%', borderRadius: '12px', background: '#0f172a', borderColor: '#0f172a' }}>
                Voir l'offre <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProduitsChancePage;
