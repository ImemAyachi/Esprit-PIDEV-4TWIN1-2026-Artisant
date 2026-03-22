import React, { useState, useEffect } from 'react';
import {
    X, Save, Briefcase, MapPin, Calendar,
    AlignLeft, AlertCircle, CheckCircle2,
    Loader2, ChevronRight, Plus, Send, Mic,
    Users, DollarSign, ListTodo, ChevronLeft,
    Trash2
} from 'lucide-react';
import useProjectStore from '../../store/projectStore';

const STEPS = [
    { id: 'info', label: 'Spécifications', icon: Briefcase },
    { id: 'timeline', label: 'Chronologie', icon: Calendar },
    { id: 'team', label: 'Équipage', icon: Users },
    { id: 'budget', label: 'Finances', icon: DollarSign },
    { id: 'review', label: 'Validation', icon: CheckCircle2 }
];

const InputField = ({ id, label, icon: Icon, error, ...props }) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal">
            {Icon && <Icon size={11} className="text-brand-teal/50" />}
            {label}
        </label>
        <input
            id={id}
            className={`block w-full px-4 py-3 bg-brand-cream border-2 text-sm font-bold text-brand-slate outline-none transition-all placeholder:text-brand-teal/20 rounded-none focus:bg-white focus:border-brand-teal ${error ? 'border-red-400' : 'border-brand-teal/30'}`}
            {...props}
        />
        {error && <p className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
    </div>
);

