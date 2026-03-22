import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { 
    Trash2, Edit2, Shield, AlertCircle, Search, Filter, 
    UserCheck, UserMinus, UserCog, UserSecret, Activity, 
    MoreVertical, CheckSquare, Square, Download, LogIn, 
    Lock, Unlock, ShieldAlert, History
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showActivity, setShowActivity] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [filterRole]); // Refetch on filter change

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/users?search=${search}&role=${filterRole}`);
            setUsers(response.data.data.users);
            setLoading(false);
        } catch (err) {
            setError('System Access Denied');
            setLoading(false);
            toast.error('Failed to load user database');
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchUsers();
    };

    const toggleSelection = (id) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedUsers.length === users.length) setSelectedUsers([]);
        else setSelectedUsers(users.map(u => u._id));
    };

    const bulkAction = async (action, role = null) => {
        try {
            await api.post('/users/bulk', { userIds: selectedUsers, action, role });
            toast.success(`Bulk Op: ${action} processed`);
            fetchUsers();
            setSelectedUsers([]);
        } catch (err) {
            toast.error('Bulk operation failed');
        }
    };

    const impersonate = async (id, email) => {
        try {
            const response = await api.post(`/users/${id}/impersonate`);
            toast.success(`Switching to user context: ${email}`);
            // In real app: save token, reload page
            console.log('Impersonation payload:', response.data);
        } catch (err) {
            toast.error('Impersonation protocol failed');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.put(`/users/${id}`, { isActive: !currentStatus });
            setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
            toast.success('Identity status updated');
        } catch (err) {
            toast.error('Identity update failed');
        }
    };

    const updateRole = async (id, newRole) => {
        const reason = window.prompt(`PLEASE PROVIDE AUTHORIZATION REASON FOR ELEVATING TO ${newRole.toUpperCase()}:`);
        if (!reason) return;
        
        try {
            await api.put(`/users/${id}/role`, { role: newRole, reason });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            toast.success(`Role elevation to ${newRole} authorized`);
        } catch (err) {
            toast.error('Role elevation failed');
        }
    };

    const handleElevateTmp = async (id, role) => {
        const hours = window.prompt("DURATION (HOURS):", "24");
        if (!hours) return;
        try {
            await api.post(`/users/${id}/elevate`, { role, durationHours: parseInt(hours) });
            toast.success(`Temporary ${role} clearance granted for ${hours}h`);
        } catch (err) {
            toast.error('Temporary elevation failed');
        }
    };

    const exportToCSV = () => {
        const headers = ['Identity', 'Email', 'Phone', 'Role', 'Status', 'Last Login'];
        const rows = users.map(u => [
            u.companyName,
            u.email,
            u.phone,
            u.role,
            u.isActive ? 'Active' : 'Inactive',
            u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `registry_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const deleteUser = async (id) => {
        if (!window.confirm('PROTOCOL WARNING: Confirm permanent identity deletion?')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            toast.success('Identity removed from system');
        } catch (err) {
            toast.error('Deletion protocol failed');
        }
    };

    const fetchActivity = async (id) => {
        try {
            const response = await api.get(`/users/${id}/activity`);
            setShowActivity(response.data.data);
        } catch (err) {
            toast.error('Activity monitoring failed');
        }
    };

    if (error) return (
        <div className="p-12 text-center bg-red-50 border-4 border-red-500">
            <ShieldAlert size={64} className="mx-auto text-red-500 mb-6" />
            <h3 className="text-3xl font-black uppercase text-red-600 mb-2">Access Revoked</h3>
            <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-8">{error}</p>
            <button onClick={fetchUsers} className="bg-red-500 text-white px-8 py-3 font-black uppercase tracking-widest hover:bg-red-600 transition-all">Re-authenticate</button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            {/* Admin Controls Area */}
            <div className="bg-brand-teal text-white p-8 border-l-[12px] border-brand-orange relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-full bg-white/5 transform skew-x-12 translate-x-32 group-hover:translate-x-24 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">Central Registry</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Identity Management Protocol // Level 4 Access</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={exportToCSV} className="bg-white/10 px-6 py-4 backdrop-blur-md hover:bg-white/20 transition-all flex items-center gap-2">
                            <Download size={14} />
                            <span className="text-[10px] font-black uppercase">Export Registry</span>
                        </button>
                        <div className="bg-white/10 px-6 py-4 backdrop-blur-md">
                            <p className="text-[9px] font-black uppercase opacity-60 mb-1">Total Identities</p>
                            <p className="text-2xl font-black">{users.length}</p>
                        </div>
                        <div className="bg-brand-orange px-6 py-4">
                            <p className="text-[9px] font-black uppercase opacity-60 mb-1">Active Nodes</p>
                            <p className="text-2xl font-black">{users.filter(u => u.isActive).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="bg-white border-4 border-brand-teal p-6 flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal opacity-40" size={18} />
                    <input 
                        type="text"
                        placeholder="SEARCH OPERATOR (EMAIL, COMPANY, PHONE)..."
                        className="w-full pl-12 pr-4 py-4 bg-brand-cream border-2 border-transparent focus:border-brand-teal outline-none font-black text-xs uppercase tracking-widest transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full lg:w-64">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-teal opacity-40" size={18} />
                        <select 
                            className="w-full pl-12 pr-4 py-4 bg-brand-cream border-2 border-transparent focus:border-brand-teal outline-none font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <option value="">ALL ROLES</option>
                            <option value="artisan">ARTISAN</option>
                            <option value="manufacturer">MANUFACTURER</option>
                            <option value="expert">EXPERT</option>
                            <option value="admin">ADMIN</option>
                        </select>
                    </div>
                    <button 
                        onClick={fetchUsers}
                        className="bg-brand-teal text-white p-4 hover:bg-brand-orange transition-all group shrink-0"
                    >
                        <Search size={24} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Bulk Actions Floating Bar */}
            {selectedUsers.length > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-brand-teal text-white px-8 py-6 shadow-2xl border-t-4 border-brand-orange flex items-center gap-8 z-50 animate-in slide-in-from-bottom-8">
                    <div className="flex items-center gap-3 pr-8 border-r border-white/20">
                        <CheckSquare className="text-brand-orange" />
                        <span className="font-black text-xs uppercase tracking-widest">{selectedUsers.length} OPERATORS SELECTED</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => bulkAction('activate')} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-all text-[10px] font-black uppercase"><Unlock size={14} /> ACTIVATE</button>
                        <button onClick={() => bulkAction('deactivate')} className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-all text-[10px] font-black uppercase text-red-400"><Lock size={14} /> DEACTIVATE</button>
                        <div className="h-4 w-px bg-white/20 mx-2 self-center"></div>
                        <button onClick={() => bulkAction('assignRole', 'artisan')} className="px-4 py-2 hover:bg-white/10 transition-all text-[10px] font-black uppercase">SET ARTISAN</button>
                        <button onClick={() => bulkAction('assignRole', 'expert')} className="px-4 py-2 hover:bg-white/10 transition-all text-[10px] font-black uppercase">SET EXPERT</button>
                        <button onClick={() => setSelectedUsers([])} className="ml-4 px-4 py-2 bg-white/5 border border-white/20 text-[10px] font-black uppercase tracking-widest">CANCEL</button>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white border-4 border-brand-teal overflow-hidden relative min-h-[500px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 border-8 border-brand-teal border-t-brand-orange animate-spin mb-8"></div>
                        <p className="text-brand-teal font-black uppercase tracking-tight text-2xl">Syncing with Registry...</p>
                        <p className="text-brand-slate opacity-40 text-xs font-bold mt-2">ENCRYPTING CONNECTION LEVEL 4</p>
                    </div>
                )}
                
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-brand-teal text-white">
                            <th className="p-6 w-12">
                                <button onClick={selectAll}>
                                    {selectedUsers.length === users.length ? <CheckSquare size={20} className="text-brand-orange"/> : <Square size={20}/>}
                                </button>
                            </th>
                            <th className="p-6 font-black uppercase tracking-widest text-[10px]">Identité / Contact</th>
                            <th className="p-6 font-black uppercase tracking-widest text-[10px]">Attribution Rôle</th>
                            <th className="p-6 font-black uppercase tracking-widest text-[10px]">Statut Système</th>
                            <th className="p-6 font-black uppercase tracking-widest text-[10px] text-right">Actions Protocolaires</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-brand-teal/5">
                        {users.map((user) => (
                            <tr key={user._id} className={`hover:bg-brand-cream transition-colors group ${selectedUsers.includes(user._id) ? 'bg-brand-cream/50' : ''}`}>
                                <td className="p-6">
                                    <button onClick={() => toggleSelection(user._id)}>
                                        {selectedUsers.includes(user._id) ? <CheckSquare size={20} className="text-brand-teal"/> : <Square size={20} className="text-brand-teal/20" />}
                                    </button>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center font-black text-xl italic border-b-4 border-brand-orange">
                                            {user.companyName?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-black text-lg text-brand-teal uppercase tracking-tighter leading-none mb-1">{user.companyName}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-brand-slate opacity-60">
                                                <MoreVertical size={10} className="text-brand-orange" />
                                                {user.email}
                                                <div className="h-3 w-px bg-brand-teal/20 mx-2"></div>
                                                {user.phone}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={user.role}
                                            onChange={(e) => updateRole(user._id, e.target.value)}
                                            className={`appearance-none bg-transparent border-b-2 font-black text-[10px] py-1 pr-6 uppercase tracking-widest transition-all cursor-pointer focus:outline-none ${
                                                user.role === 'admin' ? 'text-brand-orange border-brand-orange' : 'text-brand-teal border-brand-teal/20'
                                            }`}
                                        >
                                            <option value="artisan">ARTISAN</option>
                                            <option value="manufacturer">MANUFACTURER</option>
                                            <option value="expert">EXPERT</option>
                                            <option value="admin">ADMIN</option>
                                        </select>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <button
                                        onClick={() => toggleStatus(user._id, user.isActive)}
                                        className={`flex items-center gap-3 px-4 py-2 border-2 transition-all ${
                                            user.isActive 
                                                ? 'border-brand-green text-brand-green bg-brand-green/5 hover:bg-brand-green hover:text-white' 
                                                : 'border-red-500 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-current animate-pulse' : 'bg-current'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{user.isActive ? 'OPERATIONAL' : 'DEACTIVATED'}</span>
                                    </button>
                                </td>
                                <td className="p-6">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button 
                                            onClick={() => handleElevateTmp(user._id, 'admin')}
                                            className="p-3 bg-brand-orange text-white hover:bg-black transition-all"
                                            title="PROTOCOL: TEMP ELEVATION"
                                        >
                                            <ShieldAlert size={18} />
                                        </button>
                                        <button 
                                            onClick={() => impersonate(user._id, user.email)}
                                            className="p-3 bg-brand-teal text-white hover:bg-brand-orange transition-all"
                                            title="PROTOCOL: IMPERSONATE"
                                        >
                                            <UserSecret size={18} />
                                        </button>
                                        <button 
                                            onClick={() => fetchActivity(user._id)}
                                            className="p-3 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"
                                            title="MONITOR: ACTIVITY"
                                        >
                                            <Activity size={18} />
                                        </button>
                                        <button 
                                            onClick={() => deleteUser(user._id)}
                                            className="p-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                            title="COMMAND: PURGE"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="p-20 text-center bg-brand-cream/30">
                        <AlertCircle size={48} className="mx-auto text-brand-teal/20 mb-4" />
                        <p className="text-xl font-black uppercase text-brand-teal/40 italic">Registry Entry Empty / No Matches</p>
                    </div>
                )}
            </div>

            {/* Activity Monitor Popover */}
            {showActivity && (
                <div className="fixed inset-0 z-[100] bg-brand-teal/20 backdrop-blur-sm flex items-center justify-end p-12">
                    <div className="w-full max-w-2xl bg-white border-[12px] border-brand-teal h-full flex flex-col shadow-2xl animate-in slide-in-from-right-12">
                        <div className="p-8 border-b-4 border-brand-teal flex justify-between items-center bg-brand-teal text-white">
                            <div className="flex items-center gap-4">
                                <History size={24} className="text-brand-orange" />
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Activity Stream</h3>
                            </div>
                            <button onClick={() => setShowActivity(null)} className="text-brand-orange hover:text-white font-black uppercase text-xs tracking-widest">[ ESC ]</button>
                        </div>
                        <div className="p-8 grid grid-cols-2 gap-4 bg-brand-cream border-b-2 border-brand-teal/10">
                            <div className="bg-white p-4 border-l-4 border-brand-orange">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Last Node Connection</p>
                                <p className="font-bold text-brand-teal">{showActivity.lastIP || 'Unknown'}</p>
                            </div>
                            <div className="bg-white p-4 border-l-4 border-brand-teal">
                                <p className="text-[9px] font-black uppercase opacity-40 mb-1">Session Count</p>
                                <p className="font-bold text-brand-teal">{showActivity.loginCount || 0}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {(showActivity.activity || []).length === 0 ? (
                                <p className="text-center py-20 italic text-brand-teal/30 font-black uppercase text-xs">No protocol activity logged</p>
                            ) : (
                                showActivity.activity.map((log, i) => (
                                    <div key={i} className="flex gap-6 p-4 border-b border-brand-teal/5 hover:bg-brand-cream/50 transition-colors">
                                        <div className="text-[10px] font-black text-brand-orange w-24 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                        <div className="flex-1">
                                            <p className="font-black text-xs text-brand-teal uppercase tracking-widest mb-1">{log.action}</p>
                                            <p className="text-[9px] font-bold text-brand-slate/40 uppercase">Node IP: {log.ip}</p>
                                        </div>
                                        <div className="text-[8px] font-black text-brand-teal/20 uppercase">{new Date(log.timestamp).toLocaleDateString()}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-8 bg-brand-teal text-white flex justify-end gap-4">
                            <button className="flex items-center gap-3 bg-brand-orange px-6 py-3 font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"><Download size={14} /> EXPORT SECTOR DATA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;
