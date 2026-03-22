import React, { useState, useEffect } from 'react';
import { 
    Briefcase, Plus, Filter, Search, Grid, List, 
    ChevronRight, MoreVertical, Archive, Trash2, 
    RotateCcw, CheckCircle2, AlertCircle, Clock,
    LayoutDashboard, Calendar as CalendarIcon, 
    Users, DollarSign, FileText, Activity, MapPin,
    Pencil, Loader2, Eye
} from 'lucide-react';
import useProjectStore from '../../../store/projectStore';
import ProjectModal from '../ProjectModal';
import ProjectDetail from './ProjectDetail';
import ProjectCalendar from './ProjectCalendar';

const ProjectDashboard = () => {
    const { projects, loading, fetchMyProjects, bulkUpdate, deleteProject, restoreProject } = useProjectStore();
    const [view, setView] = useState('grid'); // grid, list, calendar
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showArchived, setShowArchived] = useState(false);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [activeProject, setActiveProject] = useState(null);

    useEffect(() => {
        fetchMyProjects({ status: statusFilter !== 'all' ? statusFilter : undefined, deleted: showArchived });
    }, [statusFilter, showArchived, fetchMyProjects]);

    const handleBulkStatusChange = async (newStatus) => {
        if (selectedProjects.length === 0) return;
        await bulkUpdate(selectedProjects, { status: newStatus });
        setSelectedProjects([]);
    };

    const toggleSelection = (id) => {
        setSelectedProjects(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredProjects = projects.filter(p => 
        (p.title || '').toLowerCase().includes(search.toLowerCase())
    );

    if (activeProject) {
        return <ProjectDetail project={activeProject} onBack={() => setActiveProject(null)} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 border-4 border-brand-teal shadow-[8px_8px_0px_0px_rgba(45,90,90,0.1)]">
                <div className="flex-1 flex gap-4 w-full">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal/30 group-focus-within:text-brand-teal transition-colors" size={18} />
                        <input 
                            className="w-full pl-12 pr-4 py-3 bg-brand-cream border-2 border-brand-teal/10 hover:border-brand-teal/30 focus:border-brand-teal outline-none text-sm font-bold transition-all"
                            placeholder="Rechercher un matricule ou titre..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select 
                        className="bg-brand-cream border-2 border-brand-teal/10 px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-brand-teal cursor-pointer"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tous les Statuts</option>
                        <option value="planned">Planifiés</option>
                        <option value="in_progress">En Cours</option>
                        <option value="completed">Terminés</option>
                        <option value="on_hold">En Pause</option>
                    </select>
                </div>

                <div className="flex gap-3 items-center w-full md:w-auto">
                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={`p-3 border-2 transition-all ${showArchived ? 'bg-brand-teal text-white border-brand-teal' : 'border-brand-teal/10 text-brand-teal/40 hover:border-brand-teal'}`}
                        title="Voir les archives"
                    >
                        <Archive size={18} />
                    </button>
                    <div className="h-8 w-px bg-brand-teal/10" />
                    <button 
                        onClick={() => setView(view === 'grid' ? 'list' : view === 'list' ? 'calendar' : 'grid')}
                        className="p-3 border-2 border-brand-teal/10 text-brand-teal hover:border-brand-teal transition-all flex items-center gap-2 font-black uppercase text-[10px]"
                    >
                        {view === 'grid' ? <List size={18} /> : view === 'list' ? <CalendarIcon size={18} /> : <Grid size={18} />}
                        <span className="hidden md:inline">{view}</span>
                    </button>
                    <button 
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="bg-brand-teal text-white px-6 py-3 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 hover:bg-brand-orange transition-all shadow-[4px_4px_0px_0px_rgba(45,90,90,0.2)]"
                    >
                        <Plus size={16} /> Initialiser Site
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedProjects.length > 0 && (
                <div className="bg-brand-orange text-white p-4 flex justify-between items-center animate-in slide-in-from-top-4">
                    <span className="text-xs font-black uppercase tracking-widest">
                        {selectedProjects.length} PROJET(S) SÉLECTIONNÉ(S)
                    </span>
                    <div className="flex gap-4">
                        <button onClick={() => handleBulkStatusChange('completed')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline">
                            <CheckCircle2 size={14} /> Terminer
                        </button>
                        <button onClick={() => handleBulkStatusChange('on_hold')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline">
                            <Clock size={14} /> Suspendre
                        </button>
                    </div>
                </div>
            )}

            {/* Main Grid/List */}
            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4 text-brand-teal opacity-30">
                    <Loader2 className="animate-spin" size={48} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Connexion au registre central...</span>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center gap-6 bg-brand-cream border-4 border-dashed border-brand-teal/10">
                    <Briefcase size={64} className="text-brand-teal/10" />
                    <p className="text-xs font-black uppercase tracking-widest text-brand-teal/30">Aucun protocole opérationnel détecté dans cette section</p>
                    <button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="text-xs font-black text-brand-orange underline uppercase tracking-widest">Déclencher une nouvelle opération</button>
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProjects.map(p => (
                        <ProjectCard 
                            key={p._id} 
                            project={p} 
                            selected={selectedProjects.includes(p._id)}
                            onSelect={() => toggleSelection(p._id)}
                            onOpen={() => setActiveProject(p)}
                            onEdit={() => { setEditingProject(p); setIsModalOpen(true); }}
                        />
                    ))}
                </div>
            ) : view === 'list' ? (
                <div className="bg-white border-4 border-brand-teal overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest">
                                <th className="p-4 w-12"><input type="checkbox" className="accent-brand-orange" /></th>
                                <th className="p-4">Désignation</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Avancement</th>
                                <th className="p-4">Budget</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-brand-teal/5">
                            {filteredProjects.map(p => (
                                <ProjectRow 
                                    key={p._id} 
                                    project={p} 
                                    selected={selectedProjects.includes(p._id)}
                                    onSelect={() => toggleSelection(p._id)}
                                    onOpen={() => setActiveProject(p)}
                                    onEdit={() => { setEditingProject(p); setIsModalOpen(true); }}
                                    onDelete={() => deleteProject(p._id)}
                                    onRestore={() => restoreProject(p._id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <ProjectCalendar projects={filteredProjects} />
            )}

            {isModalOpen && (
                <ProjectModal 
                    project={editingProject} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={() => { fetchMyProjects(); setIsModalOpen(false); }} 
                />
            )}
        </div>
    );
};

const ProjectCard = ({ project, selected, onSelect, onOpen, onEdit }) => (
    <div className={`relative bg-white border-4 p-8 transition-all hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(45,90,90,0.1)] group ${selected ? 'border-brand-orange' : 'border-brand-teal hover:border-brand-orange'}`}>
        <div className="absolute top-4 right-4 flex gap-2">
            <input 
                type="checkbox" 
                checked={selected} 
                onChange={onSelect}
                className="w-5 h-5 accent-brand-orange cursor-pointer" 
            />
        </div>

        <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${project.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-brand-teal/20'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-brand-teal/40">{project.status}</span>
        </div>

        <h4 className="text-xl font-black uppercase tracking-tighter text-brand-teal mb-2 group-hover:text-brand-orange transition-colors line-clamp-1">{project.title}</h4>
        <div className="flex items-center gap-2 text-brand-slate/40 mb-6">
            <MapPin size={12} />
            <span className="text-[10px] font-bold truncate">{project.location || 'Localisation non définie'}</span>
        </div>

        <div className="space-y-4 mb-8">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">Avancement Global</span>
                <span className="text-xs font-black text-brand-teal">{project.progress || 0}%</span>
            </div>
            <div className="h-2 bg-brand-cream border border-brand-teal/10 overflow-hidden">
                <div 
                    className="h-full bg-brand-orange transition-all duration-1000" 
                    style={{ width: `${project.progress || 0}%` }} 
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t-2 border-brand-teal/5 pt-6">
            <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/30 mb-1">Membres</p>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-brand-teal/5 border border-brand-teal text-[8px] flex items-center justify-center font-black text-brand-teal">PM</div>
                    ))}
                </div>
            </div>
            <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest text-brand-teal/30 mb-1">Livraison Prévue</p>
                <p className="text-[10px] font-black text-brand-teal">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}
                </p>
            </div>
        </div>

        <div className="mt-8 flex gap-2">
            <button 
                onClick={onOpen}
                className="flex-1 py-3 bg-brand-teal text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(45,90,90,0.2)] hover:bg-brand-orange transition-all"
            >
                Pilotage
            </button>
            <button 
                onClick={onEdit}
                className="p-3 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(45,90,90,0.1)]"
            >
                <Pencil size={14} />
            </button>
        </div>
    </div>
);

const ProjectRow = ({ project, selected, onSelect, onOpen, onEdit, onDelete, onRestore }) => (
    <tr className={`group transition-colors ${selected ? 'bg-brand-orange/5' : 'hover:bg-brand-cream'}`}>
        <td className="p-4"><input type="checkbox" checked={selected} onChange={onSelect} className="accent-brand-orange" /></td>
        <td className="p-4">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center font-black text-[10px] text-white ${project.status === 'in_progress' ? 'bg-blue-500' : 'bg-brand-teal'}`}>
                    {String(project.title).charAt(0).toUpperCase()}
                </div>
                <div>
                    <p onClick={onOpen} className="text-sm font-black uppercase tracking-tight text-brand-teal cursor-pointer hover:text-brand-orange">{project.title}</p>
                    <p className="text-[9px] font-bold text-brand-slate/40">ID: {String(project._id).slice(-6).toUpperCase()}</p>
                </div>
            </div>
        </td>
        <td className="p-4">
            <p className="text-xs font-bold text-brand-teal">{project.client || 'Divers'}</p>
            <p className="text-[9px] font-bold text-brand-slate/40">{project.location}</p>
        </td>
        <td className="p-4">
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-sm ${
                project.status === 'completed' ? 'bg-green-100 text-green-700' : 
                project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
                {project.status}
            </span>
        </td>
        <td className="p-4 w-48">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-brand-cream border border-brand-teal/10">
                    <div className="h-full bg-brand-orange" style={{ width: `${project.progress || 0}%` }} />
                </div>
                <span className="text-[9px] font-black text-brand-teal">{project.progress || 0}%</span>
            </div>
        </td>
        <td className="p-4">
            <p className="text-xs font-black text-brand-teal">
                {project.budget?.reduce((acc, b) => acc + b.planned, 0).toLocaleString()} DT
            </p>
        </td>
        <td className="p-4 text-right">
            <div className="flex justify-end gap-1">
                {project.isDeleted ? (
                    <button onClick={onRestore} className="p-2 border border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"><RotateCcw size={12} /></button>
                ) : (
                    <>
                        <button onClick={onOpen} className="p-2 border border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"><Eye size={12} /></button>
                        <button onClick={onEdit} className="p-2 border border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"><Pencil size={12} /></button>
                        <button onClick={onDelete} className="p-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={12} /></button>
                    </>
                )}
            </div>
        </td>
    </tr>
);

export default ProjectDashboard;
