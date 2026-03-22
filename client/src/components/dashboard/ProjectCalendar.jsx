import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

const ProjectCalendar = ({ projects }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const totalDays = daysInMonth(month, year);
    const firstDay = firstDayOfMonth(month, year);

    // Filter projects that fall into this month
    const currentMonthProjects = projects.filter(p => {
        if (!p.startDate) return false;
        const d = new Date(p.startDate);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    return (
        <div className="bg-white border-4 border-brand-teal p-6 shadow-[8px_8px_0px_0px_rgba(45,90,90,0.1)]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter text-brand-teal flex items-center gap-2">
                    <Briefcase className="text-brand-orange" size={20} />
                    Calendrier Opérationnel
                </h3>
                <div className="flex items-center gap-4 bg-brand-teal text-white px-4 py-2">
                    <button onClick={prevMonth} className="hover:text-brand-orange transition-colors"><ChevronLeft size={18} /></button>
                    <span className="text-[10px] font-black uppercase tracking-widest min-w-[120px] text-center">{months[month]} {year}</span>
                    <button onClick={nextMonth} className="hover:text-brand-orange transition-colors"><ChevronRight size={18} /></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-brand-teal/20 border-2 border-brand-teal/20">
                {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(d => (
                    <div key={d} className="bg-brand-cream p-2 text-center text-[9px] font-black uppercase tracking-widest text-brand-teal/50">
                        {d}
                    </div>
                ))}
                
                {[...Array(firstDay)].map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white min-h-[80px] p-2 opacity-30" />
                ))}

                {[...Array(totalDays)].map((_, i) => {
                    const day = i + 1;
                    const dayProjects = currentMonthProjects.filter(p => new Date(p.startDate).getDate() === day);
                    
                    return (
                        <div key={day} className="bg-white min-h-[80px] p-2 border-r border-b border-brand-teal/5 hover:bg-brand-cream transition-colors group relative">
                            <span className="text-[10px] font-black text-brand-teal/30 group-hover:text-brand-teal transition-colors">{day}</span>
                            <div className="mt-1 space-y-1">
                                {dayProjects.map(p => (
                                    <div 
                                        key={p._id} 
                                        className={`text-[7px] font-black uppercase p-1 truncate border-l-2 shadow-sm ${
                                            p.status === 'in_progress' ? 'bg-blue-50 border-blue-500 text-blue-700' :
                                            p.status === 'completed' ? 'bg-green-50 border-green-500 text-green-700' :
                                            'bg-yellow-50 border-yellow-500 text-yellow-700'
                                        }`}
                                    >
                                        {p.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectCalendar;
