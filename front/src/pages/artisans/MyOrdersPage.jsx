import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  const fetchData = async () => {
    try {
      const [oRes, pRes] = await Promise.all([
        api.get('/orders'),
        api.get('/projects')
      ]);
      setOrders(oRes.data.orders);
      setProjects(pRes.data.projects);
    } catch (err) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [selectedProjects, setSelectedProjects] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({ quantity: 1, address: '' });

  const transformToExpense = async (order) => {
    const projId = selectedProjects[order._id] || order.project;
    if (!projId) {
      return toast.error("Veuillez sélectionner un chantier pour lier cette dépense");
    }
    
    try {
      await api.post(`/projects/${projId}/expenses`, {
        description: `Matériel: ${order.items[0]?.product?.name || 'Commande'}`,
        amount: order.totalAmount,
        category: 'matériaux'
      });
      toast.success("Achat lié au projet avec succès ! Le bénéfice s'est recalcule.");
    } catch (e) {
      toast.error("Erreur, impossible de lier cet achat.");
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette commande ?')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Commande annulée');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setEditFormData({
      quantity: order.items[0]?.quantity || 1,
      address: order.deliveryAddress?.address || ''
    });
  };

  const handleUpdateOrder = async () => {
    try {
      const items = [...editingOrder.items];
      if (items[0]) {
        items[0] = { ...items[0], quantity: Number(editFormData.quantity) };
      }
      
      await api.put(`/orders/${editingOrder._id}`, {
        items,
        deliveryAddress: { ...editingOrder.deliveryAddress, address: editFormData.address }
      });
      
      toast.success('Commande mise à jour');
      setEditingOrder(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Mes Achats Fournisseurs</h2>
        <p style={{ color: '#64748b' }}>Suivez l'état de vos commandes de matériaux et reliez-les à vos chantiers.</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px' }}>
          Vous n'avez passé aucune commande.
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
                    Achat #{order._id.substring(0, 8).toUpperCase()}
                  </h3>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {new Date(order.createdAt).toLocaleDateString()} &nbsp;•&nbsp; 
                    {order.supplier?.companyName || `${order.supplier?.firstName} ${order.supplier?.lastName}`}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem',
                    background: order.status === 'pending' ? '#fef08a' :
                                order.status === 'confirmed' ? '#bae6fd' :
                                order.status === 'shipped' ? '#c7d2fe' :
                                order.status === 'delivered' ? '#dcfce7' : '#fecaca',
                    color: order.status === 'pending' ? '#854d0e' :
                           order.status === 'confirmed' ? '#0369a1' :
                           order.status === 'shipped' ? '#4338ca' :
                           order.status === 'delivered' ? '#166534' : '#b91c1c'
                  }}>
                    {order.status === 'pending' ? 'EN ATTENTE' : 
                     order.status === 'confirmed' ? 'CONFIRMÉE' : 
                     order.status === 'shipped' ? 'EXPÉDIÉE' : 
                     order.status === 'delivered' ? 'LIVRÉE' : 'ANNULÉE'}
                  </div>
                  
                  {order.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditClick(order)}
                        style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '6px' }}
                        onMouseOver={(e) => e.target.style.background = '#eff6ff'}
                        onMouseOut={(e) => e.target.style.background = 'none'}
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order._id)}
                        style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0.2rem 0.5rem', borderRadius: '6px' }}
                        onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                        onMouseOut={(e) => e.target.style.background = 'none'}
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.9rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Détail des articles achetés</strong>
                <ul style={{ margin: '0.75rem 0 0 0', color: '#334155', listStyleType: 'none', padding: 0 }}>
                  {order.items.map((item, idx) => (
                    <li key={idx} style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>{item.quantity} {item.product?.unit || 'unité'}s</span>
                      <span style={{ fontWeight: 600, fontSize: '1rem', color: '#0f172a' }}>{item.product?.name || 'Produit inconnu'}</span>
                      <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>{(item.unitPrice || 0).toFixed(2)} DT / {item.product?.unit || 'unité'}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                    Total: {order.totalAmount?.toFixed(2)} DT
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Livraison à : {order.deliveryAddress?.address}
                  </div>
                </div>

                {order.status === 'delivered' && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                      className="form-input form-select" 
                      style={{ padding: '0.5rem', width: '200px' }}
                      value={selectedProjects[order._id] || order.project || ''}
                      onChange={e => setSelectedProjects(p => ({ ...p, [order._id]: e.target.value }))}
                    >
                      <option value="">-- Choisir un Chantier --</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                    </select>
                    <button 
                      onClick={() => transformToExpense(order)} 
                      style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Transformer en achat projet
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edition */}
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Modifier la commande</div>
              <button className="btn-ghost" onClick={() => setEditingOrder(null)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Quantité ({editingOrder.items[0]?.product?.unit})</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="1"
                  value={editFormData.quantity} 
                  onChange={e => setEditFormData({...editFormData, quantity: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Adresse de livraison</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editFormData.address} 
                  onChange={e => setEditFormData({...editFormData, address: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingOrder(null)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdateOrder}>Mettre à jour</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
