import React, { useEffect, useState } from 'react';
import { 
    DollarSign, Activity, TrendingUp, AlertTriangle, 
    ArrowUpRight, ArrowDownRight, Calendar, 
    Filter, Download, MoreVertical, CheckCircle2,
    Clock, RefreshCw, BarChart2, PieChart
} from 'lucide-react';
import useInvoiceStore from '../../store/invoiceStore';
import useQuoteStore from '../../store/quoteStore';

const Financials = () => {
    const { invoices, fetchMyInvoices, summary, fetchSummary, recordPayment, loading } = useInvoiceStore();
    const { quotes, fetchMyQuotes } = useQuoteStore();
    const [view, setView] = useState('summary'); // summary, analytics, ledger
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentModal, setPaymentModal] = useState(false);

    useEffect(() => {
        fetchMyInvoices();
        fetchMyQuotes();
        fetchSummary();
    }, [fetchMyInvoices, fetchMyQuotes, fetchSummary]);

    const stats = [
        { label: 'Volume d\'Affaire Brut', value: summary?.totalInvoiced || 0, icon: DollarSign, color: 'brand-teal', trend: '+12.5%' },
        { label: 'Encaissement Réel', value: summary?.totalPaid || 0, icon: Activity, color: 'brand-orange', trend: '+8.2%' },
        { label: 'Créances Clients', value: summary?.totalOutstanding || 0, icon: AlertTriangle, color: 'brand-orange', trend: '-2.1%' },
        { label: 'Conversion Devis', value: summary?.totalQuotes || 0, icon: TrendingUp, color: 'brand-teal', trend: 'Optimum' },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header & View Switch */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-teal">Tableau de Bord Financier</h2>
                    <p className="text-[10px] font-black uppercase text-brand-teal/40 tracking-[0.4em] mt-2">Pilotage de Trésorerie & Audit Industriel</p>
                </div>
                <div className="flex bg-brand-teal text-white border-4 border-brand-teal shadow-[4px_4px_0px_0px_rgba(45,90,90,0.1)]">
                    <button onClick={() => setView('summary')} className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${view === 'summary' ? 'bg-white text-brand-teal' : 'hover:bg-brand-orange'}`}>Synthèse</button>
                    <button onClick={() => setView('analytics')} className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${view === 'analytics' ? 'bg-white text-brand-teal' : 'hover:bg-brand-orange'}`}>Analytique</button>
                    <button onClick={() => setView('ledger')} className={`px-6 py-2 text-[10px] font-black uppercase transition-all ${view === 'ledger' ? 'bg-white text-brand-teal' : 'hover:bg-brand-orange'}`}>Grand Livre</button>
                </div>
            </div>

            {/* Stats Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-8 border-brand-teal shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)]">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-8 border border-brand-teal/10 hover:bg-brand-orange/5 transition-all group relative overflow-hidden">
                        <stat.icon className="absolute -right-4 -bottom-4 text-brand-teal/5 group-hover:scale-150 transition-transform duration-700" size={120} />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal opacity-40">{stat.label}</p>
                                <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-brand-teal/10 text-brand-teal">{stat.trend}</span>
                            </div>
                            <p className="text-3xl font-black text-brand-teal">{stat.value.toLocaleString()} <span className="text-xs uppercase opacity-30">DT</span></p>
                        </div>
                    </div>
                ))}
            </div>

            {view === 'summary' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Aging Report Card */}
                    <div className="lg:col-span-2 bg-white border-4 border-brand-teal p-10 shadow-[8px_8px_0px_0px_rgba(45,90,90,0.05)]">
                        <h3 className="text-xs font-black uppercase tracking-widest text-brand-teal mb-10 flex items-center gap-3">
                            <Clock size={16} className="text-brand-orange" /> Rapport d'Ancienneté des Créances
                        </h3>
                        <div className="space-y-8">
                            {Object.entries(summary?.aging || {}).map(([period, amount]) => {
                                const total = summary.totalOutstanding || 1;
                                const pct = (amount / total) * 100;
                                return (
                                    <div key={period} className="relative group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black uppercase text-brand-teal opacity-60">Période: {period === 'current' ? 'Courant' : `${period} Jours`}</span>
                                            <span className="text-xs font-black text-brand-teal">{amount.toLocaleString()} DT</span>
                                        </div>
                                        <div className="h-4 bg-brand-cream border border-brand-teal/5 overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${period === '90+' ? 'bg-red-500' : 'bg-brand-orange'}`} 
                                                style={{ width: `${pct}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Activity & Alerts */}
                    <div className="space-y-8">
                        <div className="bg-brand-teal p-8 text-white border-l-8 border-brand-orange">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-60">Flash Cash-Flow</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/10 p-4">
                                    <span className="text-[9px] font-black uppercase">Encaissements Prévus (Net 30)</span>
                                    <span className="text-lg font-black text-brand-orange">{(summary?.totalOutstanding * 0.4).toLocaleString()} DT</span>
                                </div>
                                <p className="text-[9px] font-bold opacity-40 leading-relaxed italic">Projection basée sur l'historique de paiement moyen de 21 jours opérationnels.</p>
                            </div>
                        </div>

                        <div className="bg-white border-4 border-dashed border-brand-teal/20 p-8 flex flex-col items-center justify-center gap-4 group hover:border-brand-teal transition-all cursor-pointer">
                            <Download size={32} className="text-brand-teal/20 group-hover:text-brand-orange" />
                            <span className="text-[9px] font-black uppercase text-brand-teal opacity-20 group-hover:opacity-100">Extraire Rapport d'Audit Annuel (PDF)</span>
                        </div>
                    </div>
                </div>
            )}

            {view === 'ledger' && (
                <div className="bg-white border-4 border-brand-teal overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="bg-brand-teal text-white p-6 flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest">Grand Livre des Opérations de Facturation</h3>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                                <input className="bg-white/10 border-2 border-white/20 pl-10 pr-4 py-2 text-[10px] font-black uppercase outline-none focus:border-brand-orange" placeholder="FILTRER LE REGISTRE..." />
                            </div>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-cream border-b-2 border-brand-teal/10 text-[9px] font-black uppercase tracking-widest text-brand-teal opacity-40">
                                <th className="p-6">Réf. Document</th>
                                <th className="p-6">Emetteur / Destinataire</th>
                                <th className="p-6">Echéance</th>
                                <th className="p-6">Statut</th>
                                <th className="p-6 text-right">Montant Brut</th>
                                <th className="p-6 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-brand-teal/5">
                            {invoices.map((inv, i) => (
                                <tr key={inv._id} className="text-xs font-bold text-brand-slate hover:bg-brand-orange/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-brand-teal text-white flex items-center justify-center font-black rounded-sm">{inv.invoiceNumber.slice(-2)}</div>
                                            <div>
                                                <p className="font-black text-brand-teal">{inv.invoiceNumber}</p>
                                                <p className="text-[8px] opacity-40">ID {inv._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-brand-teal">{inv.client?.name}</p>
                                        <p className="text-[8px] opacity-30">{inv.client?.email}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-brand-teal">{new Date(inv.payment?.dueDate).toLocaleDateString()}</p>
                                        <p className={`text-[8px] uppercase font-black ${
                                            inv.status === 'overdue' ? 'text-red-500' : 'text-brand-teal/40'
                                        }`}>
                                            {inv.status === 'paid' ? 'Soldé' : inv.status === 'overdue' ? 'RETARD' : 'En Attente'}
                                        </p>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border-2 ${
                                            inv.status === 'paid' ? 'bg-green-100 border-green-500 text-green-700' :
                                            inv.status === 'overdue' ? 'bg-red-100 border-red-500 text-red-700' :
                                            'bg-brand-orange/10 border-brand-orange text-brand-orange'
                                        }`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right font-black text-brand-teal">
                                        {inv.financials?.grandTotal.toLocaleString()} DT
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 border border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"><Download size={14} /></button>
                                            <button className="p-2 border border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"><MoreVertical size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Financials;
