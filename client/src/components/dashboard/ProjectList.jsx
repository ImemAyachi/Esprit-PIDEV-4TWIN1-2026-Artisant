import React, { useEffect, useState } from 'react';
import { Briefcase, Calendar, MapPin, ArrowUpRight, Plus, Archive, Trash2, X, Check } from 'lucide-react';
import api from '../../api/axios';

const statusStyle = {
    in_progress: 'bg-brand-green text-white',
    planned: 'bg-brand-orange text-white',
    completed: 'bg-brand-teal text-white',
    archived: 'bg-brand-slate text-white',
};

const ProjectList = ({ onAddNew }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null); // holds project id awaiting confirm
    const [actionLoading, setActionLoading] = useState(null); // holds project id being acted upon

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/my');
            setProjects(response.data.data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (projectId) => {
        setActionLoading(projectId);
        try {
            const response = await api.patch(`/projects/${projectId}/archive`);
            setProjects((prev) =>
                prev.map((p) => (p._id === projectId ? response.data.data : p))
            );
        } catch (err) {
            console.error('Failed to archive project', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (projectId) => {
        setActionLoading(projectId);
        try {
            await api.delete(`/projects/${projectId}`);
            setProjects((prev) => prev.filter((p) => p._id !== projectId));
        } catch (err) {
            console.error('Failed to delete project', err);
        } finally {
            setActionLoading(null);
            setConfirmDelete(null);
        }
    };

    if (loading) return (
        <div className="p-8 text-center text-brand-teal uppercase font-black tracking-widest animate-pulse">
            Synchronizing project database...
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter text-brand-teal">My Operations</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal opacity-40 mt-1">
                        List of active and scheduled operations
                    </p>
                </div>
                <button onClick={onAddNew} className="btn-primary flex items-center gap-3 py-3 px-6">
                    <Plus size={18} /> New Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white border-4 border-dashed border-brand-teal/20 p-20 text-center">
                    <Briefcase size={48} className="mx-auto text-brand-teal/10 mb-6" />
                    <p className="text-brand-teal/40 font-black uppercase tracking-widest">
                        No active projects in your perimeter
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            className={`bg-white border-4 p-6 transition-all group flex flex-col gap-4 relative overflow-hidden ${project.status === 'archived'
                                ? 'border-brand-slate/30 opacity-70'
                                : 'border-brand-teal hover:translate-x-2'
                                }`}
                        >
                            <div className={`absolute top-0 left-0 w-2 h-full ${project.status === 'archived' ? 'bg-brand-slate/40' : 'bg-brand-orange'}`} />

                            {/* Main row */}
                            <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 ${statusStyle[project.status] || 'bg-brand-slate text-white'}`}>
                                            {project.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] font-bold text-brand-slate opacity-40 uppercase">
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-2xl font-black uppercase tracking-tight text-brand-teal group-hover:text-brand-orange transition-colors">
                                        {project.title}
                                    </h4>
                                    <p className="text-sm text-brand-slate font-bold opacity-60 mt-1 max-w-xl line-clamp-2">
                                        {project.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 items-center border-l-0 md:border-l-4 border-brand-teal/10 pl-0 md:pl-8">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-brand-orange" />
                                        <span className="text-[10px] font-black uppercase tracking-tight text-brand-teal">
                                            {project.address || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-brand-orange" />
                                        <span className="text-[10px] font-black uppercase tracking-tight text-brand-teal">
                                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {project.status !== 'archived' && (
                                            <button
                                                onClick={() => handleArchive(project._id)}
                                                disabled={actionLoading === project._id}
                                                title="Archive project"
                                                className="w-10 h-10 border-2 border-brand-teal text-brand-teal flex items-center justify-center hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-40"
                                            >
                                                <Archive size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setConfirmDelete(project._id)}
                                            disabled={actionLoading === project._id}
                                            title="Delete project"
                                            className="w-10 h-10 border-2 border-red-400 text-red-400 flex items-center justify-center hover:bg-red-400 hover:text-white transition-colors disabled:opacity-40"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center hover:bg-brand-orange transition-colors"
                                            title="Open project"
                                        >
                                            <ArrowUpRight size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Delete confirmation banner */}
                            {confirmDelete === project._id && (
                                <div className="mt-2 flex items-center justify-between gap-4 bg-red-50 border-2 border-red-400 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                                        Permanently delete this project? This cannot be undone.
                                    </p>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleDelete(project._id)}
                                            disabled={actionLoading === project._id}
                                            className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-40"
                                        >
                                            <Check size={14} /> Confirm
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(null)}
                                            className="flex items-center gap-1 px-3 py-2 border-2 border-brand-teal text-brand-teal text-[10px] font-black uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-colors"
                                        >
                                            <X size={14} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectList;
