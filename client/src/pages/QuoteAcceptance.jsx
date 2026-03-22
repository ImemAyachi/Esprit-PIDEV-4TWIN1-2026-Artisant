import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    CheckCircle2, ShieldCheck, Signature, 
    FileText, Send, Download, AlertTriangle,
    PenTool, Calendar, Receipt, ChevronDown,
    X, ArrowLeft
} from 'lucide-react';
import useQuoteStore from '../store/quoteStore';
import { toast } from 'react-hot-toast';

const QuoteAcceptance = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { quotes, fetchMyQuotes, acceptQuote, loading } = useQuoteStore();
    const [signatureData, setSignatureData] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [quote, setQuote] = useState(null);
    const [isSigned, setIsSigned] = useState(false);
    
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        // In a real app, this would be a public fetch with a secure token
        const q = quotes.find(x => x._id === id);
        if (q) setQuote(q);
        else fetchMyQuotes().then(res => {
            const found = quotes.find(x => x._id === id);
            if (found) setQuote(found);
        });
    }, [id, quotes, fetchMyQuotes]);

    // Signature Pad Logic
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        setSignatureData(canvasRef.current.toDataURL());
        setIsSigned(true);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData(null);
        setIsSigned(false);
    };

    const handleAcceptance = async () => {
        if (!termsAccepted || !isSigned) {
            toast.error('Veuillez signer et accepter les conditions générales.');
            return;
        }

        const res = await acceptQuote(id, signatureData);
        if (res.success) {
            toast.success('Le contrat est désormais scellé ! Facture générée.');
            navigate('/dashboard/orders'); // Navigate to orders or order success page
        } else {
            toast.error('Échec de la validation transactionnelle.');
        }
    };

    if (!quote) return <div className="h-screen flex items-center justify-center font-black animate-pulse">ACCÈS AU REGISTRE...</div>;

    return (
        <div className="min-h-screen bg-brand-cream p-4 md:p-12 font-bold animate-in fade-in">
            <div className="max-w-5xl mx-auto space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white border-8 border-brand-teal p-12 shadow-[16px_16px_0px_0px_rgba(45,90,90,0.1)]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-brand-teal flex items-center justify-center text-white">
                            <PenTool size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-2">Validation de Protocol</h1>
                            <p className="text-[10px] font-black uppercase text-brand-teal/40 tracking-[0.4em]">Signature Électronique Certifiée Artisant</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase opacity-40">Référence Dossier</p>
                        <p className="text-xl font-black text-brand-orange">{quote.quoteNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Quote View */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white border-4 border-brand-teal p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between items-start mb-12 border-b-2 border-brand-teal pb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase text-brand-teal mb-4">{quote.title}</h2>
                                    <div className="space-y-1 text-xs text-brand-slate opacity-60">
                                        <p>{quote.client?.name}</p>
                                        <p>{quote.client?.address}</p>
                                        <p>{quote.client?.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Receipt size={48} className="text-brand-teal/10 ml-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase opacity-30">Date d'Emission</p>
                                    <p className="text-sm font-black text-brand-teal">{new Date(quote.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <table className="w-full text-left mb-12">
                                <thead>
                                    <tr className="border-b-4 border-brand-teal text-[9px] font-black uppercase tracking-widest text-brand-teal opacity-40">
                                        <th className="py-4">Désignation Poste</th>
                                        <th className="py-4 text-center w-16">Qté</th>
                                        <th className="py-4 text-right w-32">P.U HT</th>
                                        <th className="py-4 text-right w-32">Total HT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-brand-teal/5">
                                    {quote.items.map((item, i) => (
                                        <tr key={i} className="text-xs font-bold text-brand-slate">
                                            <td className="py-4">{item.description}</td>
                                            <td className="py-4 text-center">{item.quantity}</td>
                                            <td className="py-4 text-right">{item.unitPrice.toLocaleString()} DT</td>
                                            <td className="py-4 text-right font-black">{item.total?.toLocaleString()} DT</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end pt-8 border-t-4 border-brand-teal/10">
                                <div className="w-full max-w-xs space-y-4">
                                    <div className="flex justify-between items-center text-xs font-bold opacity-40 uppercase">
                                        <span>Total Hors Taxes</span>
                                        <span>{quote.financials?.subtotal.toLocaleString()} DT</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold opacity-40 uppercase">
                                        <span>TVA (19%)</span>
                                        <span>{(quote.financials?.subtotal * 0.19).toLocaleString()} DT</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-black text-brand-teal uppercase pt-4 border-t-2 border-brand-teal">
                                        <span>Montant Net</span>
                                        <span className="text-brand-orange">{quote.financials?.grandTotal.toLocaleString()} DT</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-brand-cream/50 border-4 border-dashed border-brand-teal/20 p-8">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-teal mb-6">Cadre Légal & Conditions</h4>
                            <div className="text-[10px] font-bold text-brand-teal/40 leading-relaxed whitespace-pre-wrap">
                                {quote.termsAndConditions}
                            </div>
                        </section>
                    </div>

                    {/* Acceptance Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-white border-8 border-brand-orange p-8 shadow-[12px_12px_0px_0px_rgba(242,127,12,0.1)]">
                            <h3 className="text-xl font-black uppercase text-brand-orange tracking-tighter mb-8 flex items-center gap-2">
                                <ShieldCheck size={24} /> Scellage Final
                            </h3>
                            
                            <div className="space-y-12">
                                <div>
                                    <p className="text-[9px] font-black uppercase opacity-40 mb-4 tracking-widest">Zone de Signature Manuelle</p>
                                    <div className="relative bg-brand-cream border-4 border-brand-teal/10 hover:border-brand-teal transition-all">
                                        <canvas 
                                            ref={canvasRef}
                                            width={320}
                                            height={180}
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseOut={stopDrawing}
                                            className="w-full cursor-crosshair"
                                        />
                                        {!isSigned && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-brand-teal/10">
                                                <Signature size={64} />
                                            </div>
                                        )}
                                        <button 
                                            onClick={clearSignature}
                                            className="absolute bottom-2 right-2 p-1 text-red-500 hover:bg-red-50 transition-all rounded"
                                            title="Effacer"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            className="w-6 h-6 border-4 border-brand-teal text-brand-orange focus:ring-brand-orange accent-brand-orange shrink-0 mt-1"
                                            checked={termsAccepted}
                                            onChange={e => setTermsAccepted(e.target.checked)}
                                        />
                                        <span className="text-[10px] font-bold text-brand-teal leading-relaxed group-hover:text-brand-orange transition-colors">
                                            Je certifie avoir pris connaissance des clauses susnommées et accepte l'engagement contractuel associé à ce protocol financier.
                                        </span>
                                    </label>

                                    <button 
                                        disabled={loading}
                                        onClick={handleAcceptance}
                                        className="w-full py-6 bg-brand-orange text-white text-sm font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(45,90,90,0.2)] hover:bg-brand-teal transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        <CheckCircle2 size={24} />
                                        {loading ? 'SCELLAGE EN COURS...' : 'SCELLER LE CONTRAT'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button className="flex items-center justify-center gap-2 p-4 bg-brand-teal text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all">
                                <Download size={16} /> Télécharger la Minute (PDF)
                            </button>
                            <button className="flex items-center justify-center gap-2 p-4 border-4 border-brand-teal text-brand-teal text-[10px] font-black uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all">
                                <ArrowLeft size={16} /> Retour au Portefeuille
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuoteAcceptance;
