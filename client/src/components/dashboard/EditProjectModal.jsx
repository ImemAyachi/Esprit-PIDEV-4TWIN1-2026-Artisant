import React, { useState, useEffect } from 'react';
import {
    X, Save, Briefcase, MapPin, Calendar,
    AlignLeft, DollarSign, AlertCircle, CheckCircle2,
    Loader2, ChevronRight
} from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'Planned', label: 'Planifié', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'In Progress', label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'Completed', label: 'Terminé', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'Archived', label: 'Archivé', color: 'bg-gray-100 text-gray-500 border-gray-300' },
];

const InputField = ({ id, label, icon: Icon, error, ...props }) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal">
            {Icon && <Icon size={11} className="text-brand-teal/50" />}
            {label}
        </label>
        <input
            id={id}
            className={`
                block w-full px-4 py-3 bg-brand-cream border-2 text-sm font-bold text-brand-slate
                outline-none transition-all placeholder:text-brand-teal/20 rounded-none
                focus:bg-white focus:border-brand-teal
                ${error ? 'border-red-400' : 'border-brand-teal/30'}
            `}
            {...props}
        />
        {error && (
            <p className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
                <AlertCircle size={10} /> {error}
            </p>
        )}
    </div>
);

const EditProjectModal = ({ project, onClose, onSave }) => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        address: '',
        city: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'Planned',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    /* populate form when project prop changes */
    useEffect(() => {
        if (project) {
            setForm({
                title: project.name || project.title || '',
                description: project.description || '',
                address: project.location?.address || project.address || '',
                city: project.location?.city || project.city || '',
                startDate: project.startDate
                    ? new Date(project.startDate).toISOString().slice(0, 10)
                    : project.date || '',
                endDate: project.endDate
                    ? new Date(project.endDate).toISOString().slice(0, 10)
                    : '',
                budget: project.budget || '',
                status: project.status || 'Planned',
            });
            setErrors({});
            setSaved(false);
        }
    }, [project]);

    /* close on Escape */
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Le titre est obligatoire';
        if (form.budget && isNaN(Number(form.budget))) errs.budget = 'Budget invalide';
        if (form.startDate && form.endDate && form.endDate < form.startDate)
            errs.endDate = 'La date de fin doit être après la date de début';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        /* simulate API call – replace with real API call */
        await new Promise(r => setTimeout(r, 900));
        setLoading(false);
        setSaved(true);
        onSave?.({ ...project, ...form });
        setTimeout(() => onClose(), 1200);
    };

    if (!project) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-brand-slate/60 z-40 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Slide-in panel */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-xl bg-brand-cream border-l-8 border-brand-teal z-50 flex flex-col shadow-2xl overflow-hidden"
                style={{ animation: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>

                {/* ── Header ── */}
                <div className="bg-brand-teal text-white px-8 py-6 flex items-start justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase size={16} className="text-brand-orange" />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">
                                Modifier le projet
                            </span>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                            {project.name || project.title}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-2 text-white/40">
                            <ChevronRight size={10} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                ID #{project.id}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 border-2 border-white/20 text-white/60 hover:bg-white hover:text-brand-teal transition-all mt-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Progress indicator */}
                <div className="h-1 bg-brand-teal/10 shrink-0">
                    <div
                        className="h-full bg-brand-orange transition-all duration-500"
                        style={{ width: saved ? '100%' : loading ? '70%' : '0%' }}
                    />
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-8">

                    {/* Status selector */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal">
                            Statut du projet
                        </label>
                        <div className="grid grid-cols-4 gap-0 border-2 border-brand-teal/30">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                                    className={`
                                        py-3 px-2 text-center transition-all border-r last:border-r-0 border-brand-teal/10
                                        ${form.status === opt.value
                                            ? 'bg-brand-teal text-white'
                                            : 'bg-white text-brand-teal/50 hover:bg-brand-cream'
                                        }
                                    `}
                                >
                                    <p className="text-[8px] font-black uppercase tracking-widest">{opt.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-brand-teal/10" />
                        </div>
                        <div className="relative flex justify-start">
                            <span className="bg-brand-cream pr-3 text-[8px] font-black uppercase tracking-[0.3em] text-brand-teal/30">
                                Informations générales
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <InputField
                        id="title"
                        name="title"
                        label="Titre du projet"
                        icon={Briefcase}
                        placeholder="Ex: Rénovation Bâtiment A"
                        value={form.title}
                        onChange={handleChange}
                        error={errors.title}
                    />

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label htmlFor="description" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal">
                            <AlignLeft size={11} className="text-brand-teal/50" />
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Décrivez les travaux, objectifs et contraintes..."
                            className="block w-full px-4 py-3 bg-brand-cream border-2 border-brand-teal/30 text-sm font-bold text-brand-slate outline-none transition-all placeholder:text-brand-teal/20 rounded-none focus:bg-white focus:border-brand-teal resize-none"
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-brand-teal/10" />
                        </div>
                        <div className="relative flex justify-start">
                            <span className="bg-brand-cream pr-3 text-[8px] font-black uppercase tracking-[0.3em] text-brand-teal/30">
                                Localisation & Calendrier
                            </span>
                        </div>
                    </div>

                    {/* Address + City */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            id="address"
                            name="address"
                            label="Adresse"
                            icon={MapPin}
                            placeholder="Rue, N°..."
                            value={form.address}
                            onChange={handleChange}
                        />
                        <InputField
                            id="city"
                            name="city"
                            label="Ville"
                            icon={MapPin}
                            placeholder="Ex: Tunis"
                            value={form.city}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            id="startDate"
                            name="startDate"
                            label="Date de début"
                            icon={Calendar}
                            type="date"
                            value={form.startDate}
                            onChange={handleChange}
                        />
                        <InputField
                            id="endDate"
                            name="endDate"
                            label="Date de fin"
                            icon={Calendar}
                            type="date"
                            value={form.endDate}
                            onChange={handleChange}
                            error={errors.endDate}
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-brand-teal/10" />
                        </div>
                        <div className="relative flex justify-start">
                            <span className="bg-brand-cream pr-3 text-[8px] font-black uppercase tracking-[0.3em] text-brand-teal/30">
                                Budget
                            </span>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-1.5">
                        <label htmlFor="budget" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal">
                            <DollarSign size={11} className="text-brand-teal/50" />
                            Budget estimé (DT)
                        </label>
                        <div className="relative">
                            <input
                                id="budget"
                                name="budget"
                                type="number"
                                min="0"
                                step="100"
                                placeholder="Ex: 25000"
                                value={form.budget}
                                onChange={handleChange}
                                className={`
                                    block w-full pl-12 pr-4 py-3 bg-brand-cream border-2 text-sm font-bold
                                    text-brand-slate outline-none transition-all rounded-none
                                    placeholder:text-brand-teal/20 focus:bg-white focus:border-brand-teal
                                    ${errors.budget ? 'border-red-400' : 'border-brand-teal/30'}
                                `}
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-brand-teal/30">
                                DT
                            </span>
                        </div>
                        {errors.budget && (
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
                                <AlertCircle size={10} /> {errors.budget}
                            </p>
                        )}
                    </div>
                </form>

                {/* ── Footer actions ── */}
                <div className="px-8 py-6 border-t-4 border-brand-teal/10 bg-white shrink-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest border-2 border-brand-teal/30 text-brand-teal/60 hover:border-brand-teal hover:text-brand-teal transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || saved}
                        className="flex-2 flex-[2] py-3.5 text-[10px] font-black uppercase tracking-widest bg-brand-teal text-white border-2 border-brand-teal hover:bg-brand-orange hover:border-brand-orange transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? (
                            <><Loader2 size={14} className="animate-spin" /> Enregistrement...</>
                        ) : saved ? (
                            <><CheckCircle2 size={14} className="text-brand-orange" /> Sauvegardé !</>
                        ) : (
                            <><Save size={14} /> Sauvegarder les modifications</>
                        )}
                    </button>
                </div>
            </aside>

            {/* Keyframe for slide-in */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default EditProjectModal;
