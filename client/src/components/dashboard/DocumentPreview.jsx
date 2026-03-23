import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Share2, History, FileText } from 'lucide-react';


const DocumentPreview = ({ document, onClose }) => {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [page, setPage] = useState(1);

    if (!document) return null;

    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(document.fileUrl);
    const isPDF = /\.pdf$/i.test(document.fileUrl);

    return (
        <div className="fixed inset-0 z-[100] bg-brand-teal/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 font-outfit">
            <div className="bg-white w-full h-full max-w-6xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden border-4 border-black">
                {/* Header */}
                <div className="h-16 border-b-4 border-black bg-brand-cream px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-orange text-white flex items-center justify-center font-black border-2 border-black transform -rotate-3">
                            {document.type?.charAt(0) || 'D'}
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-tight text-brand-teal leading-none">{document.title}</h3>
                            <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Version {document.currentVersion || 1.0} • {document.category}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex bg-black/5 p-1 border-2 border-black gap-1 mr-4">
                            <button onClick={() => setZoom(prev => Math.max(50, prev - 10))} className="p-1 hover:bg-white transition-colors"><ZoomOut size={16} /></button>
                            <span className="px-2 text-[10px] font-black flex items-center">{zoom}%</span>
                            <button onClick={() => setZoom(prev => Math.min(200, prev + 10))} className="p-1 hover:bg-white transition-colors"><ZoomIn size={16} /></button>
                        </div>
                        <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 border-2 border-black hover:bg-brand-orange hover:text-white transition-all"><RotateCw size={18} /></button>
                        <button onClick={onClose} className="p-2 border-2 border-black bg-black text-white hover:bg-brand-orange transition-all"><X size={18} /></button>
                    </div>
                </div>

                {/* Main Viewport */}
                <div className="flex-1 bg-brand-slate overflow-auto p-8 flex justify-center items-start custom-scrollbar relative">
                    <div 
                        className="bg-white shadow-2xl transition-all duration-300 origin-top"
                        style={{ 
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                            maxWidth: zoom > 100 ? 'none' : '100%'
                        }}
                    >
                        {isImage && (
                            <img src={document.fileUrl} alt={document.title} className="max-w-full h-auto" />
                        )}
                        {isPDF && (
                            <iframe 
                                src={`${document.fileUrl}#toolbar=0&navpanes=0`} 
                                className="w-[800px] h-[1100px] border-none"
                                title="PDF Preview"
                            />
                        )}
                        {!isImage && !isPDF && (
                            <div className="p-20 text-center">
                                <FileText size={80} className="mx-auto text-brand-teal/20 mb-6" />
                                <p className="font-black uppercase text-brand-teal">No visualization available for this protocol</p>
                                <p className="text-xs font-bold text-brand-teal/40 mt-2 tracking-widest">Format not supported for in-browser rendering</p>
                            </div>
                        )}
                    </div>

                    {/* PDF Controls overlay */}
                    {isPDF && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 flex items-center gap-6 border-b-4 border-brand-orange shadow-xl font-black text-xs tracking-widest">
                            <button onClick={() => setPage(p => Math.max(1, p-1))}><ChevronLeft size={20} /></button>
                            <span>PAGE {page} / 12</span>
                            <button onClick={() => setPage(p => p+1)}><ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="h-20 border-t-4 border-black bg-white px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-brand-teal/40 uppercase tracking-widest mb-1">Uploaded By</span>
                            <span className="text-xs font-black uppercase text-brand-teal">{document.uploadedBy?.companyName || 'Industrial Node'}</span>
                         </div>
                         <div className="w-px h-8 bg-black/10" />
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-brand-teal/40 uppercase tracking-widest mb-1">Status</span>
                            <span className="text-xs font-black uppercase text-brand-green flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" /> Verified
                            </span>
                         </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 border-2 border-brand-teal px-4 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-brand-teal hover:text-white transition-all">
                            <History size={14} /> Version History
                        </button>
                        <button className="flex items-center gap-2 border-2 border-brand-teal px-4 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-brand-teal hover:text-white transition-all">
                            <Share2 size={14} /> Share Access
                        </button>
                        <button className="flex items-center gap-2 bg-brand-orange border-2 border-brand-orange text-white px-6 py-2 font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-brand-orange transition-all">
                            <Download size={14} /> Download Securely
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPreview;
