import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const SupplierStatsPage = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, ordRes] = await Promise.all([
          api.get('/products/my'),
          api.get('/orders')
        ]);
        setProducts(prodRes.data.products || []);
        setOrders(ordRes.data.orders || []);
      } catch (err) {}
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Chargement des statistiques...</div>;

  const totalRevenue = orders.filter(o => o.status === 'livrée' || o.status === 'expédiée' || o.status === 'confirmée').reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalStock = products.reduce((acc, p) => acc + (p.stock?.quantity || 0), 0);
  const activeProductsCount = products.filter(p => p.isAvailable).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Statistiques Catalogue</h2>
        <p style={{ color: '#64748b' }}>Analysez vos performances de vente et votre inventaire.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9 }}>Chiffre d'Affaires Brut</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem' }}>{totalRevenue.toFixed(2)} DT</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>Volume Total de Stock</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem', color: '#10b981' }}>{totalStock} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>unités</span></div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>Produits Actifs</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '0.5rem', color: '#8b5cf6' }}>{activeProductsCount} <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>/ {products.length}</span></div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Produits en rupture ou stock bas</h3>
        {products.filter(p => p.stock?.quantity <= 5).length === 0 ? (
          <p style={{ color: '#64748b' }}>Tous vos produits ont un stock sain {'>'} 5.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {products.filter(p => p.stock?.quantity <= 5).map(p => (
              <li key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>{p.name}</span>
                <span style={{ fontWeight: 700, color: p.stock?.quantity === 0 ? '#ef4444' : '#f59e0b' }}>
                  {p.stock?.quantity} restants
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SupplierStatsPage;
