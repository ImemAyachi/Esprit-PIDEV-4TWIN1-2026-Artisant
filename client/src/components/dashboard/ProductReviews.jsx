import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

const StarRating = ({ rating, setRating, interactive = false }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
            <button 
                key={s} 
                onClick={() => interactive && setRating(s)}
                className={`${s <= rating ? 'text-brand-orange' : 'text-brand-teal/10'} hover:scale-110 transition-transform`}
            >
                <Star size={18} fill={s <= rating ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
        ))}
    </div>
);

const ProductReviews = ({ product, onRefresh }) => {
    const [newRating, setNewRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newRating === 0) return setError('Operational rating required');
        
        setSubmitting(true);
        try {
            await api.post(`/products/${product._id}/reviews`, { rating: newRating, comment });
            setNewRating(0);
            setComment('');
            onRefresh && onRefresh();
        } catch (err) {
            setError(err.response?.data?.message || 'Feedback registry failure');
        }
        setSubmitting(false);
    };

    const handleVote = async (reviewId, type) => {
        try {
            await api.post(`/products/${product._id}/reviews/${reviewId}/vote`, { type });
            onRefresh && onRefresh();
        } catch (err) {
            console.error('Vote failed', err);
        }
    };

    const sortedReviews = [...(product.reviews || [])].sort((a, b) => 
        (b.helpfulnessVotes?.up?.length || 0) - (a.helpfulnessVotes?.up?.length || 0)
    );

    return (
        <div className="space-y-12 font-outfit">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-brand-teal text-white p-8 border-4 border-black border-r-[12px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-12 translate-x-10 group-hover:translate-x-0 transition-transform duration-1000" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">Industrial Rating Node</p>
                   <div className="flex items-end gap-3">
                        <h4 className="text-6xl font-black italic">{product.averageRating?.toFixed(1) || '0.0'}</h4>
                        <div className="mb-2 italic font-black uppercase tracking-widest text-[10px]">VERIFIED AVG</div>
                   </div>
                   <div className="mt-4"><StarRating rating={Math.round(product.averageRating || 0)} /></div>
                   <p className="mt-6 text-xs font-bold text-white/40 uppercase tracking-widest">{product.reviews?.length || 0} FEEDBACK NODES DETECTED</p>
                </div>

                <div className="md:col-span-2 bg-white/50 border-4 border-brand-teal p-8 flex flex-col justify-center">
                    <p className="font-black uppercase tracking-tight text-brand-teal text-xl italic underline decoration-brand-orange decoration-4 mb-6">Contribute Intelligence</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center gap-6 p-4 bg-white border-2 border-brand-teal/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">CALIBRATE:</span>
                            <StarRating rating={newRating} setRating={setNewRating} interactive />
                        </div>
                        <div className="relative">
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="ENTER TECHNICAL OBSERVATIONS..."
                                className="w-full h-24 bg-white border-2 border-brand-teal/20 p-4 font-black uppercase text-[10px] tracking-widest placeholder:text-brand-teal/10 outline-none focus:border-brand-orange transition-all no-scrollbar"
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button type="button" className="p-2 bg-brand-cream border-2 border-brand-teal/10 text-brand-teal/40 hover:text-brand-orange transition-all"><Camera size={14} /></button>
                            </div>
                        </div>
                        {error && <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 p-3"><AlertCircle size={14} /> {error}</div>}
                        <button 
                            disabled={submitting}
                            className="w-full py-4 bg-brand-orange border-4 border-black text-white font-black uppercase tracking-[0.3em] text-[10px] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3"
                        >
                            {submitting ? 'PROCESSING PROTOCOL...' : 'EXECUTE FEEDBACK SUBMISSION'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
                <h5 className="font-black uppercase tracking-widest text-brand-teal text-sm flex items-center gap-4">
                    DETECTION LOGS: 
                    <div className="h-0.5 bg-brand-teal/10 flex-1" />
                    <span className="text-brand-orange">{sortedReviews.length} ENTRIES</span>
                </h5>

                {sortedReviews.length === 0 && (
                    <div className="p-20 border-4 border-dashed border-brand-teal/20 text-center">
                        <p className="font-black uppercase tracking-[0.2em] text-brand-teal/20 text-xs italic">NO INDUSTRIAL FEEDBACK DETECTED FOR THIS ASSET</p>
                    </div>
                )}

                {sortedReviews.map((rev) => (
                    <div key={rev._id} className="bg-white border-4 border-brand-teal p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)] transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-cream border-4 border-brand-teal flex items-center justify-center font-black text-xs text-brand-teal">
                                    {(rev.user?.companyName || 'U').charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-black uppercase tracking-tight text-brand-teal">{rev.user?.companyName || 'ANONYMOUS NODE'}</p>
                                        <span className="flex items-center gap-1.5 text-[8px] font-black text-brand-green uppercase tracking-widest bg-brand-green/5 px-2 py-0.5 border border-brand-green/10">
                                            <CheckCircle2 size={10} /> VERIFIED IDENTITY
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-brand-teal/30 mt-1 uppercase tracking-widest">
                                        SUBMITTED: {new Date(rev.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <StarRating rating={rev.rating} />
                        </div>

                        <div className="relative">
                            <div className="absolute -left-4 top-0 w-1 h-full bg-brand-orange/20" />
                            <p className="text-sm font-bold text-brand-slate/80 leading-relaxed uppercase tracking-wide">
                                {rev.comment}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-brand-teal/10 flex justify-between items-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40 italic">PROTOCOL STABILITY: COMPLIANT</p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handleVote(rev._id, 'up')}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-teal/60 hover:text-brand-orange transition-colors"
                                >
                                    <ThumbsUp size={14} /> {rev.helpfulnessVotes?.up?.length || 0}
                                </button>
                                <button 
                                    onClick={() => handleVote(rev._id, 'down')}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-teal/60 hover:text-red-500 transition-colors"
                                >
                                    <ThumbsDown size={14} /> {rev.helpfulnessVotes?.down?.length || 0}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductReviews;
