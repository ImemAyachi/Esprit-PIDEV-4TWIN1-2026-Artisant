import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Send, Loader2, CheckCircle2, Calculator } from 'lucide-react';
import useQuoteStore from '../../store/quoteStore';
import useProjectStore from '../../store/projectStore';

const QuoteModal = ({ quote, onClose, onSave }) => {
    const isEdit = !!(quote && (quote._id || quote.id));
    const { createQuote, updateQuote } = useQuoteStore();
    const { projects, fetchMyProjects } = useProjectStore();

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        project: '',
        clientName: '',
        clientEmail: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        tax: 0,
        validUntil: '',
    });

    useEffect(() => {
        fetchMyProjects();
        if (isEdit) {
            setForm({
                project: quote.project?._id || quote.project || '',
                clientName: quote.clientName || '',
                clientEmail: quote.clientEmail || '',
                items: quote.items || [{ description: '', quantity: 1, unitPrice: 0 }],
                tax: quote.tax || 0,
                validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
            });
        }
    }, [quote, isEdit, fetchMyProjects]);

    const handleAddItem = () => {
        setForm({
            ...form,
            items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = form.items.filter((_, i) => i !== index);
        setForm({ ...form, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setForm({ ...form, items: newItems });
    };

    const calculateSubtotal = () => {
        return form.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    };

    const subtotal = calculateSubtotal();
    const total = subtotal + Number(form.tax);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!form.project || !form.clientName || form.items.length === 0) {
            setError("Veuillez remplir tous les champs obligatoires");
            setLoading(false);
            return;
        }

        try {
            let res;
            if (isEdit) {
                res = await updateQuote(quote._id || quote.id, form);
            } else {
                res = await createQuote(form);
            }

            if (res.success) {
                setSaved(true);
                setTimeout(() => {
                    onSave && onSave();
                    onClose();
                }, 1500);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-brand-slate/60 z-[70] backdrop-blur-[2px] transition-opacity" onClick={onClose} />

            {/* Slide-in panel */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-2xl bg-brand-cream border-l-8 border-brand-teal z-[80] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="bg-brand-teal text-white px-8 py-6 flex items-start justify-between shrink-0">
                    <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">
                            Module Commercial / Devis
                        </span>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                            {isEdit ? 'Modifier le Devis' : 'Émettre un Nouveau Devis'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 border-2 border-white/20 text-white/60 hover:bg-white hover:text-brand-teal transition-all mt-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-8">
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    {/* Section: Client & Project */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b-2 border-brand-teal/10 pb-2">
                            <Calculator size={16} className="text-brand-teal" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-teal">Informations de Base</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-brand-teal/50 ml-1">Projet Associé *</label>
                                <select
                                    className="input-field border-2 border-brand-teal/20 focus:border-brand-teal"
                                    value={form.project}
                                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                                    required
                                >
                                    <option value="">Sélectionner un projet</option>
                                    {projects.map(p => (
                                        <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-brand-teal/50 ml-1">Client *</label>
                                <input
                                    type="text"
                                    className="input-field border-2 border-brand-teal/20 focus:border-brand-teal"
                                    placeholder="Nom du client"
                                    value={form.clientName}
                                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-brand-teal/50 ml-1">Email Client</label>
                                <input
                                    type="email"
                                    className="input-field border-2 border-brand-teal/20 focus:border-brand-teal"
                                    placeholder="client@email.com"
                                    value={form.clientEmail}
                                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-brand-teal/50 ml-1">Validité </label>
                                <input
                                    type="date"
                                    className="input-field border-2 border-brand-teal/20 focus:border-brand-teal"
                                    value={form.validUntil}
                                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Items */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-brand-teal/10 pb-2">
                            <div className="flex items-center gap-3">
                                <Plus size={16} className="text-brand-teal" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-teal">Lignes du Devis</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-[9px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal transition-colors"
                            >
                                + Ajouter une ligne
                            </button>
                        </div>

                        <div className="space-y-4">
                            {form.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white p-3 border-2 border-brand-teal/5">
                                    <div className="col-span-6 space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-brand-teal/40">Description</label>
                                        <input
                                            type="text"
                                            className="w-full bg-brand-cream border-2 border-transparent focus:border-brand-teal/20 p-2 text-xs font-bold outline-none"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            placeholder="Service ou produit..."
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-brand-teal/40">Qté</label>
                                        <input
                                            type="number"
                                            className="w-full bg-brand-cream border-2 border-transparent focus:border-brand-teal/20 p-2 text-xs font-bold outline-none"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <label className="text-[8px] font-bold uppercase text-brand-teal/40">Prix Unitaire</label>
                                        <input
                                            type="number"
                                            className="w-full bg-brand-cream border-2 border-transparent focus:border-brand-teal/20 p-2 text-xs font-bold outline-none"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-1 pb-1">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2 text-brand-slate/20 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-brand-teal text-white p-8 space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest opacity-60">
                            <span>Sous-total</span>
                            <span>{subtotal.toLocaleString()} DT</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-60">Taxes / Frais</span>
                            <input
                                type="number"
                                className="w-24 bg-white/10 border-2 border-white/20 p-1 text-right text-xs font-bold outline-none focus:border-brand-orange"
                                value={form.tax}
                                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                            />
                        </div>
                        <div className="pt-4 border-t-2 border-white/10 flex justify-between items-center">
                            <span className="text-lg font-black uppercase tracking-tighter">Total Devis</span>
                            <span className="text-2xl font-black text-brand-orange">{total.toLocaleString()} DT</span>
                        </div>
                    </div>
                </form>

                {/* Footer actions */}
                <div className="px-8 py-6 border-t-8 border-brand-teal bg-white shrink-0 flex gap-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-2 border-brand-teal text-brand-teal hover:bg-brand-cream transition-all">
                        Abandonner
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || saved}
                        className="flex-[2] py-4 text-[10px] font-black uppercase tracking-[0.2em] bg-brand-teal text-white border-2 border-brand-teal hover:bg-brand-orange hover:border-brand-orange transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-[4px_4px_0px_0px_rgba(45,90,90,0.2)]"
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Traitement...</>
                        ) : saved ? (
                            <><CheckCircle2 size={18} className="text-white" /> Devis Enregistré !</>
                        ) : (
                            <>
                                {isEdit ? <Save size={18} /> : <Send size={18} />}
                                {isEdit ? 'Enregistrer les Modifications' : 'Générer le Devis'}
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default QuoteModal;
