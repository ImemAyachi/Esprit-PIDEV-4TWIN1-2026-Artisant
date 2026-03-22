import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrderStore from '../store/orderStore';
import useCartStore from '../store/cartStore';
import { 
    ArrowLeft, Clock, Settings, Truck, CheckCircle2, 
    XCircle, Package, Database, Banknote, List, 
    ChevronDown, ChevronUp, RefreshCw, MapPin, Search
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { toast } from 'react-hot-toast';

const STATUS_MAP = {
    pending: { label: 'Attente Confirmation', color: 'text-brand-orange', bg: 'bg-brand-orange/10', icon: Clock },
    confirmed: { label: 'Confirmée', color: 'text-brand-teal', bg: 'bg-brand-teal/10', icon: CheckCircle2 },
    processing: { label: 'En Préparation', color: 'text-brand-teal', bg: 'bg-brand-teal/20', icon: Settings },
    shipped: { label: 'En Transit', color: 'text-brand-teal', bg: 'bg-brand-teal/30', icon: Truck },
    delivered: { label: 'Livrét', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
    cancelled: { label: 'Annulée', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle }
};

export default function OrderHistory() {
    const { orders, loading, fetchMyOrders, analytics, fetchOrderAnalytics } = useOrderStore();
    const { addItem } = useCartStore();
    const navigate = useNavigate();
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        fetchMyOrders();
        fetchOrderAnalytics();
    }, [fetchMyOrders, fetchOrderAnalytics]);

    const handleReorder = (order) => {
        order.items.forEach(item => {
            if (item.product) addItem(item.product, item.quantity);
        });
        toast.success('Gisements injectés dans le tampon du panier.');
        navigate('/checkout');
    };

    return (
        <DashboardLayout currentTab="Orders">
            <div className="p-12 space-y-16 animate-in fade-in max-w-7xl mx-auto">
                
                {/* Analytics Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-brand-teal p-8 border-4 border-brand-teal text-white shadow-[8px_8px_0px_0px_rgba(45,90,90,0.1)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 flex items-center gap-2"><Banknote size={14} /> Engagements Totaux</p>
                        <p className="text-4xl font-black">{analytics?.stats?.totalSpent?.toLocaleString() || '0'} <span className="text-sm opacity-40">DT</span></p>
                    </div>
                    <div className="bg-white p-8 border-4 border-brand-teal text-brand-teal shadow-[8px_8px_0px_0px_rgba(45,90,90,0.05)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 flex items-center gap-2"><RefreshCw size={14} /> Flux Moyen / Commande</p>
                        <p className="text-4xl font-black">{Math.round(analytics?.stats?.avgOrderValue || 0).toLocaleString()} <span className="text-sm opacity-40">DT</span></p>
                    </div>
                    <div className="bg-white p-8 border-4 border-brand-orange text-brand-orange shadow-[8px_8px_0px_0px_rgba(242,127,12,0.1)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 flex items-center gap-2"><Package size={14} /> GISMENTS RÉPERTORIÉS</p>
                        <p className="text-4xl font-black">{orders.length}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex justify-between items-end border-b-4 border-brand-teal/10 pb-6">
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-teal">Registre Opérationnel</h2>
                        <span className="text-[10px] font-black uppercase text-brand-teal/40 italic">Mise à jour en temps réel des flux logistiques</span>
                    </div>

                    <div className="space-y-6">
                        {orders.map(order => {
                            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                            const isExpanded = expandedOrder === order._id;

                            return (
                                <div key={order._id} className="bg-white border-4 border-brand-teal overflow-hidden group hover:shadow-[12px_12px_0px_0px_rgba(45,90,90,0.05)] transition-all">
                                    {/* Summary Row */}
                                    <div className="p-6 flex flex-wrap items-center justify-between gap-8">
                                        <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                                            <div className="w-16 h-16 bg-brand-cream border-2 border-brand-teal flex items-center justify-center text-brand-teal/30 shrink-0">
                                                <Database size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-lg font-black uppercase tracking-tighter text-brand-teal">{order.orderNumber}</span>
                                                    <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border-2 ${status.color} ${status.bg} border-current`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Initialisée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-brand-teal/30 uppercase mb-1">Total Net</p>
                                                <p className="text-2xl font-black text-brand-teal">{order.financials.total.toLocaleString()} DT</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => handleReorder(order)}
                                                    className="px-6 py-3 bg-brand-orange text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2"
                                                >
                                                    <RefreshCw size={12} /> Ré-injecter
                                                </button>
                                                <button 
                                                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                                                    className={`p-3 border-2 ${isExpanded ? 'bg-brand-teal text-white border-brand-teal' : 'text-brand-teal border-brand-teal/20 hover:border-brand-teal'}`}
                                                >
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Detail */}
                                    {isExpanded && (
                                        <div className="border-t-4 border-brand-cream p-12 bg-brand-cream/20 grid grid-cols-1 md:grid-cols-2 gap-16 animate-in slide-in-from-top-4 duration-500">
                                            {/* Products & Shipping */}
                                            <div className="space-y-12">
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40 mb-6 flex items-center gap-2 uppercase">
                                                        <List size={14} /> Inventaire des Ressources
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center bg-white border-2 border-brand-teal/5 p-4 group-hover:border-brand-teal transition-all">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-brand-cream border-2 border-brand-teal/5 flex items-center justify-center p-1">
                                                                        <img src={item.product?.images?.[0]?.url || '/placeholder.png'} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-tight text-brand-teal">{item.name}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[11px] font-black text-brand-orange">x{item.quantity}</span>
                                                                    <p className="text-[9px] font-bold text-brand-teal/40">{item.total.toLocaleString()} DT</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-brand-teal text-white p-6 border-4 border-brand-teal shadow-[8px_8px_0px_0px_rgba(45,90,90,0.1)]">
                                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        <MapPin size={12} className="text-brand-orange" /> Logistique Destination
                                                    </h4>
                                                    <p className="text-xs font-black uppercase mb-1">{order.shipping?.contactName}</p>
                                                    <p className="text-[10px] opacity-60 font-bold leading-relaxed">{order.shipping?.address}</p>
                                                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                                        <span className="text-[8px] font-black uppercase opacity-40">Statut Expédition</span>
                                                        <span className="text-[9px] font-black uppercase">{order.status === 'delivered' ? 'Livraison Confirmée' : 'Flux Logistique Actif'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Timeline */}
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40 mb-10 flex items-center gap-2">
                                                    <Clock size={14} /> Chronologie des Opérations
                                                </h4>
                                                <div className="relative border-l-4 border-brand-teal/10 ml-4 space-y-12">
                                                    {order.statusTimeline?.map((log, lIdx) => (
                                                        <div key={lIdx} className="relative pl-10">
                                                            <div className="absolute -left-[14px] top-0 w-6 h-6 bg-white border-4 border-brand-teal rounded-full" />
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal">{log.status}</p>
                                                                    <time className="text-[9px] font-bold text-brand-teal/40">{new Date(log.timestamp).toLocaleDateString('fr-FR')} | {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-brand-slate opacity-60 border-l-2 border-brand-orange pl-4 leading-relaxed bg-brand-cream py-3">{log.comment}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
