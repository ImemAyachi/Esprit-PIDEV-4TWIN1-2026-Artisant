import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProductStore from '../store/productStore';
import useAuthStore from '../store/authStore';
import { Plus, X, ArrowLeft, Save, Sparkles, Trash2, Pencil, Image as ImageIcon } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getImageUrl } from '../utils/imageUrl';

const CATEGORIES = ['Textile', 'Céramique', 'Bijoux', 'Bois', 'Cuir', 'Métal', 'Autre'];

const emptyForm = { name: '', description: '', price: '', category: '', stock: '', images: [''], specifications: [] };

export default function ManageProducts() {
    const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct, generateAIDescription, uploadImage } = useProductStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        try {
            const url = await uploadImage(formData);
            setForm(f => ({ ...f, images: [url] }));
            setSuccessMsg('Image téléchargée avec succès');
        } catch (err) {
            setError('Erreur lors du téléchargement de l\'image');
        } finally {
            setUploading(false);
            setTimeout(() => setSuccessMsg(''), 3000);
        }
    };

    useEffect(() => {
        if (user) {
            const currentId = user._id || user.id;
            const filters = user.role === 'admin' ? {} : { manufacturer: currentId };
            fetchProducts(filters);
        }
    }, [fetchProducts, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = {
                ...form,
                price: Number(form.price),
                stock: Number(form.stock),
                images: form.images.filter(Boolean),
            };
            if (editingId) {
                await updateProduct(editingId, data);
                setSuccessMsg('Produit mis à jour avec succès');
            } else {
                await createProduct(data);
                setSuccessMsg('Nouveau produit déployé');
            }
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur système, veuillez réessayer');
        }
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleEdit = (product) => {
        setForm({
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            images: product.images?.length ? product.images : [''],
            specifications: product.specifications || [],
        });
        setEditingId(product._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, name) => {
        try {
            await deleteProduct(id);
            setSuccessMsg(`Produit "${name}" supprimé avec succès`);
            setDeleteConfirmId(null);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
            setDeleteConfirmId(null);
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleAI = async () => {
        if (!form.name || !form.category) {
            setError('ERREUR: Renseignez le nom et la catégorie pour autoriser le processeur IA.');
            return;
        }
        setAiLoading(true);
        setError('');
        try {
            const desc = await generateAIDescription({ name: form.name, category: form.category, specifications: form.specifications });
            setForm((f) => ({ ...f, description: desc }));
        } catch {
            setError('ERREUR PROCESSUS IA.');
        } finally {
            setAiLoading(false);
        }
    };

    const addSpec = () => setForm((f) => ({ ...f, specifications: [...f.specifications, { key: '', value: '' }] }));
    const updateSpec = (i, field, val) => setForm((f) => ({ ...f, specifications: f.specifications.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));
    const removeSpec = (i) => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, idx) => idx !== i) }));

    return (
        <DashboardLayout currentTab="Products">
            <div className="p-8 md:p-12 font-outfit max-w-6xl mx-auto animate-in text-brand-slate">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                    <div>
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal transition-colors mb-4 focus:outline-none">
                            <ArrowLeft size={14} /> Retour au Superviseur
                        </button>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none">
                            Registre Produits
                        </h1>
                        <p className="font-bold text-sm text-brand-slate opacity-60 mt-2">
                            Gérez le catalogue industriel et les spécifications de production.
                        </p>
                    </div>
                    <button
                        onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        {showForm ? <><X size={16} /> Fermer Formulaire</> : <><Plus size={16} /> Nouveau Produit</>}
                    </button>
                </div>

                {/* Alerts */}
                {successMsg && (
                    <div role="alert" className="mb-8 p-4 bg-brand-teal text-white border-l-4 border-brand-orange text-xs font-black uppercase tracking-widest flex items-center gap-3">
                        <Sparkles size={16} /> {successMsg}
                    </div>
                )}
                {error && (
                    <div role="alert" className="mb-8 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                        <X size={16} /> {error}
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} aria-label={editingId ? 'Modifier le produit' : 'Créer un nouveau produit'} className="bg-white border-4 border-brand-teal p-8 mb-12 shadow-[8px_8px_0_0_#2D5A5A]">
                        <div className="mb-8 pb-4 border-b-2 border-brand-teal/10 flex items-center gap-3 text-brand-teal">
                            <Pencil size={24} />
                            <h2 className="text-xl font-black uppercase tracking-tight">{editingId ? 'Modification Active' : 'Initialisation Produit'}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label htmlFor="prod-name" className="label">Nom du produit <span className="text-brand-orange">*</span></label>
                                <input id="prod-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Identifiant nomenclature..." />
                            </div>
                            <div>
                                <label htmlFor="prod-category" className="label">Catégorie <span className="text-brand-orange">*</span></label>
                                <select id="prod-category" required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field bg-white">
                                    <option value="">-- SÉLECTIONNER --</option>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="prod-price" className="label">Prix Unitaire (DT) <span className="text-brand-orange">*</span></label>
                                <input id="prod-price" required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input-field" placeholder="0.00" />
                            </div>
                            <div>
                                <label htmlFor="prod-stock" className="label">Inventaire Disponible</label>
                                <input id="prod-stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="input-field" placeholder="Volume actuel..." />
                            </div>
                        </div>

                        {/* Description + AI */}
                        <div className="mb-8 p-6 border-2 border-brand-teal bg-brand-cream/40">
                            <div className="flex justify-between items-end mb-4 border-b border-brand-teal/20 pb-4">
                                <label htmlFor="prod-desc" className="label mb-0">Paramètres de Description <span className="text-brand-orange">*</span></label>
                                <button type="button" onClick={handleAI} disabled={aiLoading} className="px-4 py-2 bg-brand-cream border-2 border-brand-teal/20 text-brand-teal text-[10px] font-black uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all focus:outline-none flex items-center gap-2 shadow-[2px_2px_0_0_#2D5A5A]">
                                    {aiLoading ? <span className="animate-pulse">Calcul en cours...</span> : <><Sparkles size={12} className="text-brand-orange" /> Assistant IA</>}
                                </button>
                            </div>
                            <textarea id="prod-desc" required rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field min-h-[120px]" placeholder="Données techniques de description..." />
                        </div>

                        {/* Image Upload */}
                        <div className="mb-8">
                            <label className="label">Visuel Produit</label>
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-32 h-32 bg-white border-2 border-brand-teal flex items-center justify-center text-brand-teal/20 overflow-hidden shrink-0">
                                    {form.images[0] ? (
                                        <img src={getImageUrl(form.images[0])} alt="Aperçu" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={32} />
                                    )}
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="relative group cursor-pointer border-2 border-dashed border-brand-teal/30 hover:border-brand-teal p-8 text-center transition-all bg-brand-cream/20">
                                        <input
                                            type="file"
                                            onChange={handleUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            disabled={uploading}
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            {uploading ? (
                                                <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-brand-orange rounded-full" />
                                            ) : (
                                                <ImageIcon size={24} className="text-brand-teal/40 group-hover:text-brand-orange transition-colors" />
                                            )}
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal">
                                                {uploading ? 'Transfert en cours...' : 'Cliquer ou glisser pour uploader'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-brand-teal/40 mt-3 uppercase tracking-widest">Format: JPG, PNG, WEBP — Max 2MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Specifications */}
                        <div className="mb-10 p-6 bg-brand-cream border-2 border-brand-teal/10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="label mb-0 border-l-4 border-brand-orange pl-3">Spécifications Techniques</span>
                                <button type="button" onClick={addSpec} className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal transition-colors flex items-center gap-1"><Plus size={12} /> Ajouter Ligne</button>
                            </div>
                            <div className="space-y-3">
                                {form.specifications.length === 0 && <p className="text-xs font-bold text-brand-slate/40 italic">Aucune spécification définie.</p>}
                                {form.specifications.map((spec, i) => (
                                    <div key={i} className="flex gap-4">
                                        <input aria-label={`Clé de la spécification ${i + 1}`} value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)} placeholder="Paramètre" className="input-field !py-2 !text-xs flex-1" />
                                        <input aria-label={`Valeur de la spécification ${i + 1}`} value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} placeholder="Valeur" className="input-field !py-2 !text-xs flex-1" />
                                        <button type="button" onClick={() => removeSpec(i)} aria-label={`Supprimer spécification ${i + 1}`} className="p-3 border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all focus:outline-none shrink-0"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end pt-4 border-t-2 border-brand-teal/10">
                            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="btn-secondary">Annuler Saisie</button>
                            <button type="submit" className="btn-primary flex items-center gap-2">
                                {editingId ? <><Save size={16} /> Mettre à Jour</> : <><Plus size={16} /> Enregistrer Produit</>}
                            </button>
                        </div>
                    </form>
                )}

                {/* Products grid */}
                {loading ? (
                    <div className="p-20 text-center bg-white border-4 border-brand-teal border-dashed flex flex-col items-center justify-center gap-4 text-brand-teal/40">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-teal border-t-brand-orange rounded-full" />
                        <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-brand-teal">Synchronisation catalogue...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-20 text-center bg-white border-4 border-brand-teal/20">
                        <ImageIcon size={48} className="mx-auto text-brand-teal/20 mb-4" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal/30 mb-2">Base vide</h3>
                        <p className="text-xs font-black uppercase tracking-widest text-brand-teal/40">Aucun produit au catalogue.</p>
                    </div>
                ) : (
                    <div className="space-y-0 border-4 border-brand-teal bg-white overflow-x-auto">
                        {/* Header */}
                        <div className="grid grid-cols-12 min-w-[800px] bg-brand-teal text-white p-4 border-b-4 border-brand-teal items-center">
                            <div className="col-span-1 text-[9px] font-black uppercase tracking-widest text-center">Réf</div>
                            <div className="col-span-4 text-[9px] font-black uppercase tracking-widest ml-4">Identité Produit</div>
                            <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-center">Catégorie</div>
                            <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-center">Volume</div>
                            <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-right mr-4">Valeur Unitaire</div>
                            <div className="col-span-1 text-[9px] font-black uppercase tracking-widest text-center">Cmd</div>
                        </div>
                        {products.map((product, index) => (
                            <div key={product._id} className={`grid grid-cols-12 min-w-[800px] p-4 border-b border-brand-teal/10 hover:bg-brand-cream transition-colors items-center ${index % 2 !== 0 && 'bg-brand-cream/30'}`}>
                                <div className="col-span-1 flex justify-center">
                                    {product.images?.[0] ? (
                                        <img src={getImageUrl(product.images[0])} alt={`Aperçu ${product.name}`} className="w-12 h-12 object-cover border-2 border-brand-teal bg-white" />
                                    ) : (
                                        <div className="w-12 h-12 bg-white border-2 border-brand-teal/20 flex items-center justify-center text-brand-teal/30"><ImageIcon size={16} /></div>
                                    )}
                                </div>
                                <div className="col-span-4 pl-4 pr-2">
                                    <h3 className="text-sm font-black text-brand-teal uppercase tracking-tight truncate">{product.name}</h3>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-slate opacity-40 mt-1 truncate max-w-sm">{product.description || '—'}</p>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <span className="px-2 py-1 bg-white border-2 border-brand-teal/10 text-[9px] font-black uppercase tracking-widest text-brand-teal shadow-[2px_2px_0_0_#2D5A5A20]">{product.category}</span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className={`text-xl font-black ${product.stock <= 5 ? 'text-brand-orange bg-brand-orange/10 px-2 py-1' : 'text-brand-teal'} inline-block`}>
                                        {product.stock}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right pr-4">
                                    <span className="text-xl font-black text-brand-teal">{product.price?.toFixed(2)}</span>
                                    <span className="text-[10px] font-black text-brand-teal/40 uppercase ml-1">DT</span>
                                </div>
                                <div className="col-span-1 flex justify-center gap-2">
                                    {deleteConfirmId === product._id ? (
                                        <div className="flex gap-1 animate-in slide-in-from-right-2 duration-300">
                                            <button
                                                onClick={() => handleDelete(product._id, product.name)}
                                                className="px-2 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors focus:outline-none"
                                            >
                                                OUI
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="px-2 py-1 bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-teal/80 transition-colors focus:outline-none"
                                            >
                                                NON
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEdit(product)} title="Modifier" className="w-8 h-8 flex items-center justify-center border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-colors focus:outline-none"><Pencil size={12} /></button>
                                            <button onClick={() => setDeleteConfirmId(product._id)} title="Supprimer" className="w-8 h-8 flex items-center justify-center border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors focus:outline-none"><Trash2 size={12} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
