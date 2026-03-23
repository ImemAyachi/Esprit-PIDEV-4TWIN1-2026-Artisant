import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import logo from '../../assets/logo.png';
import {
    LayoutDashboard, Briefcase, ShoppingBag,
    Settings, LogOut, Search, Bell, Menu, X,
    FolderOpen, ClipboardList, Receipt, BarChart2, Shield, ChevronRight, Package,
} from 'lucide-react';
import VoiceAssistant from '../VoiceAssistant';
import { toast } from 'react-hot-toast';


const NAV_BY_ROLE = {
    guest: [
        { name: 'Marketplace', icon: ShoppingBag },
    ],
    artisan: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Marketplace', icon: ShoppingBag },
        { name: 'Projects', icon: Briefcase },
        { name: 'Quotes', icon: ClipboardList },
        { name: 'Orders', icon: Package },
        { name: 'Invoices', icon: Receipt },
        { name: 'Documents', icon: FolderOpen },
        { name: 'Settings', icon: Settings },
    ],
    manufacturer: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Marketplace', icon: ShoppingBag },
        { name: 'Products', icon: Package },
        { name: 'Orders', icon: Package },
        { name: 'Documents', icon: FolderOpen },
        { name: 'Settings', icon: Settings },
    ],
    expert: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Marketplace', icon: ShoppingBag },
        { name: 'Documents', icon: FolderOpen },
        { name: 'Quotes', icon: ClipboardList },
        { name: 'Invoices', icon: Receipt },
        { name: 'Analytics', icon: BarChart2 },
        { name: 'Settings', icon: Settings },
    ],
    admin: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Marketplace', icon: ShoppingBag },
        { name: 'User Mgmt', icon: Shield },
        { name: 'Projects', icon: Briefcase },
        { name: 'Settings', icon: Settings },
    ]
};

