import React, { useState, useEffect } from 'react';
import {
    X, Save, Briefcase, MapPin, Calendar,
    AlignLeft, AlertCircle, CheckCircle2,
    Loader2, ChevronRight, Plus, Send
} from 'lucide-react';
import useProjectStore from '../../store/projectStore';

const STATUS_OPTIONS = [
    { value: 'planned', label: 'Planifié', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'in_progress', label: 'En cours', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'completed', label: 'Terminé', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'archived', label: 'Archivé', color: 'bg-gray-100 text-gray-500 border-gray-300' },
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

const ProjectModal = ({ project, onClose, onSave }) => {
    const isEdit = !!(project && (project._id || project.id));
    const { createProject, updateProject } = useProjectStore();

    const [form, setForm] = useState({
        title: '',
        description: '',
        address: '',
        startDate: '',
        endDate: '',
        status: 'planned',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    /* populate form when project prop changes */
    useEffect(() => {
        if (project) {
            const addr = project.address || (project.location ? [project.location.address, project.location.city].filter(Boolean).join(', ') : '');
            setForm({
                title: project.title || project.name || '',
                description: project.description || '',
                address: addr,
                startDate: project.startDate
                    ? new Date(project.startDate).toISOString().slice(0, 10)
                    : '',
                endDate: project.endDate
                    ? new Date(project.endDate).toISOString().slice(0, 10)
                    : '',
                status: project.status || 'planned',
            });
        } else {
            setForm({
                title: '',
                description: '',
                address: '',
                startDate: '',
                endDate: '',
                status: 'planned',
            });
        }
        setErrors({});
        setSaved(false);
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
        if (form.startDate && form.endDate && form.endDate < form.startDate)
            errs.endDate = 'La date de fin doit être après la date de début';
        return errs;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setSaved(false);
        try {
            let res;
            if (isEdit) {
                res = await updateProject(project._id || project.id, form);
            } else {
                res = await createProject(form);
            }

            if (res.success) {
                setSaved(true);
                setTimeout(() => {
                    onClose();
                    if (onSave) onSave(res.data);
                }, 1200);
            } else {
                setErrors({ _global: res.message || 'Erreur lors de l’opération' });
            }
        } catch (err) {
            setErrors({ _global: err?.message || 'Erreur lors de la sauvegarde' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-brand-slate/60 z-50 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Slide-in panel */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-xl bg-brand-cream border-l-8 border-brand-teal z-[60] flex flex-col shadow-2xl overflow-hidden"
                style={{ animation: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>

                {/* ── Header ── */}
                <div className="bg-brand-teal text-white px-8 py-6 flex items-start justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase size={16} className="text-brand-orange" />
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">
                                {isEdit ? 'Modifier le projet industriel' : 'Initialisation d’un nouveau site'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                            {isEdit ? (project.name || project.title) : 'Déployer un Projet'}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-2 text-white/40">
                            <ChevronRight size={10} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {isEdit
                                    ? `ID ${String(project._id || project.id).slice(-6).toUpperCase()}`
                                    : 'Nouveau Protocole Operationnel'}
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

                    {/* Status selector (only for edit or optional for create) */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal">
                            Statut de l’opération
                        </label>
                        <div className="grid grid-cols-4 gap-0 border-2 border-brand-teal/30 shadow-[4px_4px_0px_0px_rgba(45,90,90,0.1)]">
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
                                Paramètres Techniques
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <InputField
                        id="title"
                        name="title"
                        label="Désignation du Projet"
                        icon={Briefcase}
                        placeholder="Ex: Site Alpha - Rénovation Structurelle"
                        value={form.title}
                        onChange={handleChange}
                        error={errors.title}
                    />

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label htmlFor="description" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal">
                            <AlignLeft size={11} className="text-brand-teal/50" />
                            Spécifications Techniques
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Détails de l'intervention, contraintes et charges..."
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
                                Logistique & Chronologie
                            </span>
                        </div>
                    </div>

                    {/* Address */}
                    <InputField
                        id="address"
                        name="address"
                        label="Coordonnées du Site"
                        icon={MapPin}
                        placeholder="Ex: 12 Zone Industrielle, Carthage"
                        value={form.address}
                        onChange={handleChange}
                    />

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            id="startDate"
                            name="startDate"
                            label="Date de Lancement"
                            icon={Calendar}
                            type="date"
                            value={form.startDate}
                            onChange={handleChange}
                        />
                        <InputField
                            id="endDate"
                            name="endDate"
                            label="Date d'Achèvement"
                            icon={Calendar}
                            type="date"
                            value={form.endDate}
                            onChange={handleChange}
                            error={errors.endDate}
                        />
                    </div>

                    {/* Global error */}
                    {errors._global && (
                        <div className="border-4 border-red-400 bg-red-50 px-4 py-3 flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 leading-tight">{errors._global}</p>
                        </div>
                    )}
                </form>

                {/* ── Footer actions ── */}
                <div className="px-8 py-6 border-t-8 border-brand-teal bg-white shrink-0 flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-2 border-brand-teal text-brand-teal hover:bg-brand-cream transition-all"
                    >
                        Annuler l'opération
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || saved}
                        className="flex-[2] py-4 text-[10px] font-black uppercase tracking-[0.2em] bg-brand-teal text-white border-2 border-brand-teal hover:bg-brand-orange hover:border-brand-orange transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-[4px_4px_0px_0px_rgba(45,90,90,0.2)]"
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Traitement en cours...</>
                        ) : saved ? (
                            <><CheckCircle2 size={18} className="text-white" /> Opération Réussie !</>
                        ) : (
                            <>
                                {isEdit ? <Save size={18} /> : <Send size={18} />}
                                {isEdit ? 'Enregistrer les Modifications' : 'Déployer le Projet'}
                            </>
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

export default ProjectModal;
