import React from 'react';
import { X, Check, ShoppingBag, Heart, BarChart2 } from 'lucide-react';

const ProductComparison = ({ products, onClose }) => {
    if (!products || products.length === 0) return null;

    const categories = [
        { name: 'GÉNÉRAL', fields: ['name', 'price', 'category', 'manufacturer'] },
        { name: 'DIMENSIONS', key: 'dimensions' },
        { name: 'MATÉRIAUX', key: 'materials' },
        { name: 'CERTIFICATIONS', key: 'certifications' },
        { name: 'PERFORMANCE', key: 'performance' },
    ];

    const getVal = (p, cat, field) => {
        if (!p.specifications) return '—';
        const spec = p.specifications[cat]?.find(s => s.key === field);
        return spec ? spec.value : '—';
    };

    // Extract all unique keys for each specification category across all compared products
    const getAllFields = (catKey) => {
        const uniqueKeys = new Set();
        products.forEach(p => {
            if (p.specifications && p.specifications[catKey]) {
                p.specifications[catKey].forEach(s => uniqueKeys.add(s.key));
            }
        });
        return Array.from(uniqueKeys);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-brand-teal/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 font-outfit overflow-hidden">
            <div className="bg-white w-full h-full max-w-7xl shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden border-4 border-black border-r-[12px]">
                {/* Header */}
                <div className="h-20 border-b-4 border-black bg-brand-orange px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shrink-0">
                            <BarChart2 size={24} className="text-black" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-black leading-none italic underline">Industrial Comparison Matrix</h3>
                            <p className="text-[10px] font-black tracking-widest text-black/60 mt-1 uppercase">Side-by-side technical evaluation protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-black text-white hover:bg-white hover:text-black transition-all border-2 border-black">
                        <X size={24} />
                    </button>
                </div>

                {/* Table Header (Product Images/Titles) */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-brand-cream">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-20 bg-white">
                            <tr>
                                <th className="w-64 p-8 border-b-4 border-r-4 border-black bg-brand-cream" />
                                {products.map(p => (
                                    <th key={p._id} className="min-w-[280px] p-8 border-b-4 border-r-2 border-black bg-white group hover:bg-brand-cream transition-colors">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-40 h-40 bg-brand-cream border-2 border-black flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                                                {p.images?.[0] ? <img src={p.images[0]} alt="" className="object-contain p-4" /> : <ShoppingBag size={48} className="opacity-10" />}
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <button className="p-1.5 bg-white border-2 border-black hover:bg-brand-orange hover:text-white transition-all"><Heart size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <h4 className="font-black uppercase tracking-tight text-brand-teal text-lg leading-tight mb-2 underline decoration-brand-orange decoration-4">{p.name}</h4>
                                                <p className="text-xl font-black text-brand-orange italic">{p.price?.toLocaleString()} DT</p>
                                            </div>
                                            <button className="w-full py-3 bg-brand-teal text-white border-2 border-black font-black uppercase tracking-widest text-[10px] hover:translate-x-1 hover:-translate-y-1 transition-all hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                Add to Quote Registry
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {categories.map(cat => (
                                <React.Fragment key={cat.name}>
                                    <tr className="bg-black text-white">
                                        <td colSpan={products.length + 1} className="py-2 px-8 font-black uppercase tracking-[0.3em] text-[10px] italic">
                                            {cat.name} / Technical Nodes
                                        </td>
                                    </tr>

                                    {/* Handle general fields */}
                                    {cat.fields && cat.fields.map(f => (
                                        <tr key={f} className="group hover:bg-brand-orange/5 transition-colors">
                                            <td className="p-4 px-8 border-b-2 border-r-4 border-black font-black uppercase text-[10px] tracking-widest text-brand-teal/60 bg-white">
                                                {f === 'manufacturer' ? 'Industrial Node' : f}
                                            </td>
                                            {products.map(p => {
                                                const val = f === 'manufacturer' ? (p.manufacturer?.companyName || '—') : (p[f] || '—');
                                                return (
                                                    <td key={p._id} className="p-4 px-8 border-b-2 border-r-2 border-black bg-white text-xs font-bold text-brand-teal uppercase text-center group-hover:bg-transparent transition-colors">
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                    {/* Handle spec categories */}
                                    {cat.key && getAllFields(cat.key).map(field => (
                                        <tr key={field} className="group hover:bg-brand-orange/5 transition-colors">
                                           <td className="p-4 px-8 border-b-2 border-r-4 border-black font-black uppercase text-[10px] tracking-widest text-brand-teal/60 bg-white">
                                                {field}
                                            </td>
                                            {products.map(p => {
                                                const val = getVal(p, cat.key, field);
                                                return (
                                                    <td key={p._id} className="p-4 px-8 border-b-2 border-r-2 border-black bg-white text-xs font-bold text-brand-teal uppercase text-center group-hover:bg-transparent transition-colors">
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend / Footer */}
                <div className="h-14 border-t-4 border-black bg-brand-cream px-8 flex items-center justify-center shrink-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal/40 italic">
                        PROTOCOL COMPARISON ENDED // ALL ASSETS ANALYZED // VERIFIED BY INDUSTRIAL LEDGER
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductComparison;
