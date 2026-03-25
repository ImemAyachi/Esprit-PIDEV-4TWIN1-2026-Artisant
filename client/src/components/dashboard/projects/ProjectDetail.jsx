import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, LayoutDashboard, ListTodo, Users, 
    DollarSign, FileText, Activity, MessageSquare,
    Calendar, CheckCircle2, Clock, AlertTriangle,
    Plus, Send, History, Trash2, Edit3, Paperclip,
    Mic
} from 'lucide-react';
import useProjectStore from '../../../store/projectStore';

const TABS = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'planning', label: 'Planning (Gantt)', icon: Calendar },
    { id: 'tasks', label: 'Tâches', icon: ListTodo },
    { id: 'team', label: 'Équipe', icon: Users },
    { id: 'budget', label: 'Finances', icon: DollarSign },
    { id: 'notes', label: 'Notes & Journal', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: Paperclip },
    { id: 'history', label: 'Audit', icon: History },
];

const ProjectDetail = ({ project, onBack }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const { fetchProject, currentProject, addComment, addMilestone } = useProjectStore();

    useEffect(() => {
        fetchProject(project._id);
    }, [project._id, fetchProject]);

    const p = currentProject || project;

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500">
            {/* Top Bar */}
            <div className="bg-white border-4 border-brand-teal p-6 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(45,90,90,0.1)] mb-8">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="p-3 bg-brand-cream border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-teal/40">Registre de pilotage</span>
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-sm ${
                                p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {p.status}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-teal leading-none">{p.title}</h2>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Avancement</p>
                        <p className="text-2xl font-black text-brand-orange">{p.progress || 0}%</p>
                    </div>
                    <div className="w-px h-10 bg-brand-teal/10" />
                    <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">Deadline</p>
                        <p className="text-sm font-black text-brand-teal">
                            {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b-4 border-brand-teal mb-8 overflow-x-auto custom-scrollbar bg-white">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-r-2 border-brand-teal/10 last:border-r-0 ${
                            activeTab === tab.id 
                                ? 'bg-brand-teal text-white' 
                                : 'text-brand-teal/40 hover:bg-brand-cream active:bg-white'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-12">
                {activeTab === 'overview' && <OverviewTab project={p} />}
                {activeTab === 'planning' && <GanttChart project={p} />}
                {activeTab === 'milestones' && <MilestonesTab project={p} />}
                {activeTab === 'notes' && <NotesTab project={p} onAddComment={(content) => addComment(p._id, content)} />}
                {activeTab === 'budget' && <BudgetTab project={p} />}
                {activeTab === 'team' && <TeamTab project={p} />}
                {activeTab === 'history' && <HistoryTab project={p} />}
            </div>
        </div>
    );
};

const GanttChart = ({ project }) => {
    // Basic Gantt logic: Month headers + Task bars
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const milestones = project.milestones || [];

    return (
        <div className="bg-white border-4 border-brand-teal p-8 shadow-[12px_12px_0px_0px_rgba(45,90,90,0.05)] overflow-x-auto">
            <h4 className="text-sm font-black uppercase tracking-widest text-brand-teal mb-8">Visualisation Temporelle (Gantt)</h4>
            
            <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-13 border-b-2 border-brand-teal/10 pb-4">
                    <div className="col-span-1 text-[9px] font-black uppercase tracking-widest text-brand-teal/30">Livrable</div>
                    {months.map(m => (
                        <div key={m} className="text-center text-[9px] font-black uppercase tracking-widest text-brand-teal/30">{m}</div>
                    ))}
                </div>

                {/* Data Rows */}
                <div className="mt-4 space-y-4">
                    {milestones.length === 0 ? (
                        <p className="py-20 text-center text-[10px] font-black text-brand-teal/20 uppercase tracking-[0.5em]">Initialisez les jalons pour générer le diagramme</p>
                    ) : (
                        milestones.map((m, i) => {
                            // Mocking positions for demo - In real use, calc based on date
                            const startCol = 2 + (i % 8);
                            const spanCol = 2 + (i % 3);
                            return (
                                <div key={i} className="grid grid-cols-13 items-center group">
                                    <div className="col-span-1 text-[10px] font-black uppercase text-brand-teal truncate pr-4" title={m.title}>{m.title}</div>
                                    <div className="col-span-12 relative h-8 bg-brand-cream/30">
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 h-4 bg-brand-orange border-l-4 border-brand-teal shadow-[2px_2px_0px_0px_rgba(45,90,90,0.1)] group-hover:h-6 transition-all"
                                            style={{ 
                                                gridColumnStart: startCol,
                                                left: `${((startCol - 2) / 12) * 100}%`,
                                                width: `${(spanCol / 12) * 100}%`
                                            }}
                                        >
                                            <div className="absolute top-full mt-1 left-0 whitespace-nowrap text-[7px] font-black text-brand-orange leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                {m.percentage}% COMPLET
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            <div className="mt-12 flex gap-8 items-center bg-brand-cream p-4 border-l-4 border-brand-orange">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40">Légende</p>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-brand-orange border border-brand-teal" />
                    <span className="text-[9px] font-black uppercase text-brand-teal">Phase Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-brand-teal/10 border border-brand-teal/20" />
                    <span className="text-[9px] font-black uppercase text-brand-teal">Planification</span>
                </div>
            </div>
        </div>
    );
};

/* Sub-components for Tabs */

const OverviewTab = ({ project }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border-4 border-brand-teal p-8 shadow-[8px_8px_0px_0px_rgba(45,90,90,0.05)]">
                <h4 className="text-lg font-black uppercase tracking-widest text-brand-teal mb-6 flex items-center gap-2">
                    <FileText size={18} className="text-brand-orange" /> Spécifications Opérationnelles
                </h4>
                <div className="prose prose-sm max-w-none text-brand-slate font-bold leading-relaxed whitespace-pre-wrap">
                    {project.description || 'Aucune description technique fournie pour ce projet.'}
                </div>
            </section>

            <div className="grid grid-cols-2 gap-8">
                <div className="bg-white border-2 border-brand-teal/10 p-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40 mb-2">Entité Cliente</p>
                    <p className="text-sm font-black text-brand-teal">{project.client || 'Standard'}</p>
                </div>
                <div className="bg-white border-2 border-brand-teal/10 p-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40 mb-2">Matrice de Risque</p>
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-brand-orange" />
                        <span className="text-sm font-black text-brand-orange">Niveau Moyen - Audit requis</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-brand-teal text-white p-8">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-6 opacity-60">Logistique Temporelle</h4>
                <div className="space-y-6">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Début de Chantier</p>
                        <p className="text-lg font-black">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Non planifié'}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Fin d'Intervention</p>
                        <p className="text-lg font-black">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Non planifiée'}</p>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Performance</span>
                            <span className="text-[10px] font-black">Dans les délais</span>
                        </div>
                        <div className="h-1 bg-white/10">
                            <div className="h-full bg-brand-orange w-[85%]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const MilestonesTab = ({ project }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-black uppercase tracking-tighter text-brand-teal">Chronogramme des Jalons</h4>
            <button className="bg-brand-teal text-white p-3 hover:bg-brand-orange transition-all"><Plus size={18} /></button>
        </div>
        <div className="space-y-4">
            {(project.milestones || []).length === 0 ? (
                <div className="p-12 text-center bg-white border-2 border-dashed border-brand-teal/10 text-brand-teal/30 text-xs font-black uppercase">Aucun jalon défini</div>
            ) : (
                project.milestones.map((m, i) => (
                    <div key={i} className="bg-white border-2 border-brand-teal/10 p-6 flex items-center gap-8 hover:border-brand-teal transition-all">
                        <div className={`w-12 h-12 flex items-center justify-center font-black text-white ${m.status === 'Completed' ? 'bg-green-500' : 'bg-brand-teal'}`}>
                            {i + 1}
                        </div>
                        <div className="flex-1">
                            <h5 className="text-sm font-black uppercase tracking-tight text-brand-teal">{m.title}</h5>
                            <p className="text-[9px] font-bold text-brand-slate/40 uppercase mt-1">Échéance: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Flexible'}</p>
                        </div>
                        <div className="w-48">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[8px] font-black uppercase text-brand-teal/40">Progression</span>
                                <span className="text-[10px] font-black text-brand-teal">{m.percentage}%</span>
                            </div>
                            <div className="h-1.5 bg-brand-cream overflow-hidden">
                                <div className="h-full bg-brand-orange" style={{ width: `${m.percentage}%` }} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-sm ${
                                m.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {m.status}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

const NotesTab = ({ project, onAddComment }) => {
    const [cmt, setCmt] = useState('');
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <textarea 
                            className="w-full bg-white border-4 border-brand-teal p-6 text-sm font-bold min-h-[120px] outline-none shadow-[8px_8px_0px_0px_rgba(45,90,90,0.05)]"
                            placeholder="Consigner une nouvelle observation technique..."
                            value={cmt}
                            onChange={e => setCmt(e.target.value)}
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <button className="p-2 text-brand-teal/40 hover:text-brand-orange transition-all"><Mic size={18} /></button>
                            <button 
                                onClick={() => { onAddComment(cmt); setCmt(''); }}
                                className="bg-brand-teal text-white p-2 hover:bg-brand-orange transition-all shadow-[4px_4px_0px_0px_rgba(45,90,90,0.2)]"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {(project.comments || []).map((c, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-10 h-10 bg-brand-orange text-white flex items-center justify-center font-black text-xs shrink-0">U</div>
                            <div className="flex-1 bg-brand-cream/50 p-4 border-l-4 border-brand-teal">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-teal">Manager Site</span>
                                    <span className="text-[8px] font-bold text-brand-teal/30">{new Date(c.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-xs font-bold text-brand-slate leading-relaxed">{c.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-white border-2 border-brand-teal/10 p-6">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-brand-teal mb-4">Catégories de Notes</h5>
                    <div className="space-y-2">
                        {['Technique', 'Logistique', 'Sécurité', 'Financier'].map(cat => (
                            <div key={cat} className="flex justify-between items-center p-3 bg-brand-cream/30 hover:bg-brand-orange/10 cursor-pointer transition-all">
                                <span className="text-xs font-bold text-brand-teal">{cat}</span>
                                <span className="text-[8px] font-black text-brand-teal/20">0 NOTES</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BudgetTab = ({ project }) => {
    const totalPlanned = project.budget?.reduce((acc, b) => acc + b.planned, 0) || 0;
    const totalActual = project.expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
    const variance = totalPlanned - totalActual;
    const isOverBudget = variance < 0;

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-teal p-8 text-white relative overflow-hidden group">
                    <DollarSign className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-150 transition-transform duration-700" size={120} />
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2 relative z-10">Budget Alloué</p>
                    <p className="text-3xl font-black relative z-10">{totalPlanned.toLocaleString()} <span className="text-xs">DT</span></p>
                </div>
                <div className="bg-white border-4 border-brand-teal p-8 relative overflow-hidden group">
                    <Activity className="absolute -right-4 -bottom-4 text-brand-teal/5 group-hover:scale-150 transition-transform duration-700" size={120} />
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40 mb-2 relative z-10">Dépenses Réelles</p>
                    <p className="text-3xl font-black text-brand-teal relative z-10">{totalActual.toLocaleString()} <span className="text-xs opacity-30">DT</span></p>
                </div>
                <div className={`${isOverBudget ? 'bg-red-500' : 'bg-brand-orange'} p-8 text-white relative overflow-hidden group transition-colors duration-500`}>
                    <AlertTriangle className={`absolute -right-4 -bottom-4 text-white/10 ${isOverBudget ? 'animate-pulse opacity-40' : 'opacity-10'}`} size={120} />
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-2 relative z-10">
                        {isOverBudget ? 'DÉPASSEMENT BUDGÉTAIRE' : 'Écart de Trésorerie'}
                    </p>
                    <p className="text-3xl font-black relative z-10">
                        {Math.abs(variance).toLocaleString()} <span className="text-xs">DT</span>
                    </p>
                    {isOverBudget && (
                        <div className="mt-4 flex items-center gap-2 bg-white/20 p-2 text-[8px] font-black uppercase tracking-widest relative z-10">
                            <AlertCircle size={10} /> Alerte: Seuil de rentabilité compromis
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border-4 border-brand-teal p-8 shadow-[12px_12px_0px_0px_rgba(45,90,90,0.05)]">
                <div className="flex justify-between items-center mb-8">
                    <h5 className="text-sm font-black uppercase tracking-widest text-brand-teal">Répartition par Poste</h5>
                    <button className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:underline">+ Ajouter une dépense</button>
                </div>
                <div className="space-y-6">
                    {(project.budget || []).map((b, i) => {
                        const spent = project.expenses?.filter(e => e.category === b.category).reduce((acc, ex) => acc + ex.amount, 0) || 0;
                        const pct = b.planned > 0 ? (spent / b.planned) * 100 : 0;
                        
                        return (
                            <div key={i} className="relative pt-6 border-t border-brand-teal/5 first:border-t-0 first:pt-0 group">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <span className="text-xs font-black uppercase tracking-tighter text-brand-teal group-hover:text-brand-orange transition-colors">{b.category}</span>
                                        <p className="text-[8px] font-bold text-brand-teal/30 uppercase mt-0.5">Consommé: {spent.toLocaleString()} / {b.planned.toLocaleString()} DT</p>
                                    </div>
                                    <span className={`text-[10px] font-black ${pct > 100 ? 'text-red-500' : 'text-brand-teal'}`}>{pct.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-brand-cream border border-brand-teal/5 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${pct > 100 ? 'bg-red-500' : 'bg-brand-orange'}`} 
                                        style={{ width: `${Math.min(pct, 100)}%` }} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TeamTab = ({ project }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(project.team || []).map((member, i) => (
            <div key={i} className="bg-white border-4 border-brand-teal p-6 flex items-start gap-4 hover:border-brand-orange transition-all group">
                <div className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center font-black text-lg group-hover:bg-brand-orange">
                    {member.user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                    <h5 className="text-sm font-black uppercase tracking-tight text-brand-teal">{member.user?.name || member.email}</h5>
                    <p className="text-[8px] font-black text-brand-orange uppercase tracking-widest mb-3">{member.role || 'OPÉRATEUR'}</p>
                    <div className="flex gap-2">
                        <span className="text-[8px] font-bold text-brand-teal/40 uppercase">Assigné le: {member.assignedAt ? new Date(member.assignedAt).toLocaleDateString() : '—'}</span>
                    </div>
                </div>
            </div>
        ))}
        <button className="border-4 border-dashed border-brand-teal/20 p-8 flex flex-col items-center justify-center gap-4 text-brand-teal/20 hover:text-brand-orange hover:border-brand-orange transition-all">
            <Plus size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest">Enrôler un Collaborateur</span>
        </button>
    </div>
);

const HistoryTab = ({ project }) => (
    <div className="max-w-3xl space-y-8">
        {(project.history || []).reverse().map((h, i) => (
            <div key={i} className="relative pl-12 border-l-4 border-brand-teal/10 pb-8 last:pb-0">
                <div className="absolute top-0 left-[-10px] w-4 h-4 bg-white border-4 border-brand-teal rounded-full" />
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/30">{new Date(h.timestamp).toLocaleString()}</span>
                        <span className="px-2 py-0.5 bg-brand-teal/5 text-brand-teal text-[7px] font-black uppercase tracking-widest">{h.action}</span>
                    </div>
                    <p className="text-sm font-black text-brand-teal uppercase tracking-tight">{h.details}</p>
                    <p className="text-[9px] font-bold text-brand-slate/40 italic">Initié par: {h.user?.name || 'Système'}</p>
                </div>
            </div>
        ))}
    </div>
);

export default ProjectDetail;
