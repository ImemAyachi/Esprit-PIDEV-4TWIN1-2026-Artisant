import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ConfirmModal from '../../components/ConfirmModal';

// ─── PDF download ─────────────────────────────────────────────────────────────
const downloadInvoicePDF = async (invoice, ref) => {
  if (!ref.current) return;
  try {
    toast.loading('Génération du PDF...', { id: 'pdf' });
    const canvas = await html2canvas(ref.current, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`Facture-${invoice.invoiceNumber}.pdf`);
    toast.success('PDF téléchargé !', { id: 'pdf' });
  } catch {
    toast.error('Erreur lors de la génération du PDF', { id: 'pdf' });
  }
};

// ─── Invoice Modal ────────────────────────────────────────────────────────────
const InvoiceModal = ({ invoice, onClose }) => {
  const printRef = useRef(null);
  const BRAND = '#3d6b4f';
  const GOLD  = '#b5831a';
  const LIGHT = '#f5f7f2';
  const fmt   = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const supplierName = invoice.supplier?.companyName || `${invoice.supplier?.firstName ?? ''} ${invoice.supplier?.lastName ?? ''}`.trim();
  const buyerName    = `${invoice.buyer?.firstName ?? ''} ${invoice.buyer?.lastName ?? ''}`.trim();

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(15,23,42,0.72)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'fadeIn 0.2s ease' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .inv-tbl { width:100%; border-collapse:collapse; }
        .inv-tbl th { padding:0.65rem 1rem; text-align:left; font-size:0.76rem; text-transform:uppercase; letter-spacing:0.06em; }
        .inv-tbl td { padding:0.7rem 1rem; border-bottom:1px solid #f0f0f0; font-size:0.88rem; }
      `}</style>

      <div
        style={{ maxHeight:'90vh', overflowY:'auto', borderRadius:20, width:740, animation:'slideUp 0.32s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Action bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.9rem 1.5rem', background:'#0f172a', borderRadius:'20px 20px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <img src="/Logo-artisanet.png" alt="logo" style={{ width:28, height:28, objectFit:'contain', borderRadius:4 }} />
            <span style={{ color:'#64748b', fontSize:'0.8rem', fontWeight:600 }}>Aperçu · {invoice.invoiceNumber}</span>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button
              onClick={() => downloadInvoicePDF(invoice, printRef)}
              style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.48rem 1rem', borderRadius:8, fontWeight:700, fontSize:'0.82rem', background:`linear-gradient(135deg,${BRAND},#2d5a40)`, color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 10px rgba(61,107,79,0.5)' }}
            >⬇ Télécharger PDF</button>
            <button onClick={onClose} style={{ padding:'0.48rem 0.85rem', borderRadius:8, background:'rgba(255,255,255,0.07)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontWeight:700 }}>✕</button>
          </div>
        </div>

        {/* ══ PRINTABLE AREA ══ */}
        <div ref={printRef} style={{ background:'#fff', fontFamily:"'Inter','Segoe UI',sans-serif", borderRadius:'0 0 20px 20px', overflow:'hidden' }}>

          {/* Green header */}
          <div style={{ background:`linear-gradient(135deg,${BRAND} 0%,#2d5a40 55%,#1a3a28 100%)`, padding:'2rem 2.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              <img src="/Logo-artisanet.png" alt="Artisanet" style={{ width:70, height:70, objectFit:'contain', background:'rgba(255,255,255,0.1)', borderRadius:14, padding:7, flexShrink:0 }} />
              <div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.14em', fontWeight:800 }}>Artisanet</div>
                <div style={{ color:'#fff', fontSize:'1.05rem', fontWeight:700, lineHeight:1.3, marginTop:2 }}>Plateforme de matériaux<br/>de construction</div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:GOLD, fontSize:'2.2rem', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1 }}>FACTURE</div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.88rem', fontWeight:600, marginTop:4 }}>#{invoice.invoiceNumber}</div>
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
                <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>Date d'émission</span>
                <span style={{ color:'#fff', fontWeight:700, fontSize:'0.88rem' }}>{fmt(invoice.issueDate)}</span>
                <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>Date d'échéance</span>
                <span style={{ color:GOLD, fontWeight:700, fontSize:'0.88rem' }}>{fmt(invoice.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Gold accent bar */}
          <div style={{ height:5, background:`linear-gradient(90deg,${GOLD},#e8a820,${GOLD})` }} />

          {/* Body */}
          <div style={{ padding:'2rem 2.5rem', display:'flex', flexDirection:'column', gap:'1.75rem' }}>

            {/* Parties */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div style={{ background:LIGHT, borderRadius:12, padding:'1.1rem 1.25rem', borderLeft:`4px solid ${BRAND}` }}>
                <div style={{ fontSize:'0.65rem', fontWeight:800, color:BRAND, textTransform:'uppercase', letterSpacing:'0.11em', marginBottom:6 }}>Émetteur — Fournisseur</div>
                <div style={{ fontWeight:800, color:'#0f172a', fontSize:'0.95rem' }}>{supplierName}</div>
                <div style={{ color:'#94a3b8', fontSize:'0.78rem', marginTop:3 }}>Fournisseur certifié Artisanet</div>
              </div>
              <div style={{ background:LIGHT, borderRadius:12, padding:'1.1rem 1.25rem', borderLeft:`4px solid ${GOLD}` }}>
                <div style={{ fontSize:'0.65rem', fontWeight:800, color:GOLD, textTransform:'uppercase', letterSpacing:'0.11em', marginBottom:6 }}>Destinataire — Client</div>
                <div style={{ fontWeight:800, color:'#0f172a', fontSize:'0.95rem' }}>{buyerName}</div>
                {invoice.buyer?.email    && <div style={{ color:'#64748b', fontSize:'0.78rem', marginTop:3 }}>{invoice.buyer.email}</div>}
                {invoice.deliveryAddress && <div style={{ color:'#64748b', fontSize:'0.78rem', marginTop:3 }}>📍 {invoice.deliveryAddress}</div>}
              </div>
            </div>

            {/* Table */}
            <div style={{ borderRadius:12, overflow:'hidden', border:`1.5px solid #e8ede8` }}>
              <table className="inv-tbl">
                <thead>
                  <tr style={{ background:`${BRAND}14` }}>
                    <th style={{ color:BRAND }}>Désignation du produit</th>
                    <th style={{ textAlign:'center', color:BRAND, width:90 }}>Quantité</th>
                    <th style={{ textAlign:'right', color:BRAND, width:120 }}>Prix unit. (DT)</th>
                    <th style={{ textAlign:'right', color:BRAND, width:130 }}>Montant (DT)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9faf8' }}>
                      <td style={{ fontWeight:600, color:'#1e293b' }}>{line.productName}</td>
                      <td style={{ textAlign:'center', color:'#64748b' }}>{line.quantity} {line.unit}</td>
                      <td style={{ textAlign:'right', color:'#64748b' }}>{(line.unitPrice || 0).toFixed(3)}</td>
                      <td style={{ textAlign:'right', color:BRAND, fontWeight:800 }}>{(line.total || 0).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background:`${BRAND}09` }}>
                    <td colSpan={3} style={{ textAlign:'right', fontWeight:800, color:'#475569', fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'none', padding:'0.8rem 1rem' }}>Total TTC</td>
                    <td style={{ textAlign:'right', fontWeight:900, color:BRAND, fontSize:'1.1rem', borderBottom:'none', padding:'0.8rem 1rem' }}>{invoice.totalAmount?.toFixed(3)} DT</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Total highlight */}
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ background:`linear-gradient(135deg,${BRAND},#2d5a40)`, borderRadius:14, padding:'1.1rem 1.75rem', color:'#fff', textAlign:'right', minWidth:230, boxShadow:`0 6px 24px rgba(61,107,79,0.28)` }}>
                <div style={{ fontSize:'0.65rem', opacity:0.7, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.09em' }}>Montant total à régler</div>
                <div style={{ fontSize:'2.1rem', fontWeight:900, letterSpacing:'-0.03em' }}>
                  {invoice.totalAmount?.toFixed(3)}
                  <span style={{ fontSize:'0.95rem', fontWeight:600, opacity:0.8, marginLeft:5 }}>DT</span>
                </div>
              </div>
            </div>

            {/* Statut paiement */}
            <div style={{ display:'flex', justifyContent:'center' }}>
              <span style={{
                padding:'0.45rem 2rem', borderRadius:99, fontWeight:800, fontSize:'0.86rem',
                background: invoice.status === 'paid' ? '#dcfce7' : '#fefce8',
                color:      invoice.status === 'paid' ? '#15803d'  : '#92400e',
                border:    `1.5px solid ${invoice.status === 'paid' ? '#86efac' : '#fcd34d'}`,
              }}>
                {invoice.status === 'paid' ? '✅ Facture réglée' : '⏳ En attente de règlement'}
              </span>
            </div>

            {/* ── Zones de signature ── */}
            <div style={{ borderTop:`2px dashed #d4e6d4`, paddingTop:'1.5rem' }}>
              <div style={{ fontSize:'0.68rem', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.11em', marginBottom:'1.25rem', textAlign:'center' }}>
                Signatures &amp; Approbation
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
                {/* Fournisseur */}
                <div style={{ border:'1px solid #e2e8f0', borderRadius:12, padding:'1.1rem', background:'#fafafa' }}>
                  <div style={{ fontSize:'0.65rem', fontWeight:800, color:BRAND, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:6 }}>Signature du fournisseur</div>
                  <div style={{ fontWeight:700, color:'#334155', fontSize:'0.85rem', marginBottom:14 }}>{supplierName}</div>
                  <div style={{ height:56, borderBottom:'1.5px solid #cbd5e1', marginBottom:8, background:'repeating-linear-gradient(90deg,transparent,transparent 5px,#f1f5f9 5px,#f1f5f9 6px)' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600 }}>Date :</span>
                    <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#475569' }}>{fmt(invoice.issueDate)}</span>
                  </div>
                </div>
                {/* Client */}
                <div style={{ border:'1px solid #e2e8f0', borderRadius:12, padding:'1.1rem', background:'#fafafa' }}>
                  <div style={{ fontSize:'0.65rem', fontWeight:800, color:GOLD, textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:6 }}>Signature du client</div>
                  <div style={{ fontWeight:700, color:'#334155', fontSize:'0.85rem', marginBottom:14 }}>{buyerName}</div>
                  <div style={{ height:56, borderBottom:'1.5px solid #cbd5e1', marginBottom:8, background:'repeating-linear-gradient(90deg,transparent,transparent 5px,#f1f5f9 5px,#f1f5f9 6px)' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600 }}>Date :</span>
                    <span style={{ fontSize:'0.8rem', color:'#94a3b8', fontStyle:'italic' }}>____ / ____ / ________</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer officiel */}
            <div style={{ borderTop:`1px solid ${BRAND}1a`, paddingTop:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <img src="/Logo-artisanet.png" alt="logo" style={{ width:20, height:20, objectFit:'contain', opacity:0.5 }} />
                <span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600 }}>Artisanet — Plateforme de matériaux de construction</span>
              </div>
              <span style={{ fontSize:'0.65rem', color:'#cbd5e1' }}>Document officiel · Généré automatiquement</span>
            </div>

          </div>{/* /body */}
        </div>{/* /printable */}
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const MyOrdersPage = () => {
  const [orders, setOrders]          = useState([]);
  const [loading, setLoading]        = useState(true);
  const [projects, setProjects]      = useState([]);
  const [invoiceMap, setInvoiceMap]  = useState({});
  const [viewingInvoice, setViewing] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [selectedProjects, setSelectedProjects] = useState({});
  const [editingOrder, setEditingOrder]          = useState(null);
  const [editFormData, setEditFormData]          = useState({ quantity: 1, address: '' });

  const fetchData = async () => {
    try {
      const [oRes, pRes] = await Promise.all([api.get('/orders'), api.get('/projects')]);
      const list = oRes.data.orders;
      setOrders(list);
      setProjects(pRes.data.projects);

      const results = await Promise.all(
        list.map(o => api.get(`/orders/${o._id}/invoice`)
          .then(r => ({ id: o._id, invoice: r.data.invoice }))
          .catch(() => ({ id: o._id, invoice: null })))
      );
      const map = {};
      results.forEach(r => { map[r.id] = r.invoice; });
      setInvoiceMap(map);
    } catch {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const transformToExpense = async (order) => {
    const projId = selectedProjects[order._id] || order.project;
    if (!projId) return toast.error('Veuillez sélectionner un chantier');
    try {
      await api.post(`/projects/${projId}/expenses`, {
        description: `Matériel: ${order.items[0]?.product?.name || 'Commande'}`,
        amount: order.totalAmount, category: 'matériaux',
      });
      toast.success('Achat lié au projet avec succès !');
    } catch { toast.error('Impossible de lier cet achat.'); }
  };

  const handleDeleteOrder = (id) => {
    setConfirmConfig({
      type: 'warning',
      title: 'Annuler cette commande ?',
      message: 'La commande sera annulée et le fournisseur en sera informé. Cette action est irréversible.',
      confirmLabel: 'Annuler la commande',
      onConfirm: async () => {
        try { await api.delete(`/orders/${id}`); toast.success('Commande annulée'); fetchData(); }
        catch (err) { toast.error(err.response?.data?.message || "Erreur lors de l'annulation"); }
      }
    });
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setEditFormData({ quantity: order.items[0]?.quantity || 1, address: order.deliveryAddress?.address || '' });
  };

  const handleUpdateOrder = async () => {
    try {
      const items = [...editingOrder.items];
      if (items[0]) items[0] = { ...items[0], quantity: Number(editFormData.quantity) };
      await api.put(`/orders/${editingOrder._id}`, {
        items,
        deliveryAddress: { ...editingOrder.deliveryAddress, address: editFormData.address },
      });
      toast.success('Commande mise à jour'); setEditingOrder(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const STATUS_LABELS = { pending:'EN ATTENTE', confirmed:'CONFIRMÉE', processing:'EN TRAITEMENT', shipped:'EXPÉDIÉE', delivered:'LIVRÉE', cancelled:'ANNULÉE' };
  const STATUS_COLORS = {
    pending:   { bg:'#fef9c3', color:'#854d0e', border:'#fde68a' },
    confirmed: { bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe' },
    shipped:   { bg:'#e0e7ff', color:'#4338ca', border:'#c7d2fe' },
    delivered: { bg:'#dcfce7', color:'#15803d', border:'#bbf7d0' },
    cancelled: { bg:'#fee2e2', color:'#b91c1c', border:'#fecaca' },
  };

  if (loading) return (
    <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:180, borderRadius:16 }} />)}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', padding:'1rem' }}>
      <div>
        <h2 style={{ fontSize:'1.8rem', fontWeight:800, color:'#0f172a' }}>Mes Achats Fournisseurs</h2>
        <p style={{ color:'#64748b' }}>Suivez vos commandes de matériaux et consultez vos factures.</p>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding:'4rem', textAlign:'center', background:'#f8fafc', borderRadius:'16px', color:'#64748b' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📦</div>
          Vous n'avez passé aucune commande.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {orders.map(order => {
            const sc     = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            const invoice = invoiceMap[order._id];
            const hasInv  = !!invoice;

            return (
              <div key={order._id} style={{ background:'#fff', borderRadius:'20px', padding:'1.5rem', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'1px solid #f1f5f9', paddingBottom:'1rem' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                      <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#1e293b', margin:0 }}>
                        Achat #{order._id.substring(0, 8).toUpperCase()}
                      </h3>
                      <span style={{ padding:'0.3rem 0.9rem', borderRadius:'99px', fontWeight:700, fontSize:'0.78rem', background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div style={{ color:'#94a3b8', fontSize:'0.85rem', marginTop:'0.4rem' }}>
                      📅 {new Date(order.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}
                      &nbsp;•&nbsp; 🏪 {order.supplier?.companyName || `${order.supplier?.firstName} ${order.supplier?.lastName}`}
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button onClick={() => handleEditClick(order)}
                        style={{ padding:'0.4rem 0.8rem', border:'1px solid #bfdbfe', background:'#eff6ff', color:'#2563eb', borderRadius:'8px', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
                        ✏️ Modifier
                      </button>
                      <button onClick={() => handleDeleteOrder(order._id)}
                        style={{ padding:'0.4rem 0.8rem', border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', borderRadius:'8px', fontWeight:600, fontSize:'0.82rem', cursor:'pointer' }}>
                        ✕ Annuler
                      </button>
                    </div>
                  )}
                </div>

                {/* Articles */}
                <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'1rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.5rem 0', borderBottom: idx < order.items.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <span style={{ background:'#eff6ff', color:'#2563eb', padding:'0.2rem 0.6rem', borderRadius:'6px', fontSize:'0.82rem', fontWeight:700 }}>
                          {item.quantity} {item.product?.unit || 'u'}
                        </span>
                        <span style={{ fontWeight:600, color:'#1e293b' }}>{item.product?.name || 'Produit inconnu'}</span>
                      </div>
                      <span style={{ color:'#64748b', fontSize:'0.85rem' }}>{(item.unitPrice || 0).toFixed(2)} DT/{item.product?.unit || 'u'}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
                  <div>
                    <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#2563eb' }}>{order.totalAmount?.toFixed(2)} DT</div>
                    <div style={{ fontSize:'0.82rem', color:'#94a3b8' }}>📍 {order.deliveryAddress?.address}</div>
                  </div>
                  <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', alignItems:'center' }}>
                    {/* Invoice button — always visible, state pre-loaded */}
                    <button
                      onClick={() => hasInv ? setViewing(invoice) : null}
                      disabled={!hasInv}
                      title={hasInv ? 'Voir la facture' : 'Facture pas encore générée par le fournisseur'}
                      style={{
                        display:'flex', alignItems:'center', gap:'0.45rem',
                        padding:'0.55rem 1.1rem', borderRadius:'10px', fontWeight:700, fontSize:'0.85rem',
                        cursor: hasInv ? 'pointer' : 'not-allowed',
                        border: hasInv ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        background: hasInv ? 'linear-gradient(135deg,#eff6ff,#dbeafe)' : '#f8fafc',
                        color:  hasInv ? '#1d4ed8' : '#cbd5e1',
                        boxShadow: hasInv ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
                        transition:'all 0.2s',
                      }}
                    >
                      {hasInv ? '🧾 Voir la facture' : '📄 Facture pas encore générée'}
                    </button>

                    {/* Lier au chantier */}
                    {order.status === 'delivered' && (
                      <>
                        <select className="form-input form-select" style={{ padding:'0.5rem', width:'200px' }}
                          value={selectedProjects[order._id] || order.project || ''}
                          onChange={e => setSelectedProjects(p => ({ ...p, [order._id]: e.target.value }))}>
                          <option value="">-- Choisir un Chantier --</option>
                          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                        <button onClick={() => transformToExpense(order)}
                          style={{ background:'#4f46e5', color:'#fff', border:'none', padding:'0.55rem 1rem', borderRadius:'10px', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
                          Lier au chantier
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edition modal */}
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Modifier la commande</div>
              <button className="btn-ghost" onClick={() => setEditingOrder(null)}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', marginTop:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Quantité ({editingOrder.items[0]?.product?.unit})</label>
                <input type="number" className="form-input" min="1" value={editFormData.quantity}
                  onChange={e => setEditFormData({ ...editFormData, quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Adresse de livraison</label>
                <input type="text" className="form-input" value={editFormData.address}
                  onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} />
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setEditingOrder(null)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={handleUpdateOrder}>Mettre à jour</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {viewingInvoice && (
        <InvoiceModal invoice={viewingInvoice} onClose={() => setViewing(null)} />
      )}
      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
    </div>
  );
};

export default MyOrdersPage;
