import React, { useState, useEffect } from 'react';
import {
    Shield,
    Users,
    Activity,
    Server,
    Database,
    Lock,
    AlertTriangle,
    Terminal,
    Settings,
    LogOut,
    Search,
    Bell,
    Cpu,
    HardDrive,
    Zap,
    RefreshCw,
    Filter,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import UserList from '../components/dashboard/UserList';

const AdminDashboard = () => {
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [systemMetrics, setSystemMetrics] = useState({
        cpu: 42,
        memory: 68,
        storage: 24,
        uptime: '15d 4h 22m'
    });

    // Simulate metric fluctuations
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemMetrics(prev => ({
                ...prev,
                cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 10)),
                memory: Math.min(100, Math.max(0, prev.memory + (Math.random() - 0.5) * 5))
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const navigation = [
        { name: 'Overview', icon: Shield },
        { name: 'User Directory', icon: Users },
        { name: 'System Nodes', icon: Server },
        { name: 'Security Protocol', icon: Lock },
        { name: 'Data Center', icon: Database },
        { name: 'Terminal Logs', icon: Terminal },
        { name: 'Global Assets', icon: Settings },
    ];

    const alerts = [
        { level: 'Critical', msg: 'System node 4 unauthorized access attempt blocked.', time: '2m ago' },
        { level: 'Warning', msg: 'API Latency exceeding 500ms threshold.', time: '14m ago' },
        { level: 'Info', msg: 'Backup protocols completed successfully.', time: '1h ago' }
    ];

    return (
        <div className="h-screen w-full bg-slate-950 flex overflow-hidden font-outfit text-slate-200">
            {/* Admin Sidebar */}
            <aside
                className={`bg-slate-900 border-r-4 border-brand-orange transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-80' : 'w-24'
                    }`}
            >
                {/* Brand Header */}
                <div className="p-8 border-b border-white/5 flex items-center gap-4 h-24 shrink-0 bg-black/20">
                    <img src={logo} alt="" className="w-10 h-10 object-contain invert" />
                    {sidebarOpen && (
                        <div className="flex flex-col animate-in">
                            <span className="font-black uppercase tracking-tighter text-2xl text-white">Artisanat</span>
                            <span className="text-[8px] font-black tracking-[0.4em] text-brand-orange leading-none uppercase -mt-1">Core Admin 2.0</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto no-scrollbar pt-8">
                    {navigation.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`flex items-center gap-4 p-4 border-2 transition-all group relative overflow-hidden ${activeTab === item.name
                                ? 'bg-brand-orange border-brand-orange text-white'
                                : 'bg-transparent text-slate-400 border-transparent hover:border-white/10 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={activeTab === item.name ? 'text-white' : 'group-hover:text-brand-orange'} />
                            {sidebarOpen && (
                                <span className="font-black uppercase tracking-widest text-[10px] animate-in">
                                    {item.name}
                                </span>
                            )}
                            {activeTab === item.name && (
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white"></div>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Session */}
                <div className="p-6 border-t border-white/5 bg-black/40">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-white/5 border-2 border-brand-orange flex items-center justify-center font-black animate-in relative overflow-hidden">
                                <ShieldCheck size={24} className="text-brand-orange" />
                            </div>
                            <div className="animate-in">
                                <p className="font-black uppercase text-[10px] tracking-widest leading-none mb-1 text-white">ROOT_{user?.companyName?.replace(/\s/g, '_').toUpperCase()}</p>
                                <p className="text-[8px] font-bold text-brand-orange uppercase tracking-widest leading-none">{user?.role}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-6">
                            <ShieldCheck size={24} className="text-brand-orange" />
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className={`w-full flex items-center justify-center gap-3 p-4 bg-red-500/10 border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest ${!sidebarOpen && 'px-0'}`}
                    >
                        <LogOut size={16} />
                        {sidebarOpen && <span>Sever Session</span>}
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="h-24 border-b border-white/5 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="w-10 h-10 border-2 border-white/10 text-slate-400 hover:border-brand-orange hover:text-brand-orange transition-all flex items-center justify-center"
                        >
                            <RefreshCw size={18} className={sidebarOpen ? '' : 'rotate-180 transition-transform duration-500'} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-none tracking-widest">{activeTab}</h2>
                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-orange mt-1 opacity-80 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Primary Server: RUNNING
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">System Uptime</span>
                            <span className="text-sm font-black text-white">{systemMetrics.uptime}</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10 hidden lg:block"></div>
                        <button className="relative w-12 h-12 border-2 border-white/10 flex items-center justify-center text-slate-300 hover:bg-white hover:text-slate-900 transition-all">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-orange rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Dashboard View */}
                <section className="flex-1 overflow-y-auto p-12 custom-scrollbar relative">
                    {/* Background Visuals */}
                    <div className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-brand-orange/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

                    {activeTab === 'Overview' && (
                        <div className="space-y-12">
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-slate-900/50 border-2 border-white/5 p-6 hover:border-brand-orange/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-brand-orange/10 text-brand-orange">
                                            <Cpu size={20} />
                                        </div>
                                        <TrendingUp size={16} className="text-green-500" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Processor Load</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-3xl font-black text-white">{Math.round(systemMetrics.cpu)}%</p>
                                        <div className="flex-1 h-2 bg-white/5 mb-2 relative">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-brand-orange transition-all duration-1000"
                                                style={{ width: `${systemMetrics.cpu}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border-2 border-white/5 p-6 hover:border-brand-orange/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-blue-500/10 text-blue-500">
                                            <HardDrive size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-blue-500">STABLE</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Memory Allocation</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-3xl font-black text-white">{Math.round(systemMetrics.memory)}%</p>
                                        <div className="flex-1 h-2 bg-white/5 mb-2 relative">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-1000"
                                                style={{ width: `${systemMetrics.memory}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border-2 border-white/5 p-6 hover:border-brand-orange/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-green-500/10 text-green-500">
                                            <Zap size={20} />
                                        </div>
                                        <ArrowUpRight size={16} className="text-green-500" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Network Priority</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-3xl font-black text-white">99.9%</p>
                                        <p className="text-[10px] font-bold text-green-500 mb-2 uppercase">Optimal</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border-2 border-white/5 p-6 hover:border-brand-orange/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-red-500/10 text-red-500">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <span className="text-[8px] font-black bg-red-500 text-white px-1">NEW</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Alert Protocol</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-3xl font-black text-white">{alerts.length}</p>
                                        <p className="text-[10px] font-bold text-red-500 mb-2 uppercase animate-pulse">Pending</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Activity Feed */}
                                <div className="lg:col-span-2 bg-slate-900/50 border-4 border-white/5 p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-3xl -z-10"></div>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                                            <Terminal size={18} className="text-brand-orange" />
                                            Live Ledger
                                        </h3>
                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 border-b border-cyan-400 pb-1">Initialize Full Log</button>
                                    </div>

                                    <div className="space-y-4">
                                        {alerts.map((alert, i) => (
                                            <div key={i} className="flex gap-6 p-6 bg-black/40 border border-white/5 hover:border-white/10 transition-all items-center">
                                                <div className={`w-2 h-12 ${alert.level === 'Critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                    alert.level === 'Warning' ? 'bg-yellow-500' : 'bg-cyan-500'
                                                    }`}></div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${alert.level === 'Critical' ? 'text-red-500' :
                                                            alert.level === 'Warning' ? 'text-yellow-500' : 'text-cyan-500'
                                                            }`}>{alert.level}</span>
                                                        <span className="text-[10px] font-bold text-slate-500">{alert.time}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-300 leading-tight">{alert.msg}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Controls */}
                                <div className="bg-brand-orange p-10 text-white flex flex-col justify-between relative overflow-hidden">
                                    {/* Geometric Patterns */}
                                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-black/10 rotate-45 border-4 border-white/10"></div>
                                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full"></div>

                                    <div className="relative z-10">
                                        <h3 className="text-6xl font-black uppercase tracking-tighter opacity-20 leading-[0.8] mb-12">
                                            SYSTEM<br />COMMAND.
                                        </h3>
                                        <h4 className="text-xl font-black uppercase tracking-tight mb-4">Core Procedures</h4>
                                        <p className="font-bold text-[10px] text-white/60 leading-relaxed uppercase tracking-widest mb-10">
                                            Executing primary overrides and security bypass protocols requires high-level clearance.
                                        </p>
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-3">
                                        <button className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-colors">
                                            Flush Data Cache <Activity size={16} />
                                        </button>
                                        <button className="w-full py-4 bg-white/10 border-2 border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white/20 transition-colors">
                                            Global Reset Protocol <AlertTriangle size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'User Directory' && (
                        <div className="bg-slate-900/50 border-4 border-white/5 p-1">
                            <UserList />
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
