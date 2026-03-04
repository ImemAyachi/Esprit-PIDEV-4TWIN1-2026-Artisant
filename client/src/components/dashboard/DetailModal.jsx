import React from 'react';
import { X, Calendar, User, Mail, DollarSign, FileText, Briefcase, Receipt, Tag, Download } from 'lucide-react';

const DetailModal = ({ item, type, onClose, onDownloadPDF }) => {
    if (!item) return null;

    const renderProjectDetails = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b-2 border-brand-teal/10 pb-4">
                <div className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center">
                    <Briefcase size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal leading-none">{item.title}</h3>
                    <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Détails du projet industriel</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Client</p>
                            <p className="text-xs font-bold text-brand-teal">{item.client || 'Non spécifié'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Statut</p>
                            <p className="text-xs font-bold text-brand-teal uppercase">{item.status}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Date de début</p>
                            <p className="text-xs font-bold text-brand-teal">{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Non définie'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Description</p>
                            <p className="text-xs font-bold text-brand-teal">{item.description || 'Aucune description fournie.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderQuoteInvoiceItems = () => (
        <div className="mt-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-teal mb-4 border-b-2 border-brand-teal/10 pb-2">Lignes de facturation</h4>
            <div className="border-2 border-brand-teal">
                <div className="grid grid-cols-4 bg-brand-teal text-white p-3">
                    <p className="text-[8px] font-black uppercase tracking-widest">Désignation</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-center">Qté</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-center">P.U</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-right">Total</p>
                </div>
                {item.items?.map((line, idx) => (
                    <div key={idx} className={`grid grid-cols-4 p-3 border-b border-brand-teal/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-brand-cream/40'}`}>
                        <p className="text-xs font-bold text-brand-teal">{line.description}</p>
                        <p className="text-xs font-bold text-brand-teal text-center">{line.quantity}</p>
                        <p className="text-xs font-bold text-brand-teal text-center">{line.unitPrice.toLocaleString()} DT</p>
                        <p className="text-xs font-black text-brand-teal text-right">{(line.quantity * line.unitPrice).toLocaleString()} DT</p>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex flex-col items-end gap-2">
                {type === 'quote' && (
                    <div className="flex justify-between w-48 text-[10px] font-bold text-brand-teal/60">
                        <span>SOUS-TOTAL</span>
                        <span>{item.subtotal?.toLocaleString()} DT</span>
                    </div>
                )}
                <div className="flex justify-between w-48 text-[10px] font-bold text-brand-teal/60">
                    <span>{type === 'quote' ? 'TAXES' : 'TAXES INCLUSES'}</span>
                    <span>{item.tax?.toLocaleString()} DT</span>
                </div>
                <div className="bg-brand-teal text-white px-6 py-3 flex justify-between w-64 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-sm font-black uppercase tracking-widest">Total</span>
                    <span className="text-lg font-black">{item.totalAmount?.toLocaleString()} DT</span>
                </div>
            </div>
        </div>
    );

    const renderQuoteDetails = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b-2 border-brand-teal/10 pb-4">
                <div className="w-12 h-12 bg-brand-orange text-white flex items-center justify-center">
                    <FileText size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal leading-none">{item.quoteNumber}</h3>
                        <span className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal text-[8px] font-black uppercase tracking-widest">Devis</span>
                    </div>
                    <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Projet: {item.project?.title || 'Non lié'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Client</p>
                            <p className="text-xs font-bold text-brand-teal">{item.clientName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Email</p>
                            <p className="text-xs font-bold text-brand-teal">{item.clientEmail || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Valide jusqu'au</p>
                            <p className="text-xs font-bold text-brand-teal">{item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Statut Devis</p>
                            <p className="text-xs font-bold text-brand-teal uppercase">{item.status}</p>
                        </div>
                    </div>
                </div>
            </div>

            {renderQuoteInvoiceItems()}
        </div>
    );

    const renderInvoiceDetails = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b-2 border-brand-teal/10 pb-4">
                <div className="w-12 h-12 bg-brand-green text-white flex items-center justify-center">
                    <Receipt size={24} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal leading-none">{item.invoiceNumber}</h3>
                        <span className="px-2 py-0.5 bg-brand-green/10 text-brand-green text-[8px] font-black uppercase tracking-widest">Facture</span>
                    </div>
                    <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Émanant du Devis: {item.quote?.quoteNumber || 'Direct'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Client</p>
                            <p className="text-xs font-bold text-brand-teal">{item.clientName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Statut Paiement</p>
                            <p className="text-xs font-bold text-brand-teal uppercase">{item.status}</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Date d'échéance</p>
                            <p className="text-xs font-bold text-brand-teal">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-brand-orange" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Déjà réglé</p>
                            <p className="text-xs font-bold text-brand-green">{item.paidAmount?.toLocaleString() || 0} DT</p>
                        </div>
                    </div>
                </div>
            </div>

            {renderQuoteInvoiceItems()}

            <div className="pt-8 flex justify-center">
                <button
                    onClick={() => onDownloadPDF(item)}
                    className="btn-primary flex items-center gap-3 px-12"
                >
                    <Download size={18} /> Télécharger la facture (PDF)
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 bg-brand-slate/60 z-[90] backdrop-blur-[4px]" onClick={onClose} />
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-brand-cream border-8 border-brand-teal w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] pointer-events-auto relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-brand-teal text-white hover:bg-brand-orange transition-all z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-10">
                        {type === 'project' && renderProjectDetails()}
                        {type === 'quote' && renderQuoteDetails()}
                        {type === 'invoice' && renderInvoiceDetails()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default DetailModal;
