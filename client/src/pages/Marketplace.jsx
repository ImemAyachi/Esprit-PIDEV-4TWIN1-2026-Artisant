import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useProductStore from '../store/productStore';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { 
    Search, Mic, MicOff, Settings, ArrowLeft, 
    ShoppingCart, Image as ImageIcon, Filter, 
    Loader2, Plus, Info, X, Check, ChevronDown,
    SortAsc, SlidersHorizontal, Package, Star,
    Eye, AlertCircle, Wrench, Tag, Clock
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getImageUrl } from '../utils/imageUrl';
import { toast } from 'react-hot-toast';


const StatusBadge = ({ status }) => {
    const map = {
        disponible: 'bg-green-100 text-green-700',
        rupture: 'bg-red-100 text-red-700',
        en_cours: 'bg-blue-100 text-blue-700',
        planifié: 'bg-yellow-100 text-yellow-700',
        terminé: 'bg-green-100 text-green-700'
    };
    return (
        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-sm ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};


const CATEGORIES = [
    { id: 'all', label: 'Toutes Catégories' },
    { id: 'Ciment', label: 'Ciment & Liants' },
    { id: 'Acier', label: 'Acier & Métaux' },
    { id: 'Bois', label: 'Menuiserie Bois' },
    { id: 'Outillage', label: 'Outillage Machine' },
    { id: 'Plaques', label: 'Isolants & Plaques' }
];

export default function Marketplace() {
    const { products, loading, fetchProducts } = useProductStore();
    const { addItem, items: cartItems, getFinancials } = useCartStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [filters, setFilters] = useState({ 
        search: '', 
        category: 'all', 
        minPrice: '', 
        maxPrice: '', 
        sort: 'newest',
        status: 'active'
    });
    
    const [isListening, setIsListening] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(filters);
        }, 500); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [filters, fetchProducts]);

    const startVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const rec = new SpeechRecognition();
        rec.lang = 'fr-FR';
        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (e) => setFilters({ ...filters, search: e.results[0][0].transcript });
        rec.start();
    };

    const cartTotal = getFinancials().subtotal;

    return (
        <DashboardLayout currentTab="Marketplace">
            <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-brand-cream">
                
                {/* ── Sidebar Filters ── */}
                <aside className={`bg-white border-r-4 border-brand-teal transition-all duration-500 overflow-y-auto ${sidebarOpen ? 'w-80' : 'w-0 border-r-0'}`}>
                    <div className="p-8 space-y-12 w-80">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal opacity-40 mb-6 flex items-center gap-2">
                                <Filter size={14} /> Paramètres de Flux
                            </h3>
                            <div className="space-y-2">
                                {CATEGORIES.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => setFilters({ ...filters, category: cat.id })}
                                        className={`w-full text-left p-4 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                            filters.category === cat.id ? 'bg-brand-teal text-white border-brand-teal shadow-[4px_4px_0px_0px_rgba(255,120,80,1)]' : 'bg-transparent text-brand-teal border-transparent hover:bg-brand-cream'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal opacity-40 mb-6">Tranche Tarifaire (DT)</h3>
                            <div className="flex gap-4">
                                <input 
                                    type="number" 
                                    placeholder="MIN" 
                                    className="w-full bg-brand-cream border-2 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal"
                                    value={filters.minPrice}
                                    onChange={e => setFilters({...filters, minPrice: e.target.value})}
                                />
                                <input 
                                    type="number" 
                                    placeholder="MAX" 
                                    className="w-full bg-brand-cream border-2 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal"
                                    value={filters.maxPrice}
                                    onChange={e => setFilters({...filters, maxPrice: e.target.value})}
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal opacity-40 mb-6">Tri des Ressources</h3>
                            <select 
                                className="w-full bg-brand-cream border-2 border-brand-teal/10 p-4 text-xs font-black uppercase outline-none focus:border-brand-teal"
                                value={filters.sort}
                                onChange={e => setFilters({...filters, sort: e.target.value})}
                            >
                                <option value="newest">Plus Récents</option>
                                <option value="price_asc">Prix Croissant</option>
                                <option value="price_desc">Prix Décroissant</option>
                                <option value="popular">Popularité</option>
                            </select>
                        </div>
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <main className="flex-1 flex flex-col min-w-0">
                    {/* Toolbar */}
                    <div className="bg-white border-b-4 border-brand-teal p-6 flex items-center justify-between gap-6 shrink-0 z-20">
                        <div className="flex items-center gap-6 flex-1">
                            <button 
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center hover:bg-brand-orange transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
                            >
                                <SlidersHorizontal size={20} />
                            </button>
                            <div className="flex-1 relative max-w-2xl group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-teal/30 group-focus-within:text-brand-orange transition-colors" size={20} />
                                <input 
                                    className="w-full pl-16 pr-16 py-4 bg-brand-cream border-2 border-brand-teal/10 text-xs font-black uppercase tracking-widest outline-none focus:border-brand-teal focus:bg-white transition-all shadow-inner"
                                    placeholder="RECHERCHER DANS LE GISEMENT INDUSTRIEL..."
                                    value={filters.search}
                                    onChange={e => setFilters({...filters, search: e.target.value})}
                                />
                                <button 
                                    onClick={startVoiceSearch}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-brand-teal/20 hover:text-brand-teal'}`}
                                >
                                    {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                                </button>
                            </div>
                        </div>

                        {cartItems.length > 0 && (
                            <button 
                                onClick={() => navigate('/checkout')}
                                className="px-8 py-4 bg-brand-orange text-white text-xs font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(45,90,90,0.2)] hover:bg-brand-teal transition-all flex items-center gap-4 animate-in slide-in-from-right-4"
                            >
                                <ShoppingCart size={20} />
                                <div className="flex flex-col items-start leading-none gap-1">
                                    <span className="text-[8px] font-black opacity-60">FINALISER ({cartItems.length})</span>
                                    <span>{cartTotal.toLocaleString()} DT</span>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex justify-between items-end mb-12">
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-2">Gisement Matériaux</h2>
                                    <p className="text-[10px] font-black uppercase text-brand-teal/30 tracking-[0.4em]">Flux Actif / Qualité Certifiée Artisant</p>
                                </div>
                                <p className="text-[10px] font-black uppercase text-brand-orange">Unités Disponibles: {products.length}</p>
                            </div>

                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4">
                                    <Loader2 size={48} className="animate-spin text-brand-orange" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40 italic">Interrogation du stock central...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                                    {products.map((product, index) => {
                                        const stock = product.stock?.available ?? 0;
                                        const isOutOfStock = stock <= 0;
                                        const isLowStock = stock > 0 && stock <= 5;

                                        return (
                                            <div 
                                                key={product._id} 
                                                className="group relative bg-white border-4 border-brand-teal flex flex-col hover:border-brand-orange hover:-translate-y-2 transition-all duration-500 ease-out animate-in"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                {/* Product Reference Header */}
                                                <div className="absolute -top-3 -left-3 bg-brand-teal text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 z-10 border-2 border-white shadow-sm">
                                                    REF: {String(product._id).slice(-8).toUpperCase()}
                                                </div>

                                                {/* Image Area - The Gisement View */}
                                                <div 
                                                    className="relative h-72 bg-brand-cream overflow-hidden cursor-pointer group/img" 
                                                    onClick={() => navigate(`/marketplace/${product._id}`)}
                                                >
                                                    <img 
                                                        src={getImageUrl(product.images?.[0]) || '/placeholder.png'} 
                                                        alt={product.images?.[0]?.alt || product.name}
                                                        className={`w-full h-full object-cover transition-all duration-1000 ease-in-out group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                                                    />
                                                    
                                                    {/* Rating Shard */}
                                                    <div className="absolute top-0 right-0 bg-white/95 backdrop-blur-sm border-b-4 border-l-4 border-brand-teal px-4 py-2 flex items-center gap-2 transform translate-x-px -translate-y-px z-10 transition-colors group-hover:border-brand-orange">
                                                        <Star size={12} className="fill-brand-orange text-brand-orange" />
                                                        <span className="text-xs font-black text-brand-teal">{product.ratings?.average || '0.0'}</span>
                                                    </div>

                                                    {/* Status Overlays */}
                                                    {isOutOfStock && (
                                                        <div className="absolute inset-0 bg-brand-slate/60 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                                                            <div className="border-2 border-white/30 p-2 transform rotate-[-5deg]">
                                                                <span className="text-white text-xl font-black uppercase tracking-tighter border-2 border-white px-4 py-2">Rupture de Stock</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {isLowStock && !isOutOfStock && (
                                                        <div className="absolute bottom-4 left-0 w-full px-4 overflow-hidden pointer-events-none">
                                                            <div className="bg-red-600 text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse flex items-center justify-center gap-2 border-t-2 border-b-2 border-white/20">
                                                                <AlertCircle size={12} /> Stock Critique: {stock} UNITÉS
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Quick Action Overlay (Mobile & Hover) */}
                                                    <div className="absolute inset-0 bg-brand-teal/0 group-hover/img:bg-brand-teal/10 transition-all duration-500 flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                                        <div className="w-12 h-12 rounded-full bg-white text-brand-teal flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95">
                                                            <Eye size={20} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Structural Details Area */}
                                                <div className="p-8 flex-1 flex flex-col">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="bg-brand-teal/10 text-brand-teal text-[9px] font-black uppercase tracking-widest px-2 py-1">
                                                                    {product.category}
                                                                </span>
                                                                <StatusBadge status={isOutOfStock ? 'rupture' : 'disponible'} />
                                                            </div>
                                                            <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal group-hover:text-brand-orange transition-colors line-clamp-2 leading-none">
                                                                {product.name}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 mb-8 flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-brand-teal/5 flex items-center justify-center border border-brand-teal/10">
                                                            <Wrench size={14} className="text-brand-teal/40" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/30 leading-none mb-1">Fabricant Autorisé</p>
                                                            <p className="text-[10px] font-bold text-brand-teal/60 uppercase">{product.manufacturer?.companyName || 'Usine Alpha'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-auto pt-6 border-t-2 border-brand-teal/5 flex items-end justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <Tag size={10} className="text-brand-orange" />
                                                                <p className="text-[9px] font-black text-brand-teal/30 uppercase tracking-widest leading-none">Prix Unitaire</p>
                                                            </div>
                                                            <p className="text-3xl font-black text-brand-teal flex items-baseline gap-1">
                                                                {product.price?.toLocaleString()} 
                                                                <span className="text-xs uppercase opacity-30">DT</span>
                                                            </p>
                                                        </div>

                                                        {/* Industrial Lever Button */}
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isOutOfStock) {
                                                                    addItem(product);
                                                                    toast.success(`${product.name} injecté au gisement.`);
                                                                } else {
                                                                    toast.error('Ressource épuisée dans le dépôt central.');
                                                                }
                                                            }}
                                                            disabled={isOutOfStock}
                                                            className={`w-16 h-16 flex items-center justify-center transition-all relative overflow-hidden group/btn ${
                                                                isOutOfStock 
                                                                ? 'bg-brand-teal/10 text-brand-teal/20 cursor-not-allowed' 
                                                                : 'bg-brand-teal text-white hover:bg-brand-orange shadow-[6px_6px_0px_0px_rgba(45,90,90,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(166,110,78,0.2)] active:scale-95'
                                                            }`}
                                                            title={isOutOfStock ? "Indisponible" : "Ajouter au gisement"}
                                                        >
                                                            {!isOutOfStock && (
                                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                                                            )}
                                                            {isOutOfStock ? <X size={24} /> : <Plus size={32} className="relative z-10" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Operational Footprint */}
                                                <div className={`h-1.5 w-full bg-brand-teal/5 relative overflow-hidden ${!isOutOfStock ? 'animate-pulse' : ''}`}>
                                                    <div 
                                                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isOutOfStock ? 'w-0' : 'w-full'} ${isLowStock ? 'bg-red-500' : 'bg-brand-green/30'}`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                            )}

                            {!loading && products.length === 0 && (
                                <div className="h-96 border-8 border-dashed border-brand-teal/10 flex flex-col items-center justify-center text-center p-20">
                                    <Package size={64} className="text-brand-teal/10 mb-8" />
                                    <h3 className="text-3xl font-black uppercase text-brand-teal opacity-20 mb-4">Aucune Ressource Détectée</h3>
                                    <p className="text-sm font-black uppercase tracking-widest text-brand-teal/40 max-w-md italic">Ajustez vos filtres de gisement pour élargir le spectre de recherche.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
