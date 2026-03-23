import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProductStore from '../store/productStore';
import useCartStore from '../store/cartStore';
import { Loader2, ArrowLeft, Star, Package, Plus, Minus, Info, ChevronRight, MessageSquare, ShoppingCart, ShieldCheck, Truck, ShieldAlert } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { toast } from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, loading, addReview } = useProductStore();
    const { addItem } = useCartStore();
    
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImg, setActiveImg] = useState(0);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        const found = products.find(p => p._id === id);
        if (found) setProduct(found);
    }, [id, products]);

    const handleAddToCart = () => {
        addItem(product, quantity);
        toast.success(`${product.name} ajouté au gisement.`);
    };

    const handleReview = async (e) => {
        e.preventDefault();
        const res = await addReview(id, newReview);
        if (res.success) {
            toast.success('Rapport de feedback indexé.');
            setNewReview({ rating: 5, comment: '' });
        }
    };

    if (loading || !product) {
        return (
            <div className="h-screen flex items-center justify-center bg-brand-cream">
                <Loader2 size={48} className="animate-spin text-brand-orange" />
            </div>
        );
    }

    return (
        <DashboardLayout currentTab="Marketplace">
            <div className="p-12 animate-in slide-in-from-bottom-4 max-w-7xl mx-auto space-y-16 pb-32">
                
                {/* Navigation */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-teal hover:text-brand-orange transition-all">
                    <ArrowLeft size={14} /> Retour au Gisement Central
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    
                    {/* Gallery Section */}
                    <div className="space-y-6">
                        <div className="aspect-square bg-white border-8 border-brand-teal overflow-hidden group cursor-zoom-in relative">
                            <img 
                                src={getImageUrl(product.images?.[activeImg]) || '/placeholder.png'} 
                                className="w-full h-full object-cover group-hover:scale-150 transition-transform duration-700 origin-center"
                                alt={product.name}
                            />
                        </div>
                        <div className="flex gap-4">
                            {product.images?.map((img, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setActiveImg(idx)}
                                    className={`w-24 h-24 border-4 transition-all ${activeImg === idx ? 'border-brand-orange' : 'border-brand-teal/10 hover:border-brand-teal'}`}
                                >
                                    <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-10">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="px-3 py-1 bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest">{product.category}</span>
                                <span className="text-[10px] font-black text-brand-teal/40 uppercase tracking-widest flex items-center gap-2"><Package size={14} /> Référence: {product._id.slice(-6).toUpperCase()}</span>
                            </div>
                            <h1 className="text-5xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-4">{product.name}</h1>
                            <div className="flex items-center gap-4">
                                <div className="flex text-brand-orange">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < Math.round(product.ratings?.average || 0) ? 'fill-current' : ''} />)}
                                </div>
                                <span className="text-[10px] font-black text-brand-teal/60">({product.ratings?.count || 0} AVIS CERTIFIÉS)</span>
                            </div>
                        </div>

                        <p className="text-sm font-bold text-brand-slate opacity-60 leading-relaxed border-l-4 border-brand-teal/20 pl-6 bg-brand-cream/40 py-4 italic">
                            {product.description}
                        </p>

                        <div className="grid grid-cols-2 gap-8 border-t-2 border-brand-teal/5 pt-8">
                            <div>
                                <p className="text-[9px] font-black text-brand-teal/30 uppercase mb-2">Disponibilité Flux</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${product.stock?.available > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-sm font-black uppercase text-brand-teal">{product.stock?.available} UNITÉS EN STOCK</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-brand-teal/30 uppercase mb-2">Unité de Mesure</p>
                                <p className="text-sm font-black uppercase text-brand-teal">STANDARD INDUSTRIEL</p>
                            </div>
                        </div>

                        <div className="bg-brand-teal p-10 text-white border-8 border-brand-teal shadow-[16px_16px_0px_0px_rgba(45,90,90,0.1)] flex flex-wrap items-center justify-between gap-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Net à Payer (HT)</p>
                                <p className="text-4xl font-black">{(product.price || 0).toLocaleString()} <span className="text-sm">DT</span></p>

                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4 bg-white/10 border-2 border-white/20 p-2">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:text-brand-orange transition-colors"><Minus size={18} /></button>
                                    <span className="w-10 text-center text-xl font-black">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:text-brand-orange transition-colors"><Plus size={18} /></button>
                                </div>
                                <button 
                                    onClick={handleAddToCart}
                                    className="px-8 py-5 bg-brand-orange text-white text-xs font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(255,120,80,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <ShoppingCart size={18} /> INJECTER AU PANIER
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Specifications */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 border-t-4 border-brand-teal/5 pt-20">
                    <div className="lg:col-span-2 space-y-12">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal mb-8 border-l-8 border-brand-orange pl-6">Fiche de Spécification</h3>
                            <div className="bg-white border-4 border-brand-teal">
                                {product.specifications?.map((spec, i) => (
                                    <div key={i} className={`flex justify-between p-6 ${i !== 0 && 'border-t-2 border-brand-teal/5'} ${i % 2 !== 0 && 'bg-brand-cream/20'}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">{spec.key}</span>
                                        <span className="text-xs font-black uppercase text-brand-teal">{spec.value}</span>
                                    </div>
                                ))}
                                {(!product.specifications || product.specifications.length === 0) && (
                                    <div className="p-10 text-center text-brand-teal/20 italic text-xs font-bold">AUCUNE DONNÉE TECHNIQUE ENREGISTRÉE.</div>
                                )}
                            </div>
                        </div>

                        {/* Similar Products Placeholder */}
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal mb-8">Ressources Connexes</h3>
                            <div className="grid grid-cols-3 gap-6 opacity-40 grayscale">
                                {[1,2,3].map(i => (
                                    <div key={i} className="bg-white border-2 border-dashed border-brand-teal/20 p-8 text-center text-[10px] font-black uppercase tracking-widest">
                                        ANALYSE DU GISEMENT SIMILAIRE...
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="space-y-12">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal border-l-8 border-brand-teal pl-6">Retours d'Expérience</h3>
                        
                        {/* Add Review */}
                        <form onSubmit={handleReview} className="bg-brand-cream p-8 border-4 border-brand-teal/10 space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal/40">Évaluer le Gisement</p>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(i => (
                                    <button 
                                        type="button" 
                                        key={i} 
                                        onClick={() => setNewReview({...newReview, rating: i})}
                                        className={`transition-all ${i <= newReview.rating ? 'text-brand-orange' : 'text-brand-teal/10'}`}
                                    >
                                        <Star size={24} className={i <= newReview.rating ? 'fill-current' : ''} />
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                required
                                className="w-full bg-white border-4 border-brand-teal/10 p-4 text-[10px] font-bold outline-none focus:border-brand-teal h-24 resize-none"
                                placeholder="OBSERVATIONS TECHNIQUES..."
                                value={newReview.comment}
                                onChange={e => setNewReview({...newReview, comment: e.target.value})}
                            />
                            <button type="submit" className="w-full py-4 bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all">SOUMETTRE LE RAPPORT</button>
                        </form>

                        <div className="space-y-6">
                            {product.reviews?.map((rev, i) => (
                                <div key={i} className="p-6 bg-white border-2 border-brand-teal/5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex text-brand-orange">
                                            {[...Array(5)].map((_, si) => <Star key={si} size={10} className={si < rev.rating ? 'fill-current' : ''} />)}
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-brand-teal/30">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-brand-slate opacity-80 leading-relaxed italic">"{rev.comment}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProductDetail;
