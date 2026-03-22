import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Plus, Trash2, Save, Send, ChevronRight, 
    ChevronLeft, Receipt, DollarSign, Percent, 
    Calculator, User, Briefcase, FileText, 
    Package, ArrowRight, AlertCircle, History,
    Calendar, CheckCircle2, ShieldCheck
} from 'lucide-react';
import useQuoteStore from '../../store/quoteStore';
import useProductStore from '../../store/productStore';
import { toast } from 'react-hot-toast';

const TAX_TYPES = [
    { label: 'TVA 19%', value: 19 },
    { label: 'TVA 7%', value: 7 },
    { label: 'Exonéré 0%', value: 0 }
];

const QuoteModal = ({ quote, onClose, onSave }) => {
    const { createQuote, updateQuote, loading } = useQuoteStore();
    const { products, fetchProducts } = useProductStore();
    const [step, setStep] = useState(1);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        client: { name: '', email: '', address: '', phone: '' },
        items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 19, discount: { type: 'percentage', value: 0 } }],
        validityPeriod: 30,
        termsAndConditions: 'Paiement à la réception. Validité du devis: 30 jours.',
        notes: '',
        shipping: 0
    });

    useEffect(() => {
        if (quote) {
            setFormData({
                ...quote,
                items: quote.items.map(i => ({
                    ...i,
                    discount: i.discount || { type: 'percentage', value: 0 }
                }))
            });
        }
        fetchProducts();
    }, [quote, fetchProducts]);

    // Financial Calculations
    const financials = useMemo(() => {
        let subtotal = 0;
        const processedItems = formData.items.map(item => {
            let lineTotal = item.unitPrice * item.quantity;
            if (item.discount.type === 'percentage') {
                lineTotal -= lineTotal * (item.discount.value / 100);
            } else {
                lineTotal -= item.discount.value;
            }
            subtotal += lineTotal;
            return { ...item, total: lineTotal };
        });

        const taxAmount = subtotal * 0.19; // Simplified global VAT for calculation display
        const grandTotal = subtotal + taxAmount + Number(formData.shipping);

        return { subtotal, taxAmount, grandTotal, processedItems };
    }, [formData]);

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 19, discount: { type: 'percentage', value: 0 } }]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            newItems[index][parent][child] = value;
        } else {
            newItems[index][field] = value;
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleProductSelect = (index, product) => {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            product: product._id,
            description: product.name,
            unitPrice: product.price,
            taxRate: 19
        };
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (status = 'draft') => {
        const data = { ...formData, status };
        let res;
        if (quote?._id) {
            res = await updateQuote(quote._id, data);
        } else {
            res = await createQuote(data);
        }

        if (res.success) {
            toast.success(status === 'sent' ? 'Protocole expédié au client !' : 'Gisement sauvegardé en brouillon.');
            onSave?.();
            onClose();
        } else {
            toast.error(res.message || 'Échec de la transaction.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-teal/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-6xl h-[90vh] flex flex-col border-8 border-brand-teal shadow-[20px_20px_0px_0px_rgba(45,90,90,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-brand-teal p-6 flex justify-between items-center border-b-8 border-brand-orange">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white flex items-center justify-center">
                            <Receipt className="text-brand-teal" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase text-white tracking-tighter">
                                {quote ? `Mise à jour Protocol v${quote.version || 1}` : 'Génération Devis Industriel'}
                            </h2>
                            <p className="text-[10px] font-black uppercase text-white/50 tracking-[0.3em]">Module de Facturation & Trading</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1.5 w-12 transition-all ${step >= i ? 'bg-brand-orange' : 'bg-white/20'}`} />
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 text-white hover:bg-brand-orange transition-all"><X size={24} /></button>
                    </div>
                </div>

                {/* Progress Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-12">
                    {step === 1 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-brand-teal flex items-center gap-2">
                                        <User size={14} className="text-brand-orange" /> Informations Contractant
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-2">
                                            <input 
                                                className="w-full bg-brand-cream border-2 border-brand-teal/10 px-4 py-3 text-sm font-bold uppercase outline-none focus:border-brand-orange"
                                                placeholder="Référence Titre (ex: Travaux Peinture Phase 1)"
                                                value={formData.title}
                                                onChange={e => setFormData({...formData, title: e.target.value})}
                                            />
                                        </div>
                                        <input 
                                            className="bg-brand-cream border-2 border-brand-teal/10 px-4 py-3 text-sm font-bold placeholder:text-brand-teal/20 outline-none focus:border-brand-orange"
                                            placeholder="Nom du Client"
                                            value={formData.client.name}
                                            onChange={e => setFormData({...formData, client: {...formData.client, name: e.target.value}})}
                                        />
                                        <input 
                                            className="bg-brand-cream border-2 border-brand-teal/10 px-4 py-3 text-sm font-bold placeholder:text-brand-teal/20 outline-none focus:border-brand-orange"
                                            placeholder="Email de facturation"
                                            value={formData.client.email}
                                            onChange={e => setFormData({...formData, client: {...formData.client, email: e.target.value}})}
                                        />
                                        <input 
                                            className="bg-brand-cream border-2 border-brand-teal/10 px-4 py-3 text-sm font-bold placeholder:text-brand-teal/20 outline-none focus:border-brand-orange"
                                            placeholder="Téléphone Liaison"
                                            value={formData.client.phone}
                                            onChange={e => setFormData({...formData, client: {...formData.client, phone: e.target.value}})}
                                        />
                                        <div className="col-span-2">
                                            <textarea 
                                                className="w-full bg-brand-cream border-2 border-brand-teal/10 px-4 py-3 text-sm font-bold placeholder:text-brand-teal/20 outline-none focus:border-brand-orange min-h-[80px]"
                                                placeholder="Adresse Géographique / Matrice de livraison"
                                                value={formData.client.address}
                                                onChange={e => setFormData({...formData, client: {...formData.client, address: e.target.value}})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-brand-cream p-8 border-4 border-brand-teal/5 relative">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-brand-teal flex items-center gap-2 mb-6">
                                        <ShieldCheck size={14} className="text-brand-orange" /> Paramètres de Validité
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[9px] font-black uppercase opacity-40 block mb-2">Période d'Expiration (Jours)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-white border-2 border-brand-teal/10 px-4 py-3 font-black text-brand-teal outline-none"
                                                value={formData.validityPeriod}
                                                onChange={e => setFormData({...formData, validityPeriod: e.target.value})}
                                            />
                                        </div>
                                        <div className="p-4 bg-white border-l-4 border-brand-orange">
                                            <p className="text-[10px] font-bold text-brand-teal leading-relaxed">
                                                Ce devis sera automatiquement marqué comme <span className="text-brand-orange font-black">EXPIRÉ</span> 
                                                le {new Date(Date.now() + formData.validityPeriod * 86400000).toLocaleDateString()}.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 space-y-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tighter text-brand-teal flex items-center gap-2">
                                    <Package size={20} className="text-brand-orange" /> Décomposition des Postes
                                </h3>
                                <button 
                                    onClick={handleAddItem}
                                    className="px-6 py-2 bg-brand-teal text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-orange transition-all shadow-[4px_4px_0px_0px_rgba(45,90,90,0.2)]"
                                >
                                    <Plus size={16} /> Ajouter une Ligne
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 bg-white p-4 border-2 border-brand-teal/10 hover:border-brand-teal transition-all group relative">
                                        <div className="col-span-5 space-y-2">
                                            <label className="text-[8px] font-black uppercase opacity-30">Désignation / Matériau</label>
                                            <div className="relative">
                                                <input 
                                                    className="w-full bg-brand-cream border-b-2 border-brand-teal/10 px-2 py-2 text-xs font-bold outline-none focus:border-brand-teal"
                                                    value={item.description}
                                                    onChange={e => handleItemChange(index, 'description', e.target.value)}
                                                />
                                                {/* Product Catalog Dropdown would go here */}
                                            </div>
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-[8px] font-black uppercase opacity-30">Qté</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-brand-cream border-b-2 border-brand-teal/10 px-2 py-2 text-xs font-black outline-none focus:border-brand-teal"
                                                value={item.quantity}
                                                onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[8px] font-black uppercase opacity-30">Prix Unitaire (DT)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-brand-cream border-b-2 border-brand-teal/10 px-2 py-2 text-xs font-black outline-none focus:border-brand-teal"
                                                value={item.unitPrice}
                                                onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[8px] font-black uppercase opacity-30">Remise (%)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-brand-cream border-b-2 border-brand-teal/10 px-2 py-2 text-xs font-black outline-none focus:border-brand-teal"
                                                value={item.discount.value}
                                                onChange={e => handleItemChange(index, 'discount.value', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2 text-right">
                                            <label className="text-[8px] font-black uppercase opacity-30">Total Ligne</label>
                                            <p className="py-2 text-xs font-black text-brand-teal">
                                                {((item.unitPrice * item.quantity) * (1 - (item.discount.value/100))).toLocaleString()} DT
                                            </p>
                                        </div>

                                        {formData.items.length > 1 && (
                                            <button 
                                                onClick={() => handleRemoveItem(index)}
                                                className="absolute -right-4 top-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 space-y-12">
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                <div className="md:col-span-2 space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-teal">Clauses & Conditions</h4>
                                        <textarea 
                                            className="w-full bg-brand-cream border-2 border-brand-teal/10 p-6 text-xs font-bold min-h-[150px] outline-none focus:border-brand-orange"
                                            value={formData.termsAndConditions}
                                            onChange={e => setFormData({...formData, termsAndConditions: e.target.value})}
                                        />
                                    </div>
                                    <div className="p-8 bg-brand-teal text-white border-l-8 border-brand-orange">
                                        <div className="flex items-start gap-4">
                                            <AlertCircle size={24} className="text-brand-orange shrink-0" />
                                            <div>
                                                <h5 className="font-black uppercase text-xs mb-2">Notice d'Authenticité</h5>
                                                <p className="text-[10px] font-bold opacity-60 leading-relaxed">
                                                    Une fois expédié, ce protocole sera scellé temporellement. Toute modification ultérieure générera automatiquement une nouvelle itération (v2, v3...) pour garantir l'intégrité de l'audit financier.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border-4 border-brand-teal p-8 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-teal mb-8">Récapitulatif Fiscal</h4>
                                        
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs font-bold text-brand-slate">
                                                <span>SOUS-TOTAL HT</span>
                                                <span className="font-black">{financials.subtotal.toLocaleString()} DT</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold text-brand-teal">
                                                <span>TVA (Général 19%)</span>
                                                <span className="font-black">{(financials.subtotal * 0.19).toLocaleString()} DT</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-brand-slate opacity-40">
                                                <span>LOGISTIQUE / LIVRAISON</span>
                                                <input 
                                                    type="number"
                                                    className="w-20 bg-brand-cream border-b border-brand-teal/20 px-1 py-1 text-right outline-none focus:border-brand-teal"
                                                    value={formData.shipping}
                                                    onChange={e => setFormData({...formData, shipping: Number(e.target.value)})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-12 border-t-4 border-brand-teal">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black uppercase text-brand-teal/40">Total Net à Payer</span>
                                            <span className="text-3xl font-black text-brand-teal">{financials.grandTotal.toLocaleString()} DT</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="bg-brand-cream p-8 flex justify-between items-center border-t-8 border-brand-teal">
                    <button 
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
                        className="px-8 py-3 border-4 border-brand-teal text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-teal hover:text-white transition-all shadow-[6px_6px_0px_0px_rgba(45,90,90,0.1)]"
                    >
                        {step === 1 ? <Trash2 size={16} /> : <ChevronLeft size={18} />}
                        {step === 1 ? 'Abandonner' : 'Retour'}
                    </button>

                    <div className="flex gap-4">
                        {step < 3 ? (
                            <button 
                                onClick={() => setStep(step + 1)}
                                className="px-12 py-4 bg-brand-teal text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-orange transition-all shadow-[8px_8px_0px_0px_rgba(45,90,90,0.2)]"
                            >
                                Continuer <ChevronRight size={18} />
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={() => handleSubmit('draft')}
                                    disabled={loading}
                                    className="px-8 py-4 border-4 border-brand-teal text-brand-teal text-xs font-black uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all flex items-center gap-2"
                                >
                                    <Save size={18} /> Brouillon
                                </button>
                                <button 
                                    onClick={() => handleSubmit('sent')}
                                    disabled={loading}
                                    className="px-12 py-4 bg-brand-orange text-white text-xs font-black uppercase tracking-widest hover:bg-brand-teal flex items-center gap-2 transition-all shadow-[8px_8px_0px_0px_rgba(45,90,90,0.2)] group"
                                >
                                    Fermer & Expédier <Send size={18} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuoteModal;
