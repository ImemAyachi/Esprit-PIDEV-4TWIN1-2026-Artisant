import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShoppingCart, Truck, CreditCard, CheckCircle2, 
    ArrowRight, ArrowLeft, Trash2, Plus, Minus,
    MapPin, Phone, User, AlertTriangle, Package
} from 'lucide-react';
import useCartStore from '../store/cartStore';
import useOrderStore from '../store/orderStore';
import { toast } from 'react-hot-toast';

const Checkout = () => {
    const navigate = useNavigate();
    const { items, updateQuantity, removeItem, clearCart, getFinancials } = useCartStore();
    const { createOrder, loading } = useOrderStore();
    
    const [step, setStep] = useState(1);
    const [shipping, setShipping] = useState({ 
        address: '', city: 'Tunis', phone: '', contactName: '' 
    });
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

    const financials = getFinancials();

    const handleCheckout = async () => {
        const orderData = {
            items: items.map(i => ({
                product: i.product._id,
                name: i.product.name,
                quantity: i.quantity,
                price: i.product.price,
                total: i.product.price * i.quantity
            })),
            shipping,
            payment: { method: paymentMethod },
            financials,
            notes: 'Commande générée via le portail Artisant.'
        };

        const res = await createOrder(orderData);
        if (res.success) {
            toast.success('Protocole de commande scellé ! Redirection...');
            clearCart();
            setStep(4);
            setTimeout(() => navigate('/dashboard'), 3000);
        } else {
            toast.error(res.message);
        }
    };

    if (items.length === 0 && step < 4) {
        return (
            <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center gap-8 p-12 text-center animate-in fade-in">
                <ShoppingCart size={80} className="text-brand-teal/10" />
                <h2 className="text-4xl font-black uppercase tracking-tighter text-brand-teal opacity-20">Le Panier est Désert</h2>
                <button onClick={() => navigate('/marketplace')} className="px-12 py-5 bg-brand-teal text-white text-xs font-black uppercase tracking-widest hover:bg-brand-orange transition-all">Retour au Gisement</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-cream p-8 md:p-16 font-bold flex items-center justify-center">
            <div className="max-w-6xl w-full bg-white border-8 border-brand-teal shadow-[24px_24px_0px_0px_rgba(45,90,90,0.1)] overflow-hidden animate-in zoom-in-95 duration-500">
                
                {/* Stepper Header */}
                <div className="grid grid-cols-4 bg-brand-teal text-white border-b-8 border-brand-teal">
                    {[
                        { id: 1, label: 'Panier', icon: ShoppingCart },
                        { id: 2, label: 'Logistique', icon: MapPin },
                        { id: 3, label: 'Paiement', icon: CreditCard },
                        { id: 4, label: 'Protocole', icon: CheckCircle2 }
                    ].map(s => (
                        <div key={s.id} className={`p-6 flex items-center justify-center gap-3 transition-colors ${step === s.id ? 'bg-brand-orange' : 'opacity-40'}`}>
                            <s.icon size={20} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:inline">{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-[600px]">
                    {/* Content Section */}
                    <div className="lg:col-span-2 p-12 border-r-4 border-brand-teal/5">
                        {step === 1 && (
                            <div className="space-y-12 animate-in slide-in-from-left-4">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-teal">Révision des Ressources</h2>
                                <div className="space-y-6">
                                    {items.map(item => (
                                        <div key={item.product._id} className="flex items-center gap-8 p-6 bg-brand-cream border-2 border-brand-teal/5 group hover:border-brand-teal transition-all">
                                            <div className="w-24 h-24 bg-white border-2 border-brand-teal p-1 shrink-0">
                                                <img src={item.product.images?.[0]?.url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[8px] font-black uppercase opacity-40 mb-1">{item.product.category}</p>
                                                <h3 className="text-xl font-black uppercase tracking-tighter text-brand-teal">{item.product.name}</h3>
                                                <p className="text-xs font-bold text-brand-teal opacity-60">P.U: {item.product.price.toLocaleString()} DT</p>
                                            </div>
                                            <div className="flex items-center gap-4 bg-white border-4 border-brand-teal p-1 scale-90">
                                                <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="p-2 hover:bg-brand-teal hover:text-white transition-all"><Minus size={16} /></button>
                                                <span className="w-12 text-center text-lg font-black">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="p-2 hover:bg-brand-teal hover:text-white transition-all"><Plus size={16} /></button>
                                            </div>
                                            <button onClick={() => removeItem(item.product._id)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={24} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-12 animate-in slide-in-from-right-4">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-teal">Protocole Logistique</h2>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Responsable Réception</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/20" size={18} />
                                            <input 
                                                className="w-full bg-brand-cream border-4 border-brand-teal/10 p-5 pl-12 text-xs font-black uppercase outline-none focus:border-brand-teal"
                                                placeholder="NOM DE L'AGENT"
                                                value={shipping.contactName}
                                                onChange={e => setShipping({...shipping, contactName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Adresse de Débarquement</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-5 text-brand-teal/20" size={18} />
                                            <textarea 
                                                className="w-full bg-brand-cream border-4 border-brand-teal/10 p-5 pl-12 text-xs font-black uppercase outline-none focus:border-brand-teal h-32 resize-none"
                                                placeholder="INDICATIONS DE LIVRAISON"
                                                value={shipping.address}
                                                onChange={e => setShipping({...shipping, address: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Canal Direct (Tél)</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/20" size={18} />
                                            <input 
                                                className="w-full bg-brand-cream border-4 border-brand-teal/10 p-5 pl-12 text-xs font-black uppercase outline-none focus:border-brand-teal"
                                                placeholder="+216 22 55..."
                                                value={shipping.phone}
                                                onChange={e => setShipping({...shipping, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Hub Régional</label>
                                        <select 
                                            className="w-full bg-brand-cream border-4 border-brand-teal/10 p-5 text-xs font-black uppercase outline-none focus:border-brand-teal"
                                            value={shipping.city}
                                            onChange={e => setShipping({...shipping, city: e.target.value})}
                                        >
                                            <option value="Tunis">Tunis / Port</option>
                                            <option value="Sfax">Sfax / Industriel</option>
                                            <option value="Sousse">Sousse / Logistique</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-12 animate-in slide-in-from-right-4">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-teal">Validation Financière</h2>
                                <div className="space-y-6">
                                    {[
                                        { id: 'bank_transfer', label: 'Virement Bancaire (Réseau Artisant)', details: 'Sûreté maximale, certification sous 24h.' },
                                        { id: 'credit_card', label: 'Carte Industrielle', details: 'Exécution instantanée.' },
                                        { id: 'cash', label: 'Cash à l\'Usine', details: 'Remise en main propre lors du chargement.' }
                                    ].map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => setPaymentMethod(m.id)}
                                            className={`w-full text-left p-8 border-4 transition-all flex items-center justify-between ${
                                                paymentMethod === m.id ? 'bg-brand-teal text-white border-brand-teal shadow-[8px_8px_0px_0px_rgba(255,120,80,1)]' : 'bg-brand-cream text-brand-teal border-transparent hover:border-brand-teal'
                                            }`}
                                        >
                                            <div>
                                                <p className="text-lg font-black uppercase tracking-tighter leading-none mb-2">{m.label}</p>
                                                <p className={`text-[10px] font-bold ${paymentMethod === m.id ? 'text-white/60' : 'text-brand-teal/40'}`}>{m.details}</p>
                                            </div>
                                            {paymentMethod === m.id && <CheckCircle2 size={32} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-1000">
                                <div className="w-32 h-32 bg-brand-teal text-white flex items-center justify-center rounded-full shadow-[0_0_80px_rgba(45,90,90,0.5)]">
                                    <CheckCircle2 size={64} />
                                </div>
                                <div>
                                    <h2 className="text-5xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-4">Code Scellé.</h2>
                                    <p className="text-sm font-black text-brand-orange uppercase tracking-[0.4em]">Opération Transmise au Registre Central</p>
                                </div>
                                <div className="bg-brand-cream border-2 border-brand-teal/20 px-8 py-4 text-[10px] font-black uppercase text-brand-teal italic">
                                    Référencement en cours dans le livre de caisse industriel...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Sidebar */}
                    <div className="bg-brand-teal p-12 text-white flex flex-col justify-between">
                        <div className="space-y-12">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                                <Package size={16} className="text-brand-orange" /> Synthèse Documentaire
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-xs font-bold opacity-60 uppercase">
                                    <span>Décompte Brut (HT)</span>
                                    <span>{financials.subtotal.toLocaleString()} DT</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold opacity-60 uppercase">
                                    <span>TVA (19%)</span>
                                    <span>{financials.tax.toLocaleString()} DT</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold opacity-60 uppercase pb-6 border-b-2 border-white/10">
                                    <span>Coûts Logistiques</span>
                                    <span>{financials.shippingCost.toLocaleString()} DT</span>
                                </div>
                                <div className="flex justify-between items-center text-3xl font-black uppercase tracking-tighter">
                                    <span>Net à Payer</span>
                                    <span className="text-brand-orange">{financials.total.toLocaleString()} DT</span>
                                </div>
                            </div>

                            {step < 4 && (
                                <div className="bg-white/5 border-2 border-white/10 p-6 flex gap-4 items-start">
                                    <AlertTriangle size={24} className="text-brand-orange shrink-0" />
                                    <p className="text-[9px] font-bold leading-relaxed text-white/60 italic">
                                        En validant ce protocole, vous confirmez que les gisements sélectionnés correspondent aux normes de sécurité en vigueur.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-12">
                            {step < 3 ? (
                                <button 
                                    onClick={() => setStep(step + 1)}
                                    className="w-full py-6 bg-brand-orange text-white text-sm font-black uppercase tracking-[0.2em] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] hover:bg-white hover:text-brand-teal transition-all flex items-center justify-center gap-3 group"
                                >
                                    Phase Suivante <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            ) : step === 3 ? (
                                <button 
                                    disabled={loading}
                                    onClick={handleCheckout}
                                    className="w-full py-6 bg-brand-orange text-white text-sm font-black uppercase tracking-[0.3em] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] hover:bg-white hover:text-brand-teal transition-all flex items-center justify-center gap-4 active:scale-95"
                                >
                                    {loading ? 'SCELLAGE...' : 'SCELLER LA COMMANDE'}
                                </button>
                            ) : null}

                            {step > 1 && step < 4 && (
                                <button 
                                    onClick={() => setStep(step - 1)}
                                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={14} /> Retour
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
