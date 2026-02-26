import React, { useState } from 'react';
import { Hammer, Calendar, MapPin, AlignLeft, Send, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';

const ProjectCreation = ({ onProjectCreated }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        startDate: '',
        endDate: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await api.post('/projects', formData);
            if (response.data.success) {
                setSuccess(true);
                setFormData({
                    title: '',
                    description: '',
                    address: '',
                    startDate: '',
                    endDate: ''
                });
                setTimeout(() => {
                    if (onProjectCreated) onProjectCreated(response.data.data);
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while creating the project.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border-4 border-brand-teal p-8 max-w-2xl mx-auto shadow-[8px_8px_0px_0px_rgba(45,90,90,1)]">
            <div className="mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-brand-teal flex items-center gap-3">
                    <Hammer className="w-8 h-8 text-brand-orange" />
                    New Industrial Project
                </h3>
                <p className="text-sm font-bold text-brand-slate/60 mt-1 uppercase tracking-widest">Initialization of operational parameters</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-brand-orange text-white p-4 font-bold text-xs uppercase tracking-widest border-2 border-brand-teal">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-brand-green text-white p-4 font-bold text-xs uppercase tracking-widest border-2 border-brand-teal flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 size={24} />
                        Project deployed successfully! Syncing ledger...
                    </div>
                )}

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="label">Project Title</label>
                        <div className="relative group">
                            <input
                                type="text"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="ex: Site Alpha Renovation"
                                className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white placeholder:text-brand-teal/30 pl-12"
                            />
                            <Hammer size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal group-focus-within:text-white transition-colors" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="label">Technical Description</label>
                        <div className="relative group">
                            <textarea
                                name="description"
                                rows="3"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Project details..."
                                className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white placeholder:text-brand-teal/30 pl-12 pt-3"
                            ></textarea>
                            <AlignLeft size={18} className="absolute left-4 top-4 text-brand-teal group-focus-within:text-white transition-colors" />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="label">Location / Address</label>
                        <div className="relative group">
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Full address"
                                className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white placeholder:text-brand-teal/30 pl-12"
                            />
                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal group-focus-within:text-white transition-colors" />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Start Date</label>
                            <div className="relative group">
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white pl-12"
                                />
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal group-focus-within:text-white transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="label">End Date</label>
                            <div className="relative group">
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white pl-12"
                                />
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal group-focus-within:text-white transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="btn-primary w-full py-5 text-base uppercase tracking-[0.2em] border-4 border-brand-teal flex justify-center items-center gap-4 group"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : success ? (
                            <CheckCircle2 className="w-6 h-6" />
                        ) : (
                            <>
                                Deploy Project
                                <Send size={24} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectCreation;
