import React, { useState } from 'react';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    ShoppingBag,
    Users,
    Settings,
    LogOut,
    Search,
    Bell,
    Menu,
    X,
    TrendingUp,
    Clock,
    Plus,
    Hammer,
    ArrowUpRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';

const Dashboard = () => {
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    const navigation = [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Projects', icon: Briefcase },
        { name: 'Invoices', icon: FileText },
        { name: 'Marketplace', icon: ShoppingBag },
        { name: 'Network', icon: Users },
        { name: 'Preferences', icon: Settings },
    ];

    const stats = [
        { label: 'Active Sites', value: '12', trend: '+2', color: 'brand-teal' },
        { label: 'Verified Quote', value: '$42k', trend: '+12%', color: 'brand-orange' },
        { label: 'Global Rank', value: '#142', trend: '-5', color: 'brand-green' },
    ];

    return (
        <div className="h-screen w-full bg-brand-cream flex overflow-hidden font-outfit">
            {/* Sidebar */}
            <aside
                className={`bg-brand-teal text-white border-r-8 border-brand-teal transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-80' : 'w-24'
                    }`}
            >
                {/* Brand Header */}
                <div className="p-8 border-b-4 border-white/10 flex items-center gap-4 h-24 shrink-0">
                    <img src={logo} alt="" className="w-10 h-10 object-contain bg-white" />
                    {sidebarOpen && (
                        <span className="font-black uppercase tracking-tighter text-2xl animate-in">Artisanat</span>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto no-scrollbar pt-8">
                    {navigation.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`flex items-center gap-4 p-4 border-2 transition-all group ${activeTab === item.name
                                ? 'bg-white text-brand-teal border-white'
                                : 'bg-transparent text-white/60 border-transparent hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <item.icon size={24} className={activeTab === item.name ? 'text-brand-orange' : ''} />
                            {sidebarOpen && (
                                <span className="font-black uppercase tracking-widest text-xs animate-in">
                                    {item.name}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Context */}
                <div className="p-6 border-t-4 border-white/10 bg-black/10">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-brand-orange text-white flex items-center justify-center font-black animate-in">
                                {(user?.companyName || user?.email)?.charAt(0).toUpperCase()}
                            </div>
                            <div className="animate-in">
                                <p className="font-black uppercase text-[10px] tracking-widest leading-none mb-1 truncate max-w-[150px]">{user?.companyName || 'Operator'}</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">{user?.role}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-6">
                            <div className="w-10 h-10 bg-brand-orange text-white flex items-center justify-center font-black">
                                {(user?.companyName || user?.email)?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className={`w-full flex items-center justify-center gap-2 p-3 bg-white/5 border-2 border-white/20 text-white hover:bg-white hover:text-brand-teal transition-all font-black uppercase text-[10px] tracking-widest ${!sidebarOpen && 'px-0'}`}
                    >
                        <LogOut size={16} />
                        {sidebarOpen && <span>Terminal Log</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Topbar */}
                <header className="h-24 border-b-8 border-brand-teal bg-white px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-brand-teal leading-none">{activeTab}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal opacity-40 mt-1">Operational Environment / Active</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-cream border-2 border-brand-teal">
                            <Search size={16} className="text-brand-teal/40" />
                            <input
                                type="text"
                                placeholder="EXECUTE SEARCH..."
                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-48 placeholder:text-brand-teal/20"
                            />
                        </div>
                        <button className="relative w-12 h-12 border-4 border-brand-teal flex items-center justify-center text-brand-teal hover:bg-brand-teal hover:text-white transition-all">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-orange"></span>
                        </button>
                    </div>
                </header>

                {/* Content Scroller */}
                <section className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    {/* Welcome Banner */}
                    <div className="mb-12 bg-white border-8 border-brand-teal p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-full bg-brand-orange transform translate-x-12 -skew-x-12 opacity-10 group-hover:translate-x-4 transition-transform duration-700"></div>
                        <div className="relative z-10">
                            <h3 className="text-5xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-4">
                                Welcome back,<br />
                                <span className="text-brand-orange">Operator {user?.companyName || user?.email?.split('@')[0]}</span>
                            </h3>
                            <p className="max-w-xl font-bold text-sm text-brand-slate opacity-60 leading-relaxed mb-8">
                                Your current workspace is optimized for the <span className="text-brand-teal">{user?.role}</span> module.
                                All industrial systems are operational and ready for deployment.
                            </p>
                            <button className="btn-primary flex items-center gap-3">
                                Initialize New Site <Plus size={20} />
                            </button>
                        </div>
                        <div className="absolute bottom-8 right-8 text-brand-teal opacity-10">
                            <Hammer size={120} />
                        </div>
                    </div>,

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-brand-teal mb-12">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white p-8 border border-brand-teal/10 flex flex-col justify-between hover:bg-brand-cream transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="label leading-none">{stat.label}</p>
                                    <span className={`px-2 py-1 bg-${stat.color} text-white text-[8px] font-black uppercase tracking-widest`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <p className="text-4xl font-black text-brand-teal">{stat.value}</p>
                                    <ArrowUpRight className="text-brand-teal opacity-10 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" size={32} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Secondary Grid */}
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Activity Ledger */}
                        <div className="card h-full min-h-[400px]">
                            <div className="flex justify-between items-center mb-10">
                                <h4 className="text-xl font-black uppercase tracking-tight text-brand-teal">System Ledger</h4>
                                <button className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal">View Logs</button>
                            </div>
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex gap-6 p-4 border-2 border-transparent hover:border-brand-teal/10 hover:bg-brand-cream transition-all group cursor-pointer">
                                        <div className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase text-xs text-brand-teal mb-1">Project Sync Completed</p>
                                            <p className="text-[10px] font-bold text-brand-slate opacity-40 leading-tight">Site-Alpha deployment verified by controller.</p>
                                        </div>
                                        <div className="ml-auto text-[8px] font-black text-brand-teal/20 uppercase group-hover:text-brand-teal transition-colors pt-1">
                                            2h / ago
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Creative Box */}
                        <div className="bg-brand-teal p-12 text-white relative flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange"></div>
                            <div className="relative z-10 text-6xl font-black uppercase tracking-tighter opacity-10 leading-none mb-12">
                                Industrial<br />Standard.
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black uppercase tracking-tight mb-4">Network Protocols</h4>
                                <p className="font-bold text-sm text-white/50 leading-relaxed max-w-xs mb-8">
                                    Expand your operational reach by connecting with verified experts and manufacturers.
                                </p>
                                <button className="btn-outline-white w-full flex items-center justify-center gap-3">
                                    Explore Ecosystem <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

const ArrowRight = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

export default Dashboard;
