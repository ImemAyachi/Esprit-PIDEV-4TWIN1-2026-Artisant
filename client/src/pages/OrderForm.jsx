import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useOrderStore from '../store/orderStore';
import { ArrowLeft, CheckCircle2, Package, MapPin, ShoppingBag } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function OrderForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { createOrder, loading } = useOrderStore();

    // Cart passed from Marketplace via navigation state
    const cart = location.state?.cart || [];

    const [address, setAddress] = useState({ address: '', city: '', zipCode: '' });
    const [quantities, setQuantities] = useState(() =>
        Object.fromEntries(cart.map((item) => [item._id, item.qty || 1]))
    );
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [order, setOrder] = useState(null);

    const total = cart.reduce((sum, item) => sum + item.price * (quantities[item._id] || 1), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (cart.length === 0) {
            setError('Votre panier est vide.');
            return;
        }

        try {
            const items = cart.map((item) => ({ product: item._id, quantity: quantities[item._id] || 1 }));
            const result = await createOrder({ items, shippingAddress: address });
            setOrder(result);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Erreur lors de la commande');
        }
    };

    if (success && order) {
        return (
            <DashboardLayout currentTab="Orders">
                <div className="font-outfit p-8 md:p-12 flex flex-col items-center justify-center">
                    <div className="bg-white border-8 border-brand-teal p-12 max-w-xl w-full text-center relative overflow-hidden group shadow-[12px_12px_0_0_#2D5A5A]" role="alert" aria-live="assertive">
                        <div className="absolute top-0 right-0 w-32 h-full bg-brand-orange transform translate-x-8 -skew-x-12 opacity-10"></div>
                        <CheckCircle2 size={80} className="text-brand-orange mx-auto mb-6 relative z-10" />
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-4 relative z-10">
                            Commande Confirmée
                        </h1>
                        <p className="font-bold text-sm text-brand-slate opacity-60 mb-6 relative z-10">
                            Signal opérationnel validé. Votre requête est en cours de traitement.
                        </p>
                        <div className="p-6 bg-brand-cream border-4 border-brand-teal mb-8 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40 mb-1">Montant Transaction</p>
                            <p className="text-3xl font-black text-brand-teal">{order.totalAmount?.toFixed(2)} DT</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <button onClick={() => navigate(`/orders/${order._id}/status`)} className="btn-primary flex items-center justify-center gap-2">
                                <Package size={16} /> Suivre Expédition
                            </button>
                            <button onClick={() => navigate('/marketplace')} className="btn-secondary flex items-center justify-center gap-2">
                                <ArrowLeft size={16} /> Suivi Logistique
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout currentTab="Marketplace">
            <div className="p-8 md:p-12 font-outfit flex justify-center pb-20">
                <div className="max-w-2xl w-full">
                    <button onClick={() => navigate('/marketplace')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal transition-colors mb-8 focus:outline-none">
                        <ArrowLeft size={14} /> Retour au Superviseur (Marketplace)
                    </button>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-2">
                        Validation Requête
                    </h1>
                    <p className="font-bold text-sm text-brand-slate opacity-60 mb-10">
                        Vérification du manifeste et affectation des coordonnées logistiques.
                    </p>

                    {error && <div role="alert" className="mb-8 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 text-xs font-black uppercase tracking-widest">✗ {error}</div>}

                    <form onSubmit={handleSubmit} noValidate className="space-y-8">
                        {/* Order summary */}
                        <section aria-labelledby="cart-summary-title" className="bg-white border-4 border-brand-teal p-8 shadow-[8px_8px_0_0_#A66E4E]">
                            <h2 id="cart-summary-title" className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-brand-teal mb-6 pb-4 border-b-2 border-brand-teal/10">
                                <ShoppingBag size={24} className="text-brand-orange" /> Manifeste de Commande
                            </h2>
                            {cart.length === 0 ? (
                                <p className="text-xs font-bold text-brand-slate/40 italic">Inventaire vide.</p>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-brand-cream border-2 border-brand-teal/10 hover:border-brand-teal/30 transition-colors">
                                            <span className="font-black text-brand-teal text-sm uppercase tracking-tight">{item.name}</span>
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="flex items-center gap-2">
                                                    <label htmlFor={`qty-${item._id}`} className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">Qté</label>
                                                    <input
                                                        id={`qty-${item._id}`}
                                                        type="number"
                                                        min="1"
                                                        value={quantities[item._id] || 1}
                                                        onChange={(e) => setQuantities((q) => ({ ...q, [item._id]: Math.max(1, Number(e.target.value)) }))}
                                                        className="w-16 p-2 bg-white border-2 border-brand-teal text-center text-xs font-black text-brand-teal focus:outline-none focus:border-brand-orange"
                                                    />
                                                </div>
                                                <span className="text-sm font-black text-brand-orange ml-auto sm:ml-4 min-w-[80px] text-right">
                                                    {(item.price * (quantities[item._id] || 1)).toFixed(2)} DT
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-6 pt-4 border-t-4 border-brand-teal flex justify-between items-end">
                                        <span className="text-xs font-black uppercase tracking-widest text-brand-teal">Valorisation Totale</span>
                                        <span className="text-2xl font-black text-brand-teal">{total.toFixed(2)} DT</span>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Shipping address — accessible form (Yahya ♿) */}
                        <fieldset className="bg-white border-4 border-brand-teal p-8 shadow-[8px_8px_0_0_#2D5A5A]">
                            <legend className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-brand-teal px-2 bg-white -mt-12 mb-6 border-4 border-brand-teal py-2">
                                <MapPin size={20} className="text-brand-orange" /> Coordonnées Logistiques
                            </legend>
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="ship-address" className="label">Point de livraison <span aria-hidden="true" className="text-brand-orange">*</span><span className="sr-only">(obligatoire)</span></label>
                                    <input
                                        id="ship-address"
                                        type="text"
                                        required
                                        autoComplete="street-address"
                                        value={address.address}
                                        onChange={(e) => setAddress((a) => ({ ...a, address: e.target.value }))}
                                        placeholder="Ex: 12 Secteur Industriel"
                                        className="input-field"
                                        aria-required="true"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="ship-city" className="label">Zone / Ville <span aria-hidden="true" className="text-brand-orange">*</span></label>
                                        <input
                                            id="ship-city"
                                            type="text"
                                            required
                                            autoComplete="address-level2"
                                            value={address.city}
                                            onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                                            placeholder="Ex: Tunis"
                                            className="input-field"
                                            aria-required="true"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="ship-zip" className="label">Code Postal</label>
                                        <input
                                            id="ship-zip"
                                            type="text"
                                            autoComplete="postal-code"
                                            value={address.zipCode}
                                            onChange={(e) => setAddress((a) => ({ ...a, zipCode: e.target.value }))}
                                            placeholder="Ex: 1000"
                                            className="input-field"
                                        />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        <button
                            type="submit"
                            disabled={loading || cart.length === 0}
                            className="w-full btn-primary py-4 text-base tracking-widest flex items-center justify-center gap-3"
                            aria-busy={loading}
                        >
                            {loading ? <span className="animate-pulse">TRAITEMENT EN COURS...</span> : <>CONFIRMER LE DÉPLOIEMENT — {total.toFixed(2)} DT</>}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
