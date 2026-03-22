import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Briefcase } from 'lucide-react';

const ProjectCalendar = ({ projects }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1));

    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    const getProjectsForDay = (day) => {
        const d = new Date(year, month, day);
        return projects.filter(p => {
            const start = p.startDate ? new Date(p.startDate) : null;
            const end = p.endDate ? new Date(p.endDate) : null;
            if (!start || !end) return false;
            return d >= start && d <= end;
        });
    };

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    return (
        <div className="bg-white border-4 border-brand-teal animate-in fade-in duration-500 overflow-hidden shadow-[12px_12px_0px_0px_rgba(45,90,90,0.05)]">
            {/* Header */}
            <div className="bg-brand-teal text-white p-6 flex justify-between items-center border-b-4 border-brand-orange">
                <div className="flex items-center gap-4">
                    <CalendarIcon size={24} className="text-brand-orange" />
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-widest">{monthNames[month]} {year}</h3>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Registre Temporel Opérationnel</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 bg-white/10 hover:bg-brand-orange transition-all"><ChevronLeft size={20} /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white/10 text-[10px] font-black uppercase hover:bg-brand-orange transition-all">Aujourd'hui</button>
                    <button onClick={nextMonth} className="p-2 bg-white/10 hover:bg-brand-orange transition-all"><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 border-b-2 border-brand-teal/10">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="p-3 text-center text-[9px] font-black uppercase tracking-widest text-brand-teal/40 bg-brand-cream/50 border-r border-brand-teal/5 last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-[120px]">
                {/* Offsets */}
                {Array.from({ length: (startOffset + 6) % 7 }).map((_, i) => (
                    <div key={`off-${i}`} className="bg-brand-cream/10 border-r border-b border-brand-teal/5" />
                ))}

                {/* Days */}
                {days.map(day => {
                    const dayProjects = getProjectsForDay(day);
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                    return (
                        <div key={day} className={`p-2 border-r border-b border-brand-teal/5 transition-colors hover:bg-brand-orange/5 group relative ${isToday ? 'bg-brand-orange/10' : ''}`}>
                            <div className={`text-xs font-black mb-2 ${isToday ? 'text-brand-orange' : 'text-brand-teal/30 group-hover:text-brand-teal'}`}>
                                {day < 10 ? `0${day}` : day}
                            </div>
                            
                            <div className="space-y-1 overflow-y-auto h-[80px] pr-1 custom-scrollbar">
                                {dayProjects.map((p, i) => (
                                    <div 
                                        key={i} 
                                        className={`px-2 py-1 text-[7px] font-black uppercase truncate border-l-2 shadow-sm cursor-pointer hover:translate-x-1 transition-all ${
                                            p.status === 'completed' ? 'bg-green-100 text-green-800 border-green-500' :
                                            p.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-500' :
                                            'bg-brand-orange/10 text-brand-orange border-brand-orange'
                                        }`}
                                        title={`${p.title} - ${p.status}`}
                                    >
                                        {p.title}
                                    </div>
                                ))}
                            </div>

                            {dayProjects.length > 2 && (
                                <div className="absolute bottom-1 right-1 text-[6px] font-black text-brand-teal/30">
                                    + {dayProjects.length - 2} AUTRES
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="bg-brand-cream p-4 flex gap-8 items-center border-t-4 border-brand-teal">
                <span className="text-[8px] font-black uppercase tracking-widest text-brand-teal/60">Légende Matrice</span>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 border-l-2 border-blue-500" />
                    <span className="text-[8px] font-bold text-brand-teal uppercase">En Cours</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 border-l-2 border-green-500" />
                    <span className="text-[8px] font-bold text-brand-teal uppercase">Terminé</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-brand-orange/10 border-l-2 border-brand-orange" />
                    <span className="text-[8px] font-bold text-brand-teal uppercase">Planifié</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectCalendar;
