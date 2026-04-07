import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  pending: 'EN ATTENTE', confirmed: 'CONFIRMÉE', processing: 'EN TRAITEMENT',
  shipped: 'EXPÉDIÉE', delivered: 'LIVRÉE', cancelled: 'ANNULÉE',
};
const STATUS_COLORS = {
  pending:    { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  confirmed:  { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  processing: { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  shipped:    { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
  delivered:  { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  cancelled:  { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
};

const SupplierOrdersPage = () => {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  // Map orderId → true/false : a-t-on déjà une facture ?
  const [invoiceMap, setInvoiceMap]   = useState({});
  const [generating, setGenerating]   = useState({}); // orderId → bool

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const list = res.data.orders;
      setOrders(list);

      // Pré-charger le statut des factures pour toutes les commandes confirmées+
      const nonPending = list.filter(o => o.status !== 'pending' && o.status !== 'cancelled');
      const checks = await Promise.all(
        nonPending.map(o => api.get(`/orders/${o._id}/invoice`).then(r => ({ id: o._id, has: !!r.data.invoice })))
      );
      const map = {};
      checks.forEach(c => { map[c.id] = c.has; });
      setInvoiceMap(map);
    } catch {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      toast.success('Statut mis à jour');
      fetchOrders();
    } catch {
      toast.error('Erreur de mise à jour');
    }
  };

  const generateInvoice = async (orderId) => {
    setGenerating(g => ({ ...g, [orderId]: true }));
    try {
      const res = await api.post(`/orders/${orderId}/generate-invoice`);
      if (res.data.alreadyExists) {
        toast('Facture déjà générée', { icon: 'ℹ️' });
      } else {
        toast.success('Facture générée et envoyée à l\'artisan !');
      }
      setInvoiceMap(m => ({ ...m, [orderId]: true }));
    } catch {
      toast.error('Erreur lors de la génération de la facture');
    } finally {
      setGenerating(g => ({ ...g, [orderId]: false }));
    }
  };

  if (loading) return (
    <div style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Commandes Reçues</h2>
        <p style={{ color: '#64748b' }}>Gérez les commandes et générez les factures pour vos artisans.</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          Vous n'avez reçu aucune commande pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => {
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            const hasInvoice = invoiceMap[order._id];
            const isGenerating = generating[order._id];
            const canGenerate = ['confirmed', 'shipped', 'delivered'].includes(order.status);

            return (
              <div key={order._id} style={{
                background: '#fff', borderRadius: '20px', padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', gap: '1.25rem',
                transition: 'box-shadow 0.2s',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                        Commande #{order._id.substring(0, 8).toUpperCase()}
                      </h3>
                      <span style={{
                        padding: '0.3rem 0.9rem', borderRadius: '99px', fontWeight: 700, fontSize: '0.78rem',
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                      }}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      {hasInvoice && (
                        <span style={{ padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          🧾 Facture générée
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                      📅 {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      &nbsp;•&nbsp; 👤 {order.buyer?.firstName} {order.buyer?.lastName}
                    </div>
                  </div>
                </div>

                {/* Articles */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Articles</div>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < order.items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                          {item.quantity} {item.product?.unit || 'u'}
                        </span>
                        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{item.product?.name || 'Produit inconnu'}</span>
                      </div>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                        {(item.unitPrice || 0).toFixed(2)} DT/{item.product?.unit || 'u'} → <strong style={{ color: '#1e293b' }}>{((item.unitPrice || 0) * item.quantity).toFixed(2)} DT</strong>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>
                      {order.totalAmount?.toFixed(2)} DT
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>📍 {order.deliveryAddress?.address}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Actions statut */}
                    {order.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(order._id, 'cancelled')}
                          style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                          Refuser
                        </button>
                        <button onClick={() => updateStatus(order._id, 'confirmed')}
                          style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                          ✓ Confirmer
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button onClick={() => updateStatus(order._id, 'shipped')}
                        style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #c7d2fe', background: '#e0e7ff', color: '#4f46e5', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                        🚚 Marquer Expédiée
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button onClick={() => updateStatus(order._id, 'delivered')}
                        style={{ padding: '0.55rem 1rem', borderRadius: '10px', border: '1px solid #bbf7d0', background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                        ✅ Marquer Livrée
                      </button>
                    )}

                    {/* Bouton Générer Facture */}
                    {canGenerate && (
                      <button
                        onClick={() => !hasInvoice && generateInvoice(order._id)}
                        disabled={isGenerating || hasInvoice}
                        style={{
                          padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: hasInvoice ? 'default' : 'pointer',
                          border: hasInvoice ? '1px solid #bbf7d0' : '1px solid #c7d2fe',
                          background: hasInvoice ? '#f0fdf4' : 'linear-gradient(135deg, #6366f1, #3b82f6)',
                          color: hasInvoice ? '#15803d' : '#fff',
                          opacity: isGenerating ? 0.7 : 1,
                          transition: 'all 0.2s',
                          boxShadow: hasInvoice ? 'none' : '0 2px 8px rgba(99,102,241,0.3)',
                        }}
                      >
                        {isGenerating ? '⏳ Génération...' : hasInvoice ? '🧾 Facture envoyée' : '🧾 Générer la facture'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplierOrdersPage;
