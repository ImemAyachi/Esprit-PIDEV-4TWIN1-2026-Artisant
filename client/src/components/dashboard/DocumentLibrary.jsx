import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FileText, FolderPlus, Eye, Heart, Download, Search, Plus } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const DocumentLibrary = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [favorites, setFavorites] = useState([]);
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.profile?.favoriteDocuments) {
            setFavorites(user.profile.favoriteDocuments);
        }
    }, [user]);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents');
            if (response.data && response.data.data && response.data.data.documents) {
                setDocuments(response.data.data.documents);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch documents', err);
            setLoading(false);
        }
    };

    const toggleFavorite = async (docId) => {
        try {
            const response = await api.put(`/documents/${docId}/favorite`);
            setFavorites(response.data.data.favorites);
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const categories = ['All', 'Manual', 'Technical Sheet', 'Legal'];

    // Placeholder data to test UI
    const mockDocs = [
        {
            _id: '1',
            title: 'Safety Regulations 2026',
            category: 'Legal',
            description: 'Updated safety protocols for artisan workshops.',
            uploadedBy: { name: 'Admin Headquarters' },
            createdAt: '2026-02-15'
        },
        {
            _id: '2',
            title: 'Cement Mixing Guide',
            category: 'Manual',
            description: 'Standard procedures for high-grade concrete.',
            uploadedBy: { name: 'Expert Builder' },
            createdAt: '2026-01-20'
        }
    ];

    const displayDocs = documents.length > 0 ? documents : mockDocs;

    const filteredDocs = filter === 'All'
        ? displayDocs
        : displayDocs.filter(doc => doc.category === filter);

    return (
        <div className="bg-white border-4 border-brand-teal p-8 flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-brand-teal flex items-center gap-3">
                        <FolderPlus className="w-8 h-8 text-brand-orange" />
                        Expert Knowledge Base
                    </h3>
                    <p className="text-sm font-bold text-brand-slate/60 mt-1">Access verified technical documentation and resources.</p>
                </div>

                {['Admin', 'Expert'].includes(user?.role) && (
                    <button className="flex items-center gap-2 bg-brand-teal text-white px-6 py-3 font-black uppercase tracking-widest text-xs hover:bg-brand-orange transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                        <Plus size={16} /> Upload Document
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 mb-8 border-b-2 border-brand-teal/10 pb-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        aria-pressed={filter === cat}
                        className={`px-4 py-2 font-black uppercase tracking-widest text-[10px] border-2 transition-all focus:z-10 ${filter === cat
                            ? 'bg-brand-teal text-white border-brand-teal'
                            : 'bg-transparent text-brand-teal/40 border-transparent hover:border-brand-teal/20'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc) => {
                    const isFav = favorites.includes(doc._id);
                    return (
                        <div
                            key={doc._id}
                            tabIndex="0"
                            aria-label={`Document: ${doc.title}. Category: ${doc.category}. Description: ${doc.description}`}
                            className="group relative border-2 border-brand-teal/10 bg-brand-cream hover:bg-white hover:border-brand-teal transition-all p-6 flex flex-col justify-between h-64 focus:z-20 cursor-pointer"
                        >

                            {/* Top: Category & Actions */}
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-brand-teal/10 text-brand-teal px-2 py-1 text-[8px] font-black uppercase tracking-widest">
                                    {doc.category}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(doc._id); }}
                                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                                        className={`p-2 rounded-full transition-colors focus:z-10 ${isFav ? 'bg-brand-orange text-white' : 'text-brand-slate/40 hover:bg-brand-orange hover:text-white'}`}
                                    >
                                        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                                    </button>
                                    <button
                                        aria-label="Download Document"
                                        className="p-2 hover:bg-brand-teal hover:text-white rounded-full transition-colors text-brand-slate/40 focus:z-10"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Middle: Content */}
                            <div>
                                <h4 className="font-black text-brand-teal text-lg leading-tight mb-2 group-hover:text-brand-orange transition-colors">
                                    {doc.title}
                                </h4>
                                <p className="text-xs text-brand-slate opacity-60 line-clamp-3 leading-relaxed">
                                    {doc.description}
                                </p>
                            </div>

                            {/* Bottom: Meta */}
                            <div className="mt-4 pt-4 border-t border-brand-teal/10 flex justify-between items-center text-[10px] font-bold text-brand-slate/40 uppercase tracking-wide">
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
                                    Verified
                                </span>
                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>

                            {/* Hover Overlay Effect */}
                            <div className="absolute inset-0 border-4 border-transparent group-hover:border-brand-teal pointer-events-none transition-all"></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentLibrary;