export default function DashboardLayout({ children, currentTab, onTabChange }) {
    const { user, logout, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navigation = NAV_BY_ROLE[user?.role] || (isAuthenticated ? NAV_BY_ROLE.artisan : NAV_BY_ROLE.guest);

    return (
        <div className="h-screen w-full bg-brand-cream flex overflow-hidden font-outfit">
            {/* ── Sidebar ── */}
            <aside className={`bg-brand-teal text-white border-r-8 border-brand-teal transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-72' : 'w-20'} shrink-0 z-50`}>
                {/* Logo */}
                <div className="p-6 border-b-4 border-white/10 flex items-center gap-4 h-20 shrink-0">
                    <img src={logo} alt="" className="w-9 h-9 object-contain bg-white shrink-0" />
                    {sidebarOpen && <span className="font-black uppercase tracking-tighter text-xl animate-in">Artisanat</span>}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto no-scrollbar pt-8" aria-label="Main Navigation">
                    {navigation.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                // Default mapped routes for specific tabs
                                if (item.name === 'Marketplace') {
                                    navigate('/marketplace');
                                    return;
                                }
                                if (item.name === 'Orders') {
                                    navigate('/orders/history');
                                    return;
                                }
                                if (item.name === 'Products') {
                                    navigate('/manage-products');
                                    return;
                                }

                                // Internal Tabs routed inside Dashboard
                                if (onTabChange) {
                                    if (location.pathname !== '/dashboard') {
                                        navigate('/dashboard', { state: { tab: item.name } });
                                    } else {
                                        onTabChange(item.name);
                                    }
                                } else {
                                    navigate('/dashboard', { state: { tab: item.name } });
                                }
                            }}
                            aria-label={`Go to ${item.name}`}
                            className={`flex items-center gap-4 p-4 border-2 transition-all group ${currentTab === item.name || (currentTab === 'Marketplace' && item.name === 'Marketplace') || (currentTab === 'Orders' && item.name === 'Orders') || (currentTab === 'Products' && item.name === 'Products')
                                ? 'bg-white text-brand-teal border-white'
                                : 'bg-transparent text-white/60 border-transparent hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <item.icon size={24} className={(currentTab === item.name || (currentTab === 'Marketplace' && item.name === 'Marketplace') || (currentTab === 'Orders' && item.name === 'Orders') || (currentTab === 'Products' && item.name === 'Products')) ? 'text-brand-orange' : ''} aria-hidden="true" />
                            {sidebarOpen && (
                                <span className="font-black uppercase tracking-widest text-[10px] animate-in">{item.name}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User + logout / Login for guests */}
                <div className="p-4 border-t-4 border-white/10 bg-black/10">
                    {isAuthenticated ? (
                        <>
                            {sidebarOpen ? (
                                <div
                                    onClick={() => navigate('/profile')}
                                    className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-white/5 p-2 -m-2 transition-all group/user"
                                >
                                    <div className="w-10 h-10 bg-brand-orange text-white flex items-center justify-center font-black text-sm shrink-0">
                                        {user?.companyName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black uppercase text-[10px] tracking-widest leading-none mb-1 group-hover/user:text-brand-orange transition-colors">{user?.companyName}</p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{user?.role}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-white/20 group-hover/user:text-white/60 group-hover/user:translate-x-0.5 transition-all ml-auto" />
                                </div>
                            ) : (
                                <div className="flex justify-center mb-4">
                                    <div className="w-9 h-9 bg-brand-orange text-white flex items-center justify-center font-black text-sm">
                                        {user?.companyName?.charAt(0)}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className={`w-full flex items-center justify-center gap-2 p-3 bg-white/5 border-2 border-white/20 text-white hover:bg-white hover:text-brand-teal transition-all font-black uppercase text-[9px] tracking-widest ${!sidebarOpen && 'px-0'}`}
                            >
                                <LogOut size={14} />
                                {sidebarOpen && <span>Déconnexion</span>}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className={`w-full flex items-center justify-center gap-2 p-3 bg-brand-orange border-2 border-brand-orange text-white hover:bg-white hover:text-brand-orange transition-all font-black uppercase text-[9px] tracking-widest ${!sidebarOpen && 'px-0'}`}
                        >
                            <LogOut size={14} />
                            {sidebarOpen && <span>Connexion</span>}
                        </button>
                    )}
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-brand-cream">
                {/* Topbar */}
                <header className="h-20 border-b-8 border-brand-teal bg-white px-8 flex items-center justify-between shrink-0 z-40">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
                            className="p-2 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all focus:z-10"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-brand-teal leading-none">{currentTab}</h2>
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal opacity-40 mt-0.5">Espace Opérationnel / Actif</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-brand-cream border-2 border-brand-teal">
                            <Search size={14} className="text-brand-teal/40" />
                            <input
                                type="text"
                                aria-label="Search Workspace"
                                placeholder="EXECUTE SEARCH..."
                                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest w-48 placeholder:text-brand-teal/20"
                            />
                        </div>
                        <button
                            onClick={() => toast('Secure notification relay active: 0 new alerts', { icon: '🔔' })}
                            aria-label="View Notifications"
                            className="relative w-10 h-10 border-4 border-brand-teal flex items-center justify-center text-brand-teal hover:bg-brand-teal hover:text-white transition-all focus:z-10"
                        >

                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-orange"></span>
                        </button>
                    </div>
                </header>

                {/* Main scrollable area */}
                <section className="flex-1 overflow-y-auto w-full custom-scrollbar">
                    {children}
                </section>

                {/* Include global voice assistant everywhere */}
                {isAuthenticated && (
                    <VoiceAssistant onNavigate={(tab) => {
                        if (tab === 'Marketplace') navigate('/marketplace');
                        else if (tab === 'Orders') navigate('/orders/history');
                        else if (tab === 'Products') navigate('/manage-products');
                        else if (onTabChange) onTabChange(tab);
                        else navigate('/dashboard', { state: { tab } });
                    }} role={user?.role} />
                )}
            </main>
        </div>
    );
}
