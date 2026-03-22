import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { 
    FileText, FolderPlus, Eye, Heart, Download, Search, Plus, 
    ChevronRight, MoreVertical, Share2, Trash2, Folder, 
    Tag as TagIcon, ArrowLeft, Upload, Loader2, X, Archive
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import DocumentPreview from './DocumentPreview';
import { toast } from 'react-hot-toast';

const DocumentLibrary = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentFolder, setCurrentFolder] = useState('Root');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showUploadModal, setShowUploadModal] = useState(false);
    
    const { user } = useAuthStore();

    useEffect(() => {
        fetchDocuments();
    }, [search, currentFolder]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/documents', {
                params: { search, folder: currentFolder !== 'Root' ? currentFolder : undefined }
            });
            if (response.data?.data?.documents) {
                setDocuments(response.data.data.documents);
            }
        } catch (err) {
            toast.error('Network protocol error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress(10);
        
        try {
            for (const file of files) {
                // Mocking upload for single file handling
                // In production, use FormData and proper axios config for tracking
                const formData = new FormData();
                formData.append('file', file);
                formData.append('title', file.name);
                formData.append('description', 'Technical asset uploaded via system node');
                formData.append('type', 'Technical Sheet');
                formData.append('category', 'General');
                formData.append('folder[name]', currentFolder);
                formData.append('fileUrl', 'https://placeholder.com/' + file.name); // Mock URL

                await api.post('/documents', {
                    title: file.name,
                    description: 'Technical asset uploaded via system node',
                    type: 'Technical Sheet',
                    category: 'General',
                    folder: { name: currentFolder },
                    fileUrl: 'https://placeholder.com/' + file.name // Mock for demo
                });
                
                setUploadProgress(prev => prev + (90 / files.length));
            }
            toast.success('All assets integrated into ledger');
            setShowUploadModal(false);
            fetchDocuments();
        } catch (err) {
            toast.error('Upload sequence aborted');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const toggleFavorite = async (docId) => {
        try {
            await api.put(`/documents/${docId}/favorite`);
            toast.success('Watchlist updated');
            // Optimistic update or refetch
        } catch (err) {
            toast.error('Watchlist protocol failure');
        }
    };

    const folders = ['Root', 'Manuals', 'Technical Sheets', 'Legal Nodes', 'Drawings'];

    return (
        <div className="bg-white border-8 border-brand-teal p-0 flex flex-col h-full min-h-[700px] font-outfit shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
            {/* Explorer Header */}
            <div className="bg-brand-teal text-white p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h3 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 italic underline decoration-brand-orange decoration-8 underline-offset-8 mb-4">
                        <FolderOpen size={40} className="text-brand-orange" />
                        Industrial Repository
                   </h3>
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                        SYSTEM NODE: <span className="p-1 bg-white/10 text-white rounded-sm">{user?.role}</span>
                        <ChevronRight size={14} />
                        PATH: <span className="text-brand-orange underline">/ {currentFolder}</span>
                   </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input 
                            type="text" 
                            placeholder="SEARCH LEDGER..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border-2 border-white/20 p-4 pl-12 font-black uppercase tracking-[0.2em] text-[10px] focus:bg-white focus:text-brand-teal outline-none transition-all placeholder:text-white/10"
                        />
                    </div>
                    {['admin', 'expert', 'manufacturer'].includes(user?.role) && (
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="bg-brand-orange border-4 border-black text-white px-8 h-14 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-4px_4px_0px_0px_rgba(255,255,255,1)] transition-all shrink-0"
                        >
                            <Upload size={18} /> INGEST ASSET
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Explorer */}
                <div className="w-64 border-r-4 border-brand-teal/10 bg-brand-cream p-4 flex flex-col gap-2 shrink-0 hidden md:flex">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40 p-2 mb-2">Structure Hub</p>
                    {folders.map(f => (
                        <button 
                            key={f}
                            onClick={() => setCurrentFolder(f)}
                            className={`flex items-center gap-3 p-4 font-black uppercase text-[10px] tracking-widest transition-all border-2 ${currentFolder === f ? 'bg-brand-teal text-white border-brand-teal' : 'bg-transparent text-brand-teal/60 border-transparent hover:border-brand-teal/20'}`}
                        >
                            {f === 'Root' ? <LayoutDashboard size={14} /> : <Folder size={14} />}
                            {f}
                        </button>
                    ))}
                    <div className="mt-auto p-4 border-t-2 border-brand-teal/10">
                        <p className="text-[8px] font-black text-brand-teal/20 mb-3 tracking-widest">DRIVE STORAGE</p>
                        <div className="w-full h-2 bg-brand-teal/5 border border-brand-teal/10 relative">
                            <div className="absolute top-0 left-0 h-full bg-brand-orange w-3/4" />
                        </div>
                        <p className="text-[8px] font-black text-brand-teal/40 mt-2 tracking-widest">7.2 GB / 10 GB</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-brand-teal" size={48} />
                                <p className="font-black uppercase tracking-[0.3em] text-brand-teal text-[10px]">Verifying Ledger Identity...</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {documents.map((doc) => (
                            <div 
                                key={doc._id}
                                className="bg-brand-cream border-4 border-black p-6 flex flex-col gap-6 group hover:translate-x-1 hover:-translate-y-1 transition-all hover:shadow-[-8px_8px_0px_0px_rgba(45,90,91,1)] cursor-pointer overflow-hidden border-b-[12px] relative"
                                onClick={() => setSelectedDoc(doc)}
                            >
                                <div className="absolute top-0 right-0 w-20 h-4 bg-brand-orange transform translate-x-12 translate-y-2 rotate-45" />

                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange italic">CATEGORY: {doc.type}</span>
                                        <h4 className="text-xl font-black uppercase tracking-tighter text-brand-teal leading-tight group-hover:underline underline-offset-4">{doc.title}</h4>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(doc._id); }}
                                        className="p-2 border-2 border-black bg-white hover:bg-brand-orange hover:text-white transition-all transform hover:-rotate-12"
                                    >
                                        <Heart size={16} />
                                    </button>
                                </div>

                                <p className="text-xs font-bold text-brand-slate/60 leading-relaxed uppercase tracking-wide line-clamp-2">
                                    {doc.description}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t-2 border-black/5">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-brand-teal flex items-center justify-center font-black text-[8px] text-white">
                                                {doc.uploadedBy?.companyName?.charAt(0) || 'U'}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"><Share2 size={14} /></button>
                                        <button className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"><Download size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {documents.length === 0 && !loading && (
                            <div className="col-span-full py-32 text-center border-4 border-dashed border-brand-teal/20">
                                <FileText className="mx-auto text-brand-teal/10 mb-6" size={80} />
                                <p className="font-black uppercase tracking-[0.4em] text-brand-teal/30 italic text-sm">No industrial assets detected in this pathway</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal Overlay */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl border-8 border-brand-orange p-10 flex flex-col gap-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-4 bg-brand-orange animate-pulse" />
                        
                        <div className="flex justify-between items-start">
                            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-brand-teal underline decoration-brand-orange">Asset Ingestion Matrix</h3>
                            <button onClick={() => !uploading && setShowUploadModal(false)} className="p-2 border-4 border-black hover:bg-black hover:text-white transition-all"><X size={20} /></button>
                        </div>

                        {!uploading ? (
                            <div className="border-4 border-dashed border-brand-teal/20 p-20 flex flex-col items-center gap-6 group hover:border-brand-orange transition-all relative">
                                <Upload size={80} className="text-brand-teal/10 group-hover:text-brand-orange transition-all group-hover:scale-110" />
                                <label className="cursor-pointer text-center">
                                    <p className="font-black uppercase tracking-[0.3em] text-brand-teal">Drag Assets Here or <span className="text-brand-orange underline">Browse Ledger</span></p>
                                    <p className="text-[10px] font-black text-brand-teal/30 mt-4 tracking-widest uppercase">Supported: PDF, IMG, CAD, XLSX, DOCX (MAX 50MB)</p>
                                    <input type="file" multiple className="hidden" onChange={handleUpload} />
                                </label>
                            </div>
                        ) : (
                            <div className="py-20 flex flex-col items-center gap-10">
                                <div className="relative w-48 h-48 border-8 border-black flex items-center justify-center">
                                    <div className="text-4xl font-black italic text-brand-teal">{Math.round(uploadProgress)}%</div>
                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                        <circle 
                                            cx="96" cy="96" r="88" 
                                            stroke="currentColor" 
                                            strokeWidth="12" 
                                            fill="transparent" 
                                            className="text-brand-teal/10" 
                                        />
                                        <circle 
                                            cx="96" cy="96" r="88" 
                                            stroke="currentColor" 
                                            strokeWidth="12" 
                                            fill="transparent" 
                                            strokeDasharray={552.92}
                                            strokeDashoffset={552.92 * (1 - uploadProgress / 100)}
                                            className="text-brand-orange transition-all duration-300" 
                                        />
                                    </svg>
                                </div>
                                <p className="font-black uppercase tracking-[0.5em] text-brand-teal animate-pulse">Syncing with Industrial Node...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedDoc && <DocumentPreview document={selectedDoc} onClose={() => setSelectedDoc(null)} />}
        </div>
    );
};

export default DocumentLibrary;
