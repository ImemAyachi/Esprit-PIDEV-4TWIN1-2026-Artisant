import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useProductStore from '../store/productStore';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { 
    Search, Mic, MicOff, Settings, ArrowLeft, 
    ShoppingCart, Image as ImageIcon, Filter, 
    Loader2, Plus, Info, X, Check, ChevronDown,
    SortAsc, SlidersHorizontal, Package, Star
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getImageUrl } from '../utils/imageUrl';

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
                                    {products.map(product => (
                                        <div key={product._id} className="bg-white border-4 border-brand-teal relative group hover:shadow-[16px_16px_0px_0px_rgba(45,90,90,0.1)] transition-all">
                                            {/* Image Area */}
                                            <div className="relative h-60 bg-brand-cream overflow-hidden cursor-pointer" onClick={() => navigate(`/marketplace/${product._id}`)}>
                                                <img 
                                                    src={product.images?.[0]?.url || '/placeholder.png'} 
                                                    alt={product.images?.[0]?.alt || product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-0 right-0 bg-white border-b-4 border-l-4 border-brand-teal px-4 py-2 flex items-center gap-1">
                                                    <Star size={10} className="fill-brand-orange text-brand-orange" />
                                                    <span className="text-[10px] font-black">{product.ratings?.average || '0.0'}</span>
                                                </div>
                                                {product.stock?.available <= 5 && (
                                                    <div className="absolute bottom-4 left-4 bg-red-500 text-white px-4 py-1 text-[9px] font-black uppercase tracking-widest animate-pulse">
                                                        Stock Critique: {product.stock?.available}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details Area */}
                                            <div className="p-8 border-t-4 border-brand-teal">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <p className="text-[8px] font-black uppercase text-brand-teal/40 tracking-widest mb-1">{product.category}</p>
                                                        <h3 className="text-xl font-black uppercase tracking-tighter text-brand-teal group-hover:text-brand-orange transition-colors line-clamp-1">{product.name}</h3>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mb-8 text-[9px] font-black text-brand-teal/60 opacity-60 uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                                                    <span>{product.manufacturer?.companyName || 'Usine Alpha'}</span>
                                                </div>

                                                <div className="flex items-end justify-between pt-6 border-t-2 border-brand-teal/5">
                                                    <div>
                                                        <p className="text-[8px] font-black text-brand-teal/30 uppercase mb-1">Prix Unitaire</p>
                                                        <p className="text-2xl font-black text-brand-teal">{product.price?.toLocaleString()} <span className="text-xs">DT</span></p>
                                                    </div>
                                                    <button 
                                                        onClick={() => addItem(product)}
                                                        className="w-14 h-14 bg-brand-teal text-white flex items-center justify-center hover:bg-brand-orange transition-all shadow-[4px_4px_0px_0px_rgba(45,90,90,0.2)] active:scale-95"
                                                    >
                                                        <Plus size={24} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
