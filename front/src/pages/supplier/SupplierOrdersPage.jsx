import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SupplierOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders);
    } catch (err) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      toast.success(`Commande ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error('Erreur de mise à jour');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Commandes Reçues</h2>
        <p style={{ color: '#64748b' }}>Gérez les commandes passées par vos artisans partenaires.</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px' }}>
          Vous n'avez reçu aucune commande pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order._id} style={{
              background: '#fff', borderRadius: '16px', padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
              display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
                    Commande #{order._id.substring(0, 8).toUpperCase()}
                  </h3>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    🗓 {new Date(order.createdAt).toLocaleDateString()} &nbsp;•&nbsp; 
                    👤 {order.buyer?.firstName} {order.buyer?.lastName}
                  </div>
                </div>
                <div style={{
                  padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem',
                  background: order.status === 'en attente' ? '#fef08a' :
                              order.status === 'confirmée' ? '#bae6fd' :
                              order.status === 'expédiée' ? '#c7d2fe' :
                              order.status === 'livrée' ? '#bbf7d0' : '#fecaca',
                  color: order.status === 'en attente' ? '#854d0e' :
                         order.status === 'confirmée' ? '#0369a1' :
                         order.status === 'expédiée' ? '#4338ca' :
                         order.status === 'livrée' ? '#15803d' : '#b91c1c'
                }}>
                  {order.status.toUpperCase()}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.9rem', color: '#475569' }}>Détail des articles :</strong>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#334155' }}>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}x {item.product?.name || 'Produit inconnu'} ({(item.price || 0).toFixed(2)} DT unitaire)
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                  Total: {order.totalAmount?.toFixed(2)} DT
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {order.status === 'en attente' && (
                    <>
                      <button onClick={() => updateStatus(order._id, 'annulée')} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Refuser</button>
                      <button onClick={() => updateStatus(order._id, 'confirmée')} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Confirmer (En stock)</button>
                    </>
                  )}
                  {order.status === 'confirmée' && (
                    <button onClick={() => updateStatus(order._id, 'expédiée')} style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Marquer comme Expédiée</button>
                  )}
                  {order.status === 'expédiée' && (
                    <button onClick={() => updateStatus(order._id, 'livrée')} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Marquer comme Livrée</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierOrdersPage;
