import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Download, MoreVertical, 
    Send, CheckCircle2, AlertTriangle, FileText, 
    RefreshCw, Trash2, Calendar, User, DollarSign,
    ExternalLink, History
} from 'lucide-react';
import useQuoteStore from '../../store/quoteStore';
import QuoteModal from './QuoteModal';
import { toast } from 'react-hot-toast';

const QuoteDashboard = () => {
    const { quotes, fetchMyQuotes, deleteQuote, reactivateQuote, loading } = useQuoteStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [filters, setFilters] = useState({ status: 'all', search: '' });

    useEffect(() => {
        fetchMyQuotes();
    }, [fetchMyQuotes]);

    const filteredQuotes = quotes.filter(q => {
        const matchesStatus = filters.status === 'all' || q.status === filters.status;
        const matchesSearch = q.title?.toLowerCase().includes(filters.search.toLowerCase()) || 
                            q.client?.name?.toLowerCase().includes(filters.search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'accepted': return 'bg-green-100 border-green-500 text-green-700';
            case 'sent': return 'bg-blue-100 border-blue-500 text-blue-700';
            case 'expired': return 'bg-red-100 border-red-500 text-red-700';
            case 'draft': return 'bg-gray-100 border-gray-400 text-gray-600';
            default: return 'bg-brand-orange/10 border-brand-orange text-brand-orange';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-brand-teal p-8 shadow-[8px_8px_0px_0px_rgba(45,90,90,0.05)]">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/30" size={18} />
                        <input 
                            className="w-full bg-brand-cream border-2 border-brand-teal/10 px-12 py-3 text-sm font-bold uppercase outline-none focus:border-brand-teal transition-all"
                            placeholder="Rechercher un dossier..."
                            value={filters.search}
                            onChange={e => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <select 
                        className="bg-brand-cream border-2 border-brand-teal/10 px-6 py-3 text-[10px] font-black uppercase outline-none focus:border-brand-teal"
                        value={filters.status}
                        onChange={e => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="all">Tous Status</option>
                        <option value="draft">Brouillons</option>
                        <option value="sent">Expédiés</option>
                        <option value="accepted">Acceptés</option>
                        <option value="expired">Expirés</option>
                    </select>
                </div>
                <button 
                    onClick={() => { setEditingQuote(null); setIsModalOpen(true); }}
                    className="w-full md:w-auto px-10 py-4 bg-brand-teal text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-orange transition-all shadow-[8px_8px_0px_0px_rgba(45,90,90,0.2)]"
                >
                    <Plus size={18} /> Initialiser Devis
                </button>
            </div>

            {/* Quote Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredQuotes.map(q => (
                    <div key={q._id} className="bg-white border-4 border-brand-teal p-8 relative group hover:shadow-[12px_12px_0px_0px_rgba(45,90,90,0.1)] transition-all">
                        <div className={`absolute top-0 right-0 px-4 py-1 text-[8px] font-black uppercase border-b-4 border-l-4 ${getStatusStyle(q.status)}`}>
                            {q.status}
                        </div>

                        <div className="mb-8">
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal opacity-40 mb-2">Ref: {q.quoteNumber}</p>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-brand-teal line-clamp-1 group-hover:text-brand-orange transition-colors">{q.title}</h3>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-3 text-xs font-bold text-brand-slate opacity-60">
                                <User size={14} className="text-brand-orange" />
                                <span>{q.client?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-brand-slate opacity-60">
                                <DollarSign size={14} className="text-brand-orange" />
                                <span className="font-black text-brand-teal">{q.financials?.grandTotal.toLocaleString()} DT</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-brand-slate opacity-60">
                                <Calendar size={14} className="text-brand-orange" />
                                <span className={q.status === 'expired' ? 'text-red-500' : ''}>
                                    Expire le: {new Date(q.validUntil).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t-2 border-brand-teal/5 pt-6">
                            <button 
                                onClick={() => { setEditingQuote(q); setIsModalOpen(true); }}
                                className="py-3 border-2 border-brand-teal text-[9px] font-black uppercase hover:bg-brand-teal hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <FileText size={14} /> Editer
                            </button>
                            {q.status === 'expired' ? (
                                <button 
                                    onClick={() => reactivateQuote(q._id)}
                                    className="py-3 bg-brand-orange text-white text-[9px] font-black uppercase hover:bg-brand-teal transition-all flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={14} /> Réactiver
                                </button>
                            ) : (
                                <button 
                                    onClick={() => window.open(`/quotes/${q._id}/accept`, '_blank')}
                                    className="py-3 bg-brand-teal text-white text-[9px] font-black uppercase hover:bg-brand-orange transition-all flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={14} /> Client View
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <QuoteModal 
                    quote={editingQuote} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => fetchMyQuotes()}
                />
            )}
        </div>
    );
};

export default QuoteDashboard;
