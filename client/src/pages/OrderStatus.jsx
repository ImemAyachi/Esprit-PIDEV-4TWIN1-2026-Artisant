import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useOrderStore from '../store/orderStore';
import useAuthStore from '../store/authStore';
import { ArrowLeft, Clock, Settings, Truck, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

const STATUS_STEPS = [
    { key: 'Pending', icon: Clock, label: 'En attente', desc: 'Votre commande a été reçue et est en attente de traitement.' },
    { key: 'Processing', icon: Settings, label: 'En traitement', desc: 'Votre commande est en cours de préparation.' },
    { key: 'Shipped', icon: Truck, label: 'Expédiée', desc: 'Votre commande est en cours de livraison.' },
    { key: 'Delivered', icon: CheckCircle2, label: 'Livrée', desc: 'Votre commande a été livrée avec succès.' },
];

export default function OrderStatus() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { order, loading, error, fetchOrderById, updateOrderStatus } = useOrderStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (id) fetchOrderById(id);
    }, [id, fetchOrderById]);

    const currentStepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
    const isCanceled = order?.status === 'Canceled';

    const handleStatusChange = async (newStatus) => {
        await updateOrderStatus(id, newStatus);
    };

    if (loading) {
        return (
            <DashboardLayout currentTab="Orders">
                <div className="flex flex-col items-center justify-center p-8 font-outfit min-h-[50vh]" role="status" aria-live="polite">
                    <Loader2 className="animate-spin text-brand-orange mb-4" size={48} />
                    <p className="font-black uppercase tracking-widest text-brand-teal text-sm">Synchronisation des données logistiques...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !order) {
        return (
            <DashboardLayout currentTab="Orders">
                <div className="flex flex-col items-center justify-center p-8 font-outfit text-center min-h-[50vh]">
                    <AlertCircle className="text-red-500 mb-4" size={64} />
                    <p role="alert" className="text-xl font-black uppercase tracking-tight text-red-600 mb-6">{error || 'Identification commande impossible.'}</p>
                    <button onClick={() => navigate('/orders/history')} className="btn-primary flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /> Retour au Centre Logistique
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentTab="Orders">
            <div className="p-8 md:p-12 font-outfit max-w-5xl mx-auto pb-20">
                <button onClick={() => navigate('/orders/history')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal transition-colors mb-8 focus:outline-none">
                    <ArrowLeft size={14} /> Consulter le registre des commandes
                </button>

                <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-2">
                    Traçabilité Opérationnelle
                </h1>
                <p className="font-bold text-sm text-brand-slate opacity-60 mb-10 flex items-center gap-2">
                    ID Manifeste: <span className="text-brand-teal font-black uppercase px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/20">{order._id}</span>
                </p>

                {/* Stepper — icon + text for each step (Ala ♿) */}
                {isCanceled ? (
                    <div role="status" aria-label="Statut de la commande : Annulée" className="bg-red-50 border-4 border-red-500 p-8 text-center mb-10 shadow-[8px_8px_0_0_#EF4444]">
                        <XCircle size={64} className="text-red-500 mx-auto mb-4" />
                        <p className="font-black text-2xl uppercase tracking-tighter text-red-600 mb-2">Processus Interrompu</p>
                        <p className="text-red-600/60 font-bold text-sm">Cette commande a été annulée et retirée de la chaîne de production.</p>
                    </div>
                ) : (
                    <div className="bg-white border-4 border-brand-teal p-8 mb-10 shadow-[8px_8px_0_0_#2D5A5A]">
                        <h2 className="text-xl font-black uppercase tracking-tight text-brand-teal mb-8 pb-4 border-b-2 border-brand-teal/10">Statut de Déploiement</h2>
                        <ol
                            aria-label="Étapes de livraison"
                            className="relative flex flex-col gap-8"
                        >
                            {/* Vertical Line */}
                            <div className="absolute left-6 top-8 bottom-8 w-1 bg-brand-teal/10 z-0"></div>

                            {STATUS_STEPS.map((step, index) => {
                                const isDone = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const Icon = step.icon;

                                return (
                                    <li key={step.key} className="flex gap-6 items-start relative z-10">
                                        {/* Icon circle */}
                                        <div
                                            className={`w-12 h-12 rounded-none flex items-center justify-center shrink-0 border-4 transition-all duration-300 ${isDone ? 'bg-brand-teal border-brand-teal text-white' : isCurrent ? 'bg-brand-orange border-brand-orange text-white animate-pulse' : 'bg-white border-brand-teal/20 text-brand-teal/20'}`}
                                        >
                                            <Icon size={20} />
                                        </div>

                                        {/* Text content */}
                                        <div className="flex-1 pt-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <p
                                                    className={`text-lg font-black uppercase tracking-tight leading-none ${isDone ? 'text-brand-teal' : isCurrent ? 'text-brand-orange' : 'text-brand-slate opacity-40'}`}
                                                    aria-current={isCurrent ? 'step' : undefined}
                                                >
                                                    {step.label}
                                                </p>
                                                {isDone && <CheckCircle2 size={16} className="text-brand-teal" />}
                                            </div>
                                            {(isDone || isCurrent) && (
                                                <p className="text-xs font-bold text-brand-slate opacity-60 leading-relaxed max-w-md">
                                                    {step.desc}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Order details */}
                    <section aria-labelledby="order-details-title" className="bg-white border-4 border-brand-teal p-8 shadow-[8px_8px_0_0_#2D5A5A]">
                        <h2 id="order-details-title" className="text-xl font-black uppercase tracking-tight text-brand-teal mb-6 pb-4 border-b-2 border-brand-teal/10">Détails d'Acquisition</h2>
                        <div className="space-y-4">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-brand-slate"><span className="text-brand-teal font-black">{item.quantity}x</span> {item.product?.name || 'Produit inconnu'}</span>
                                    <span className="font-black text-brand-teal">{(item.price * item.quantity).toFixed(2)} DT</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t-4 border-brand-teal flex justify-between items-end">
                            <span className="text-xs font-black uppercase tracking-widest text-brand-teal">Valorisation Finale</span>
                            <span className="text-2xl font-black text-brand-orange">{order.totalAmount?.toFixed(2)} DT</span>
                        </div>
                    </section>

                    {/* Admin/Manufacturer status changer */}
                    {(user?.role === 'admin' || user?.role === 'manufacturer') && !isCanceled && (
                        <section aria-labelledby="status-update-title" className="bg-brand-cream border-4 border-brand-teal p-8 shadow-[8px_8px_0_0_#A66E4E]">
                            <h2 id="status-update-title" className="text-xl font-black uppercase tracking-tight text-brand-teal mb-6 pb-4 border-b-2 border-brand-teal/10">Contrôle Industriel</h2>
                            <div className="flex flex-col gap-3">
                                {[...STATUS_STEPS.map((s) => s.key), 'Canceled'].map((s) => {
                                    const isActive = order.status === s;
                                    const isCancelBtn = s === 'Canceled';
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusChange(s)}
                                            disabled={isActive}
                                            aria-pressed={isActive}
                                            className={`w-full py-3 px-4 text-sm font-black uppercase tracking-widest transition-all ${isActive ? 'bg-brand-teal border-4 border-brand-teal text-white cursor-default' : isCancelBtn ? 'bg-white border-4 border-red-500 text-red-500 hover:bg-red-50 focus:bg-red-50' : 'bg-white border-4 border-brand-teal/20 text-brand-teal hover:border-brand-teal hover:bg-brand-teal/5 focus:border-brand-teal'}`}
                                        >
                                            {s === 'Canceled' ? 'ARRÊTER LE DÉPLOIEMENT' : s}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
