import React, { useEffect, useState } from 'react';
import { Briefcase, Calendar, MapPin, Clock, ArrowUpRight, Search, Plus } from 'lucide-react';
import api from '../../api/axios';

const ProjectList = ({ onAddNew }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="p-8 text-center text-brand-teal uppercase font-black tracking-widest animate-pulse">Synchronizing project database...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter text-brand-teal">My Operations</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal opacity-40 mt-1">List of active and scheduled operations</p>
                </div>
                <button
                    onClick={onAddNew}
                    className="btn-primary flex items-center gap-3 py-3 px-6"
                >
                    <Plus size={18} /> New Project
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white border-4 border-dashed border-brand-teal/20 p-20 text-center">
                    <Briefcase size={48} className="mx-auto text-brand-teal/10 mb-6" />
                    <p className="text-brand-teal/40 font-black uppercase tracking-widest">No active projects in your perimeter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            className="bg-white border-4 border-brand-teal p-6 hover:translate-x-2 transition-all group flex flex-col md:flex-row justify-between gap-8 items-start md:items-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-brand-orange"></div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 ${project.status === 'in_progress' ? 'bg-brand-green text-white' :
                                        project.status === 'planned' ? 'bg-brand-orange text-white' :
                                            'bg-brand-slate text-white'
                                        }`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] font-bold text-brand-slate opacity-40 uppercase">{new Date(project.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="text-2xl font-black uppercase tracking-tight text-brand-teal group-hover:text-brand-orange transition-colors">{project.title}</h4>
                                <p className="text-sm text-brand-slate font-bold opacity-60 mt-1 max-w-xl line-clamp-2">{project.description}</p>
                            </div>

                            <div className="flex flex-wrap gap-6 items-center border-l-0 md:border-l-4 border-brand-teal/10 pl-0 md:pl-8">
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-brand-orange" />
                                    <span className="text-[10px] font-black uppercase tracking-tight text-brand-teal">{project.address || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-brand-orange" />
                                    <span className="text-[10px] font-black uppercase tracking-tight text-brand-teal">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                                    </span>
                                </div>
                                <button className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center hover:bg-brand-orange transition-colors">
                                    <ArrowUpRight size={24} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectList;
