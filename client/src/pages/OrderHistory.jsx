import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useOrderStore from '../store/orderStore';
import { ArrowLeft, Clock, Settings, Truck, CheckCircle2, XCircle, Package, Database, Banknote, Speaker, Bot, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

const STATUS_CONFIG = {
    Pending: {
        bg: 'bg-brand-orange/10', border: 'border-brand-orange', text: 'text-brand-orange', label: 'En attente', icon: Clock
    },
    Processing: {
        bg: 'bg-brand-teal/10', border: 'border-brand-teal', text: 'text-brand-teal', label: 'En traitement', icon: Settings
    },
    Shipped: {
        bg: 'bg-brand-teal/20', border: 'border-brand-teal', text: 'text-brand-teal', label: 'Expédiée', icon: Truck
    },
    Delivered: {
        bg: 'bg-green-100', border: 'border-green-600', text: 'text-green-700', label: 'Livrée', icon: CheckCircle2
    },
    Canceled: {
        bg: 'bg-red-100', border: 'border-red-600', text: 'text-red-700', label: 'Annulée', icon: XCircle
    },
};

export default function OrderHistory() {
    const { orders, loading, error, fetchMyOrders } = useOrderStore();
    const navigate = useNavigate();
    const hasSpoken = useRef(false);

    useEffect(() => {
        fetchMyOrders();
        hasSpoken.current = false;
    }, [fetchMyOrders]);

    // AI voice summary — Web Speech Synthesis API (Imem's IA feature 🤖)
    const speakSummary = () => {
        if (!window.speechSynthesis) {
            alert('ERREUR SYSTEME: La synthèse vocale n\'est pas supportée par ce périphérique.');
            return;
        }
        window.speechSynthesis.cancel();

        const total = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const delivered = orders.filter((o) => o.status === 'Delivered').length;
        const pending = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;

        const text = `Rapport de situation. Vous avez ${orders.length} transaction${orders.length > 1 ? 's' : ''} indexées. `
            + `L'engagement total calculé est de ${total.toFixed(2)} dinars tunisiens. `
            + `${delivered} opération${delivered > 1 ? 's' : ''} clôturée${delivered > 1 ? 's' : ''}. `
            + (pending > 0 ? `${pending} déploiement${pending > 1 ? 's' : ''} en cours d'exécution.` : 'Aucune tâche en attente.');

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1;
        utterance.pitch = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return (
        <DashboardLayout currentTab="Orders">
            <div className="p-8 md:p-12 font-outfit max-w-6xl mx-auto pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal transition-colors mb-4 focus:outline-none">
                            <ArrowLeft size={14} /> Retour au Superviseur Stratégique
                        </button>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-2">
                            Registre des Opérations
                        </h1>
                        <p className="font-bold text-sm text-brand-slate opacity-60">
                            Historique des déploiements et logs logistiques.
                        </p>
                    </div>

                    {/* AI Voice Summary button (Imem 🤖) */}
                    <button
                        onClick={speakSummary}
                        disabled={loading || orders.length === 0}
                        className="btn-outline-white !bg-brand-cream !text-brand-teal !border-brand-teal flex items-center gap-3 hover:!bg-brand-teal hover:!text-white disabled:opacity-50"
                        aria-label="Lancer le rapport vocal de synthèse IA"
                    >
                        <Bot size={20} /> <Speaker size={16} /> Rapport Vocal IA
                    </button>
                </div>

                {/* Summary cards */}
                {!loading && orders.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-4 border-brand-teal mb-12 bg-white">
                        {[
                            { label: 'Total Indexé', value: orders.length, icon: Database, color: 'text-brand-teal' },
                            { label: 'Volume Financier', value: `${totalSpent.toFixed(2)} DT`, icon: Banknote, color: 'text-brand-orange' },
                            { label: 'Déploiements Terminés', value: orders.filter((o) => o.status === 'Delivered').length, icon: CheckCircle2, color: 'text-green-600' },
                            { label: 'Process inachevés', value: orders.filter((o) => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length, icon: Settings, color: 'text-brand-teal' },
                        ].map((card, idx) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.label} className={`p-6 md:p-8 flex flex-col justify-between hover:bg-brand-cream transition-colors group ${idx !== 0 && 'border-t-2 md:border-t-0 md:border-l-2 border-brand-teal/10'}`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal opacity-60 leading-tight pr-4">{card.label}</p>
                                        <Icon size={20} className={`${card.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                                    </div>
                                    <p className={`text-3xl lg:text-4xl font-black tracking-tighter ${card.color} leading-none`}>
                                        {card.value}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="text-center p-20 border-4 border-brand-teal bg-white" role="status" aria-live="polite">
                        <Loader2 className="animate-spin text-brand-orange mx-auto mb-4" size={48} />
                        <p className="text-xs font-black uppercase tracking-widest text-brand-teal">Extraction des logs en cours...</p>
                    </div>
                ) : error ? (
                    <div role="alert" className="bg-red-50 border-4 border-red-500 p-8 text-center text-red-600 font-bold uppercase">
                        <XCircle size={48} className="mx-auto mb-4" />
                        ERREUR LORS DE L'EXTRACTION : {error}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center p-20 border-4 border-brand-teal/20 bg-white">
                        <Package size={64} className="mx-auto text-brand-teal/20 mb-6" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal/30 mb-2">Base vide</h3>
                        <p className="text-sm font-black uppercase tracking-widest text-brand-teal/60 mb-8">Aucun log opérationnel trouvé.</p>
                        <button onClick={() => navigate('/marketplace')} className="btn-primary">
                            Initialiser une requête
                        </button>
                    </div>
                ) : (
                    <div role="table" aria-label="Liste de vos commandes" className="space-y-6">
                        {orders.map((order) => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
                            const StatusIcon = status.icon;

                            return (
                                <article
                                    key={order._id}
                                    className="bg-white border-4 border-brand-teal p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:translate-y-[-2px] hover:shadow-[8px_8px_0_0_#A66E4E] transition-all group"
                                >
                                    <div className="flex-1 w-full md:w-auto">
                                        <div className="flex items-center gap-4 mb-2">
                                            <p className="font-black uppercase tracking-tight text-brand-teal text-lg">
                                                ID-{order._id.slice(-8)}
                                            </p>
                                            <span className="px-2 py-1 bg-brand-cream/50 border border-brand-teal/20 text-[10px] font-black uppercase tracking-widest text-brand-slate/60">
                                                {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {order.items?.map((item, i) => (
                                                <span key={i} className="text-xs font-bold bg-brand-cream border border-brand-teal/10 px-3 py-1 text-brand-slate/80 flex items-center gap-2">
                                                    <span className="text-brand-orange">{item.quantity}x</span> <span className="uppercase tracking-tight truncate max-w-[150px]">{item.product?.name || 'Composant inconnu'}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t-2 md:border-t-0 border-brand-teal/10">
                                        {/* Status: icon + text always shown (♿ Ala) */}
                                        <span
                                            role="status"
                                            aria-label={`Statut : ${status.label}`}
                                            className={`flex items-center gap-2 px-3 py-1 border-2 text-[10px] font-black uppercase tracking-widest ${status.bg} ${status.border} ${status.text}`}
                                        >
                                            <StatusIcon size={14} aria-hidden="true" />
                                            <span>{status.label}</span>
                                        </span>

                                        <strong className="text-2xl font-black text-brand-teal">{order.totalAmount?.toFixed(2)} DT</strong>

                                        <button
                                            onClick={() => navigate(`/orders/${order._id}/status`)}
                                            className="hidden md:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal transition-colors mt-2 focus:outline-none"
                                            aria-label={`Voir le suivi de la commande ${order._id.slice(-8).toUpperCase()}`}
                                        >
                                            Inspecter Logs <ArrowLeft size={12} className="rotate-180" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/orders/${order._id}/status`)}
                                        className="w-full md:hidden btn-secondary whitespace-nowrap flex justify-center items-center gap-2 mt-2"
                                        aria-label={`Voir le suivi de la commande ${order._id.slice(-8).toUpperCase()}`}
                                    >
                                        Inspecter Logs <ArrowLeft size={16} className="rotate-180" />
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
