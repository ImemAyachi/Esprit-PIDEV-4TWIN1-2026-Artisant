import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useProductStore from '../store/productStore';
import useAuthStore from '../store/authStore';
import { Search, Mic, MicOff, Settings, ArrowLeft, ShoppingCart, Image as ImageIcon, Filter, Loader2, Plus, Info } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { getImageUrl } from '../utils/imageUrl';

const CATEGORIES = ['Tous', 'Textile', 'Céramique', 'Bijoux', 'Bois', 'Cuir', 'Métal', 'Autre'];

export default function Marketplace() {
    const { products, pagination, loading, fetchProducts } = useProductStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [filters, setFilters] = useState({ search: '', category: '', minPrice: '', maxPrice: '', page: 1 });
    const [listening, setListening] = useState(false);
    const [cart, setCart] = useState([]);
    const recognitionRef = useRef(null);

    const load = useCallback(() => {
        const f = { ...filters };
        if (f.category === 'Tous') f.category = '';
        fetchProducts(f);
    }, [filters, fetchProducts]);

    useEffect(() => { load(); }, [load]);

    // Voice search — Web Speech API (Zahra's feature)
    const startVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('ERREUR SYSTEME: La recherche vocale n\'est pas supportée par ce périphérique.');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.interimResults = false;
        recognition.onstart = () => setListening(true);
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setFilters((f) => ({ ...f, search: transcript, page: 1 }));
        };
        recognition.onend = () => setListening(false);
        recognition.onerror = () => setListening(false);
        recognitionRef.current = recognition;
        recognition.start();
    };

    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i._id === product._id);
            if (existing) return prev.map((i) => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters((f) => ({ ...f, [key]: value, page: 1 }));
    };

    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    return (
        <DashboardLayout currentTab="Marketplace">
            <div className="pb-20">
                {/* Header */}
                <div className="bg-white border-b-8 border-brand-teal px-8 py-6 sticky top-0 z-30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="m-0 text-3xl font-black uppercase tracking-tighter text-brand-teal leading-none">
                                Réseau d'Approvisionnement
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-orange mt-1">Plateforme Industrielle d'Échange</p>
                        </div>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={() => navigate('/order/new', { state: { cart } })}
                            className="btn-primary flex items-center gap-3 animate-in"
                            aria-label={`Panier, ${cart.length} produits, total ${cartTotal.toFixed(2)} DT`}
                        >
                            <ShoppingCart size={18} />
                            <span className="flex flex-col items-start leading-tight">
                                <span className="text-[10px] tracking-widest opacity-80">Finaliser ({cart.length})</span>
                                <span className="text-sm">{cartTotal.toFixed(2)} DT</span>
                            </span>
                        </button>
                    )}
                </div>

                {/* Search + Filters (Zahra) */}
                <section aria-label="Filtres de recherche" className="p-8 max-w-7xl mx-auto border-b-4 border-brand-teal/20 mb-8 pb-10">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 relative">
                        {/* Main search bar */}
                        <div className="flex-1 relative flex items-center">
                            <label htmlFor="search-input" className="sr-only">Rechercher un produit</label>
                            <Search className="absolute left-4 text-brand-teal/40" size={20} />
                            <input
                                id="search-input"
                                type="search"
                                placeholder="RECHERCHER UNE RÉFÉRENCE, UN MATÉRIAU..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-12 pr-12 py-4 bg-white border-4 border-brand-teal text-brand-teal text-sm font-black uppercase tracking-widest placeholder:-brand-teal/30 focus:outline-none focus:border-brand-orange"
                            />
                            {/* Voice search button */}
                            <button
                                onClick={startVoiceSearch}
                                aria-label={listening ? 'Écoute en cours...' : 'Activer la recherche vocale'}
                                className={`absolute right-2 p-2 border-2 transition-all flex items-center justify-center ${listening ? 'bg-red-50 border-red-500 text-red-500 animate-pulse' : 'border-transparent text-brand-teal hover:bg-brand-teal/10'} focus:outline-none`}
                            >
                                {listening ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <div className="relative">
                                <label htmlFor="min-price" className="sr-only">Prix minimum</label>
                                <input id="min-price" type="number" placeholder="MIN (DT)" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} className="w-28 py-4 px-4 bg-white border-2 border-brand-teal text-brand-teal text-sm font-black uppercase focus:outline-none focus:border-brand-orange text-center" />
                            </div>
                            <div className="relative">
                                <label htmlFor="max-price" className="sr-only">Prix maximum</label>
                                <input id="max-price" type="number" placeholder="MAX (DT)" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} className="w-28 py-4 px-4 bg-white border-2 border-brand-teal text-brand-teal text-sm font-black uppercase focus:outline-none focus:border-brand-orange text-center" />
                            </div>
                        </div>

                        {user?.role === 'manufacturer' || user?.role === 'admin' ? (
                            <button onClick={() => navigate('/manage-products')} className="btn-secondary whitespace-nowrap flex items-center justify-center gap-2">
                                <Settings size={18} /> Console Fabricant
                            </button>
                        ) : null}
                    </div>

                    {/* Category filter */}
                    <div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => {
                            const isSelected = filters.category === cat || (cat === 'Tous' && !filters.category);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleFilterChange('category', cat === 'Tous' ? '' : cat)}
                                    aria-pressed={isSelected}
                                    className={`px-4 py-2 border-2 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus:border-brand-orange ${isSelected ? 'bg-brand-teal border-brand-teal text-white shadow-[2px_2px_0_0_#A66E4E]' : 'bg-white border-brand-teal text-brand-teal hover:bg-brand-cream'}`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Product Grid (Linda) */}
                <main id="main-content" className="px-8 max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-brand-teal border-l-4 border-brand-orange pl-4">Ressources Disponibles</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/50" aria-live="polite">
                            {loading ? 'CALCUL DU VOLUME...' : `UNITÉS TROUVÉES: ${pagination?.total || products.length}`}
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center p-20 border-4 border-brand-teal/20 bg-white" role="status" aria-live="polite">
                            <Loader2 className="animate-spin text-brand-orange mx-auto mb-4" size={48} />
                            <p className="text-xs font-black uppercase tracking-widest text-brand-teal">Traitement de la requête...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center p-20 border-4 border-brand-teal/20 bg-white">
                            <Filter className="mx-auto text-brand-teal/20 mb-4" size={64} />
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal/30 mb-2">Base vide</h3>
                            <p className="text-sm font-black uppercase tracking-widest text-brand-teal">Aucune correspondance dans l'inventaire.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {products.map((product) => (
                                    <article
                                        key={product._id}
                                        className="bg-white border-4 border-brand-teal flex flex-col hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#2D5A5A] transition-all group"
                                    >
                                        {/* Product image with alt text (Linda accessibility ♿) */}
                                        <div className="relative h-48 border-b-4 border-brand-teal overflow-hidden bg-brand-cream/50 flex items-center justify-center">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={getImageUrl(product.images[0])}
                                                    alt={`Photo du produit ${product.name} dans la catégorie ${product.category}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div
                                                    role="img"
                                                    aria-label={`Aucune image disponible pour ${product.name}`}
                                                    className="text-brand-teal/20"
                                                >
                                                    <ImageIcon size={64} />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-brand-orange text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                {product.category}
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h2 className="text-lg font-black uppercase tracking-tight text-brand-teal mb-2 leading-tight">{product.name}</h2>
                                            <p className="m-0 text-brand-slate opacity-60 text-xs font-bold leading-relaxed line-clamp-2 flex-1 relative">
                                                {product.description}
                                            </p>
                                            <div className="mt-6 pt-4 border-t-2 border-brand-teal/10 flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40">Tarif Unitaire</span>
                                                    <strong className="text-xl font-black text-brand-teal leading-none mt-1">{product.price?.toFixed(2)} DT</strong>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className="w-12 h-12 bg-white border-2 border-brand-teal flex items-center justify-center text-brand-teal hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all focus:outline-none focus:ring-4 focus:ring-brand-orange/30 group/cart shrink-0"
                                                    aria-label={`Ajouter ${product.name} au panier`}
                                                >
                                                    <Plus size={20} className="group-active/cart:scale-90 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination?.pages > 1 && (
                                <nav aria-label="Pagination" className="mt-12 flex justify-center gap-2">
                                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
                                        const isCurrent = filters.page === p;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setFilters((f) => ({ ...f, page: p }))}
                                                aria-current={isCurrent ? 'page' : undefined}
                                                className={`w-10 h-10 border-2 flex items-center justify-center text-sm font-black transition-all focus:outline-none ${isCurrent ? 'bg-brand-teal border-brand-teal text-white' : 'bg-white border-brand-teal text-brand-teal hover:bg-brand-cream'}`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </nav>
                            )}
                        </>
                    )}
                </main>
            </div>
        </DashboardLayout>
    );
}
