import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProductStore from '../store/productStore';
import useAuthStore from '../store/authStore';
import { 
    Plus, X, ArrowLeft, Save, Sparkles, Trash2, Pencil, 
    Image as ImageIcon, AlertTriangle, History, 
    BarChart2, RefreshCw, CheckCircle2, ChevronDown, 
    ChevronRight, Layers, DollarSign, Package
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
    { 
        name: 'Électricité', 
        subs: [
            { name: 'Câblage', items: ['Câbles VR', 'Gaines', 'Borniers'] },
            { name: 'Appareillage', items: ['Prises', 'Interrupteurs', 'Tableaux'] }
        ]
    },
    { 
        name: 'Plomberie', 
        subs: [
            { name: 'Tuyauterie', items: ['Cuivre', 'PVC', 'Multicouche'] },
            { name: 'Sanitaire', items: ['Robinetterie', 'WC', 'Douche'] }
        ]
    }
];

export default function ManageProducts() {
    const { orders, fetchManufacturerOrders, updateOrderStatus } = useOrderStore();
    const { products, lowStock, fetchProducts, fetchLowStock, createProduct, updateProduct, bulkUpdate, loading } = useProductStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', description: '', price: '', category: '', subCategory: '', stock: { total: 0, threshold: 5 }, specifications: [] });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [view, setView] = useState('list'); // list, alerts, analytics, fulfillment

    useEffect(() => {
        fetchProducts({ manufacturer: user?.id });
        fetchLowStock();
        fetchManufacturerOrders();
    }, [fetchProducts, fetchLowStock, fetchManufacturerOrders, user]);

    const handleUpdateStatus = async (id, status) => {
        const res = await updateOrderStatus(id, status, 'Mise à jour via console de fulfillment.');
        if (res.success) toast.success('Protocole logistique mis à jour.');
    };

    const handleBulkStatus = async (status) => {
        const res = await bulkUpdate(selectedIds, { status });
        if (res.success) {
            toast.success('Protocoles mis à jour.');
            setSelectedIds([]);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const res = editingId 
            ? await updateProduct(editingId, form)
            : await createProduct(form);
            
        if (res.success) {
            toast.success(editingId ? 'Source mise à jour.' : 'Nouveau gisement référencé.');
            setShowForm(false);
            setEditingId(null);
        } else {
            toast.error(res.message);
        }
    };

    return (
        <DashboardLayout currentTab="Products">
            <div className="p-12 space-y-12 animate-in fade-in max-w-7xl mx-auto">
                
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-2">Gestion Catalogue</h1>
                        <p className="text-[10px] font-black uppercase text-brand-teal/30 tracking-[0.4em]">Contrôle des Gisements & Stocks Industriels</p>
                    </div>
                    <div className="flex bg-brand-teal text-white border-4 border-brand-teal shadow-[4px_4px_0px_0px_rgba(45,90,90,0.1)]">
                        <button onClick={() => setView('list')} className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${view === 'list' ? 'bg-white text-brand-teal' : 'hover:bg-brand-orange'}`}>Registre</button>
                        <button onClick={() => setView('fulfillment')} className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${view === 'fulfillment' ? 'bg-white text-brand-teal' : 'hover:bg-brand-orange'}`}>Fulfillment ({orders.length})</button>
                        <button onClick={() => setView('alerts')} className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${view === 'alerts' ? 'bg-white text-brand-teal' : 'hover:bg-brand-orange'}`}>Alertes ({lowStock.length})</button>
                    </div>
                </div>

                {view === 'fulfillment' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 gap-6">
                            {orders.map(order => (
                                <div key={order._id} className="bg-white border-4 border-brand-teal p-8 flex flex-wrap items-center justify-between gap-8 group hover:border-brand-orange transition-colors">
                                    <div className="flex items-center gap-8 flex-1">
                                        <div className="w-16 h-16 bg-brand-cream border-2 border-brand-teal flex items-center justify-center text-brand-teal/40">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-brand-teal">{order.orderNumber}</h3>
                                            <p className="text-[10px] font-black uppercase text-brand-orange mb-4">Client: {order.artisan?.companyName || 'Artisan Indépendant'}</p>
                                            <div className="flex gap-2">
                                                {order.items.filter(i => i.product.manufacturer === user.id).map((item, idx) => (
                                                    <span key={idx} className="text-[9px] font-black bg-brand-cream px-2 py-1 border border-brand-teal/10 uppercase">{item.quantity}x {item.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        <div className="text-right px-8 border-r-2 border-brand-teal/5">
                                            <p className="text-[8px] font-black text-brand-teal/30 uppercase mb-1">Status Actuel</p>
                                            <p className="text-xs font-black uppercase text-brand-teal">{order.status}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {order.status === 'pending' && <button onClick={() => handleUpdateStatus(order._id, 'confirmed')} className="px-4 py-2 bg-brand-teal text-white text-[9px] font-black uppercase hover:bg-brand-orange transition-all">Confirmer</button>}
                                            {order.status === 'confirmed' && <button onClick={() => handleUpdateStatus(order._id, 'processing')} className="px-4 py-2 bg-brand-teal text-white text-[9px] font-black uppercase hover:bg-brand-orange transition-all">Préparer</button>}
                                            {order.status === 'processing' && <button onClick={() => handleUpdateStatus(order._id, 'shipped')} className="px-4 py-2 bg-brand-teal text-white text-[9px] font-black uppercase hover:bg-brand-orange transition-all">Expédier</button>}
                                            <button onClick={() => handleUpdateStatus(order._id, 'cancelled')} className="px-4 py-2 border-2 border-red-500 text-red-500 text-[9px] font-black uppercase hover:bg-red-500 hover:text-white transition-all">Annuler</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'list' && (
                    <div className="space-y-8">
                        {/* Toolbar */}
                        <div className="bg-white border-4 border-brand-teal p-6 flex flex-wrap items-center justify-between gap-6 shadow-[8px_8px_0px_0px_rgba(45,90,90,0.05)]">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => { setEditingId(null); setForm({ name: '', description: '', price: '', category: '', subCategory: '', stock: { total: 0, threshold: 5 }, specifications: [] }); setShowForm(true); }}
                                    className="px-8 py-4 bg-brand-teal text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-orange transition-all"
                                >
                                    <Plus size={16} /> Nouveau Gisement
                                </button>
                                {selectedIds.length > 0 && (
                                    <div className="flex gap-2 animate-in slide-in-from-left-4">
                                        <button onClick={() => handleBulkStatus('active')} className="px-4 py-2 border-2 border-brand-teal text-[9px] font-black uppercase hover:bg-brand-teal hover:text-white transition-all">Activer</button>
                                        <button onClick={() => handleBulkStatus('inactive')} className="px-4 py-2 border-2 border-brand-teal text-[9px] font-black uppercase hover:bg-brand-teal hover:text-white transition-all">Désactiver</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-white border-4 border-brand-teal overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-brand-cream border-b-2 border-brand-teal/10 text-[9px] font-black uppercase tracking-widest text-brand-teal opacity-40">
                                        <th className="p-6 w-12"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? products.map(p => p._id) : [])} /></th>
                                        <th className="p-6">Produit / Ressource</th>
                                        <th className="p-6">Catégorie</th>
                                        <th className="p-6 text-center">Stock Actuel</th>
                                        <th className="p-6 text-right">Tarif HT</th>
                                        <th className="p-6 text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-brand-teal/5">
                                    {products.map(p => (
                                        <tr key={p._id} className="text-xs font-bold text-brand-slate hover:bg-brand-orange/5 transition-colors group">
                                            <td className="p-6">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.includes(p._id)} 
                                                    onChange={() => setSelectedIds(s => s.includes(p._id) ? s.filter(id => id !== p._id) : [...s, p._id])}
                                                />
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-brand-cream border-2 border-brand-teal/10 p-1">
                                                        <img src={p.images?.[0]?.url || '/placeholder.png'} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-brand-teal uppercase">{p.name}</p>
                                                        <p className="text-[8px] opacity-40 uppercase tracking-widest">{p.status}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-[10px] font-black text-brand-teal/60 uppercase">{p.category} <ChevronRight size={10} className="inline mx-1" /> {p.subCategory}</td>
                                            <td className="p-6 text-center">
                                                <span className={`text-lg font-black ${p.stock?.available <= p.stock?.threshold ? 'text-brand-orange underline underline-offset-4 decoration-2' : 'text-brand-teal'}`}>
                                                    {p.stock?.available}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right font-black text-brand-teal">{p.price.toLocaleString()} DT</td>
                                            <td className="p-6 text-right">
                                                <button 
                                                    onClick={() => { setForm(p); setEditingId(p._id); setShowForm(true); }}
                                                    className="p-3 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'alerts' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
                        {lowStock.map(p => (
                            <div key={p._id} className="bg-white border-4 border-brand-orange p-8 shadow-[12px_12px_0px_0px_rgba(242,127,12,0.1)] relative overflow-hidden group">
                                <AlertTriangle size={80} className="absolute -right-4 -bottom-4 text-brand-orange/5 group-hover:scale-125 transition-transform" />
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-brand-teal mb-2">{p.name}</h3>
                                    <p className="text-[10px] font-black uppercase text-brand-orange mb-6 tracking-widest">Alerte de Ravitaillement</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[8px] font-black opacity-30 uppercase mb-1">Disponible</p>
                                            <p className="text-4xl font-black text-brand-orange">{p.stock?.available}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black opacity-30 uppercase mb-1">Seuil Alerte</p>
                                            <p className="text-xl font-black text-brand-teal">{p.stock?.threshold}</p>
                                        </div>
                                    </div>
                                    <button className="w-full mt-8 py-3 bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all">Lancer Ravitaillement Manuel</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Form Modal (Simplified version) */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 z-[100]">
                        <div className="bg-white border-8 border-brand-teal w-full max-w-2xl p-12 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-12">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-teal">{editingId ? 'Mise à Jour Gisement' : 'Nouveau Gisement'}</h2>
                                <button onClick={() => setShowForm(false)} className="text-brand-teal hover:rotate-90 transition-all"><X size={32} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Identifiant Ressource</label>
                                        <input required className="w-full bg-brand-cream border-4 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Catégorie</label>
                                        <select className="w-full bg-brand-cream border-4 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                                            <option value="">Sélectionner</option>
                                            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Tarif de Sortie (DT)</label>
                                        <input type="number" step="0.01" className="w-full bg-brand-cream border-4 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Volume Initial</label>
                                        <input type="number" className="w-full bg-brand-cream border-4 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal" value={form.stock?.total} onChange={e => setForm({...form, stock: { ...form.stock, total: Number(e.target.value) }})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Seuil de Sécurité</label>
                                        <input type="number" className="w-full bg-brand-cream border-4 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal" value={form.stock?.threshold} onChange={e => setForm({...form, stock: { ...form.stock, threshold: Number(e.target.value) }})} />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-6 bg-brand-teal text-white text-xs font-black uppercase tracking-widest hover:bg-brand-orange transition-all shadow-[8px_8px_0px_0px_rgba(45,90,90,0.2)]">SÉCURISER LE PROTOCOLE</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
