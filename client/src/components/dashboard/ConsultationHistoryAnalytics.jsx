import React, { useEffect, useState } from 'react';
import { 
    BarChart2, Clock, Calendar, Filter, FileText, 
    Download, ArrowUpRight, ArrowDownRight, Printer 
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

const ConsultationHistoryAnalytics = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalConsultations: 0,
        avgTimeSpent: 0,
        topCategory: '—',
        activeGrowth: '+12%'
    });

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/documents/history');
            if (res.data?.success) {
                setHistory(res.data.data);
                // Calculate basic stats
                const total = res.data.data.length;
                const avg = res.data.data.reduce((acc, h) => acc + (h.timeSpent || 0), 0) / (total || 1);
                setStats({
                    totalConsultations: total,
                    avgTimeSpent: Math.round(avg),
                    topCategory: 'Technical Sheets',
                    activeGrowth: '+18.4%'
                });
            }
        } catch (err) {
            toast.error('Ledger analysis failure');
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ type }) => {
        const colors = {
            view: 'bg-blue-100 text-blue-700',
            download: 'bg-green-100 text-green-700',
            print: 'bg-orange-100 text-orange-700',
            favorite: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-sm ${colors[type] || 'bg-gray-100 text-gray-600'}`}>
                {type}
            </span>
        );
    };

    return (
        <div className="space-y-10 font-outfit">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                {[
                    { label: 'Total Nodes Accessed', value: stats.totalConsultations, trend: stats.activeGrowth, icon: FileText },
                    { label: 'Avg Engagement Time', value: `${stats.avgTimeSpent}s`, trend: '+5s', icon: Clock },
                    { label: 'Top Protocol Domain', value: stats.topCategory, trend: 'Stable', icon: BarChart2 },
                    { label: 'System Uptime', value: '99.9%', trend: 'Operational', icon: ArrowUpRight, highlight: true },
                ].map((kpi, i) => (
                    <div key={i} className={`p-8 border-r-2 border-black last:border-r-0 flex flex-col justify-between ${kpi.highlight ? 'bg-brand-orange text-white' : 'bg-white text-brand-teal'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 leading-none">{kpi.label}</p>
                            <kpi.icon size={18} className="opacity-20" />
                        </div>
                        <div className="flex items-end justify-between mt-auto">
                            <h4 className="text-3xl font-black italic tracking-tighter">{kpi.value}</h4>
                            <span className={`text-[8px] font-black ${kpi.highlight ? 'text-white' : 'text-brand-orange'}`}>{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Insights Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border-4 border-black p-8 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-black uppercase tracking-tighter text-brand-teal underline decoration-brand-orange decoration-4">Operational Engagement Curve</h4>
                        <div className="flex gap-2">
                             <button className="p-2 border-2 border-brand-teal/10 hover:border-brand-teal transition-all"><Calendar size={16} /></button>
                             <button className="p-2 border-2 border-brand-teal/10 hover:border-brand-teal transition-all focus:bg-brand-teal focus:text-white"><Filter size={16} /></button>
                        </div>
                    </div>
                    
                    {/* Mock Chart using simple DIVs */}
                    <div className="h-64 flex items-end gap-2 px-4 border-b-2 border-black/5">
                        {[40, 70, 45, 90, 65, 80, 55, 95, 30, 85, 60, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-brand-teal/10 hover:bg-brand-orange transition-all relative group/bar" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 text-[8px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                    NODE {i+1}: {h}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-[8px] font-black text-brand-teal/20 tracking-widest">
                        <span>NODE ANALYSIS START [03/01]</span>
                        <span>NODE ANALYSIS END [03/22]</span>
                    </div>
                </div>

                <div className="bg-brand-cream border-4 border-black p-8 flex flex-col shadow-[-8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h4 className="text-lg font-black uppercase tracking-tighter text-brand-teal mb-8">Category Density</h4>
                    <div className="space-y-6 flex-1">
                        {[
                            { label: 'Technical Sheets', value: 65, color: 'bg-brand-teal' },
                            { label: 'Legal Compliance', value: 20, color: 'bg-brand-orange' },
                            { label: 'Manuals & Guides', value: 15, color: 'bg-black' },
                        ].map((cat, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal underline decoration-brand-orange/20 decoration-2">{cat.label}</span>
                                    <span className="text-[10px] font-black text-brand-teal">{cat.value}%</span>
                                </div>
                                <div className="w-full h-4 bg-white border-2 border-black overflow-hidden">
                                     <div className={`h-full ${cat.color} group-hover:translate-x-1 transition-transform`} style={{ width: `${cat.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-8 w-full py-3 bg-white border-2 border-black font-black uppercase tracking-widest text-[9px] hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2">
                        <Download size={14} /> Full Distribution Report
                    </button>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white border-4 border-black overflow-hidden shadow-[12px_12px_0px_0px_rgba(45,90,91,0.1)]">
                <div className="bg-brand-teal text-white p-6 flex justify-between items-center border-b-4 border-black">
                     <h4 className="font-black uppercase tracking-widest text-xs flex items-center gap-3 italic">
                        <History size={16} className="text-brand-orange" />
                        Engagement History Registry
                     </h4>
                     <div className="flex gap-4">
                        <button className="flex items-center gap-2 border-2 border-white/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-teal transition-all">
                            <FileText size={14} /> EXPORT PDF
                        </button>
                        <button className="flex items-center gap-2 border-2 border-white/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-teal transition-all">
                            <Download size={14} /> EXPORT CSV
                        </button>
                     </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-brand-cream border-b-2 border-black">
                                {['Reference Node', 'Identity/Type', 'Timestamp', 'Duration', 'Clearance', 'Actions'].map(h => (
                                    <th key={h} className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-brand-teal/40">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((entry, i) => (
                                <tr key={i} className="border-b border-black/5 hover:bg-brand-cream transition-colors group">
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase text-brand-teal group-hover:text-brand-orange transition-colors">{entry.item?.title || 'Unknown Entity'}</span>
                                            <span className="text-[8px] font-bold text-brand-teal/30 tracking-widest uppercase mt-1">UUID: {String(entry._id).slice(-12)}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 bg-brand-orange rounded-full" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/60">{entry.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[10px] font-bold text-brand-teal/40 uppercase tabular-nums">
                                        {new Date(entry.lastViewed).toLocaleString()}
                                    </td>
                                    <td className="p-6">
                                        <span className="px-3 py-1 bg-brand-teal text-white text-[9px] font-black tracking-widest italic">{entry.timeSpent || 0} SEC</span>
                                    </td>
                                    <td className="p-6">
                                        <StatusBadge type={entry.interactions?.[0]?.type || 'view'} />
                                    </td>
                                    <td className="p-6">
                                        <button className="p-2 border-2 border-brand-teal/10 hover:bg-white hover:border-brand-teal transition-all rounded-sm"><ArrowUpRight size={14} /></button>
                                    </td>
                                </tr>
                            ))}

                            {history.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center italic text-[10px] font-black uppercase tracking-[0.4em] text-brand-teal/20">
                                        NO LOG DATA DETECTED IN PRIMARY LEDGER
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsultationHistoryAnalytics;