const ProjectModal = ({ project, onClose, onSave }) => {
    const isEdit = !!(project && (project._id || project.id));
    const { createProject, updateProject } = useProjectStore();

    const [currentStep, setCurrentStep] = useState(0);
    const [form, setForm] = useState({
        title: '',
        client: '',
        location: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'planned',
        milestones: [],
        team: [],
        budget: [
            { category: 'Materials', planned: 0 },
            { category: 'Labor', planned: 0 },
            { category: 'Equipment', planned: 0 }
        ]
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (project) {
            setForm({
                title: project.title || '',
                client: project.client || '',
                location: project.location || '',
                description: project.description || '',
                startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                status: project.status || 'planned',
                milestones: project.milestones || [],
                team: project.team || [],
                budget: project.budget?.length ? project.budget : [
                    { category: 'Materials', planned: 0 },
                    { category: 'Labor', planned: 0 },
                    { category: 'Equipment', planned: 0 }
                ]
            });
        }
    }, [project]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = isEdit 
                ? await updateProject(project._id || project.id, form)
                : await createProject(form);
            if (res.success) {
                setSaved(true);
                setTimeout(() => { onClose(); onSave?.(); }, 1500);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-brand-slate/60 z-50 backdrop-blur-sm" onClick={onClose} />
            <aside className="fixed top-0 right-0 h-full w-full max-w-2xl bg-brand-cream border-l-8 border-brand-teal z-[60] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="bg-brand-teal text-white p-8 shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 block mb-2">
                                {isEdit ? 'Modification Protocole' : 'Initialisation Site'}
                            </span>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">
                                {isEdit ? form.title : 'Nouveau Projet'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 border-2 border-white/20 hover:bg-white hover:text-brand-teal transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Stepper UI */}
                    <div className="flex gap-4">
                        {STEPS.map((step, idx) => (
                            <div key={step.id} className="flex-1 flex flex-col gap-2">
                                <div className={`h-1.5 transition-all ${idx <= currentStep ? 'bg-brand-orange' : 'bg-white/20'}`} />
                                <div className={`flex items-center gap-2 ${idx === currentStep ? 'text-white' : 'text-white/30'}`}>
                                    <step.icon size={12} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">{step.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <InputField 
                                label="Désignation" 
                                icon={Briefcase} 
                                value={form.title} 
                                onChange={e => setForm({...form, title: e.target.value})} 
                                placeholder="Nom du chantier..." 
                            />
                            <InputField 
                                label="Client / Entité" 
                                icon={Users} 
                                value={form.client} 
                                onChange={e => setForm({...form, client: e.target.value})} 
                                placeholder="Nom du client..." 
                            />
                            <InputField 
                                label="Position Géographique" 
                                icon={MapPin} 
                                value={form.location} 
                                onChange={e => setForm({...form, location: e.target.value})} 
                                placeholder="Adresse précise..." 
                            />
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-brand-teal">Spécifications</label>
                                <textarea 
                                    className="w-full bg-white border-2 border-brand-teal/20 p-4 text-sm font-bold min-h-[150px] outline-none focus:border-brand-teal"
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    placeholder="Détails du projet..."
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-2 gap-6">
                                <InputField label="Lancement" type="date" icon={Calendar} value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                                <InputField label="Livraison" type="date" icon={Calendar} value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                            </div>
                            
                            <div className="border-4 border-brand-teal p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-teal">Milestones / Jalons</h4>
                                    <button 
                                        onClick={() => setForm({...form, milestones: [...form.milestones, { title: '', percentage: 0, status: 'Pending' }]})}
                                        className="p-2 bg-brand-teal text-white hover:bg-brand-orange transition-all"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {form.milestones.map((m, i) => (
                                        <div key={i} className="flex gap-4 items-center bg-white p-4 border border-brand-teal/10">
                                            <input 
                                                className="flex-1 bg-transparent border-b-2 border-brand-teal/10 focus:border-brand-teal outline-none text-xs font-bold"
                                                value={m.title}
                                                onChange={e => {
                                                    const news = [...form.milestones];
                                                    news[i].title = e.target.value;
                                                    setForm({...form, milestones: news});
                                                }}
                                                placeholder="Titre du jalon..."
                                            />
                                            <input 
                                                type="number"
                                                className="w-16 bg-brand-cream p-2 text-xs font-black text-center"
                                                value={m.percentage}
                                                onChange={e => {
                                                    const news = [...form.milestones];
                                                    news[i].percentage = e.target.value;
                                                    setForm({...form, milestones: news});
                                                }}
                                            />
                                            <button 
                                                onClick={() => setForm({...form, milestones: form.milestones.filter((_, idx) => idx !== i)})}
                                                className="text-red-400 hover:text-red-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <p className="text-[10px] font-bold text-center text-brand-teal/40 uppercase bg-white py-12 border-2 border-dashed border-brand-teal/20">
                                Le système de gestion d'équipe est interfacé avec l'annuaire central.<br/>Attribuez des rôles pour activer les notifications.
                            </p>
                            {/* In a real app, populate with User selection. Here we mock adding by email */}
                            <div className="flex gap-4">
                                <input className="flex-1 bg-white border-2 border-brand-teal/20 p-4 text-xs font-bold" placeholder="Email du collaborateur..." />
                                <button className="px-8 bg-brand-teal text-white font-black uppercase text-[10px] tracking-widest">Assigner</button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-brand-teal p-6 text-white flex justify-between items-center">
                                <h4 className="text-sm font-black uppercase tracking-tighter">Budget Prévisionnel</h4>
                                <p className="text-2xl font-black">
                                    {form.budget.reduce((acc, b) => acc + Number(b.planned), 0).toLocaleString()} DT
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {form.budget.map((b, i) => (
                                    <div key={b.category} className="flex items-center justify-between p-4 bg-white border-2 border-brand-teal/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 bg-brand-orange" />
                                            <span className="text-xs font-black uppercase text-brand-teal">{b.category}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                className="w-32 bg-brand-cream border-2 border-brand-teal/10 p-2 text-right font-black text-brand-teal outline-none focus:border-brand-teal"
                                                value={b.planned}
                                                onChange={e => {
                                                    const news = [...form.budget];
                                                    news[i].planned = e.target.value;
                                                    setForm({...form, budget: news});
                                                }}
                                            />
                                            <span className="text-[10px] font-black opacity-40">DT</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white border-8 border-brand-teal p-8 shadow-[20px_20px_0px_0px_rgba(45,90,90,0.1)]">
                                <h4 className="text-2xl font-black uppercase tracking-tighter text-brand-teal mb-4">Récapitulatif</h4>
                                <dl className="grid grid-cols-2 gap-x-12 gap-y-6">
                                    <div>
                                        <dt className="text-[8px] font-black uppercase tracking-widest opacity-40">Projet</dt>
                                        <dd className="text-sm font-black text-brand-teal">{form.title}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[8px] font-black uppercase tracking-widest opacity-40">Lieu</dt>
                                        <dd className="text-sm font-black text-brand-teal">{form.location}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[8px] font-black uppercase tracking-widest opacity-40">Lancement</dt>
                                        <dd className="text-sm font-black text-brand-teal">{form.startDate}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[8px] font-black uppercase tracking-widest opacity-40">Timeline</dt>
                                        <dd className="text-sm font-black text-brand-teal">{form.milestones.length} Jalons prévus</dd>
                                    </div>
                                </dl>
                            </div>
                            {saved && (
                                <div className="bg-green-500 text-white p-6 font-black uppercase tracking-widest text-center flex items-center justify-center gap-4 animate-bounce">
                                    <CheckCircle2 size={24} /> DÉPLOIEMENT RÉUSSI
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-white border-t-8 border-brand-teal flex justify-between items-center shrink-0">
                    <button 
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-6 py-4 border-2 border-brand-teal text-brand-teal font-black uppercase text-[10px] tracking-widest hover:bg-brand-cream disabled:opacity-20 transition-all"
                    >
                        <ChevronLeft size={16} /> Étape Précédente
                    </button>

                    {currentStep < STEPS.length - 1 ? (
                        <button 
                            onClick={handleNext}
                            className="flex items-center gap-2 px-10 py-4 bg-brand-teal text-white font-black uppercase text-[10px] tracking-widest hover:bg-brand-orange transition-all shadow-[6px_6px_0px_0px_rgba(45,90,90,0.2)]"
                        >
                            Étape Suivante <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-12 py-4 bg-brand-orange text-white font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[6px_6px_0px_0px_rgba(230,126,34,0.3)]"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                            Valider & Déployer le Site
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default ProjectModal;
