import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Mail, Shield, Phone, Building2, Edit3, Save, X, 
    Calendar, Image, CheckCircle2, AlertCircle, User, Lock, 
    Unlock, Info, Trash2, Download, 
    Smartphone, Monitor, Laptop, Globe, LogOut, Check, RefreshCw,
    MapPin, Briefcase, Award, History, Layout, Command, Key
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import toast from 'react-hot-toast';

const PERMISSION_MATRIX = {
    admin: ['Full Registry Access', 'Role Modification', 'System Configuration', 'Audit Log Viewing', 'Impersonation clearance'],
    expert: ['Document Management', 'Technical Sheets', 'Consultation History', 'Project Overseer'],
    manufacturer: ['Product Management', 'Stock Calibration', 'Order Processing'],
    artisan: ['Project Creation', 'Quote Generation', 'Document Consultation']
};

const Profile = () => {
    const navigate = useNavigate();
    const { user, getMe, toggle2FA, getSessions, deleteSession, deleteAccount, verifyEmail } = useAuthStore();
    
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [form, setForm] = useState({
        companyName: '',
        phone: '',
        avatarUrl: '',
        address: { street: '', city: '', state: '', zipCode: '', country: '' },
        professionalDetails: { specialization: '', bio: '', yearsOfExperience: 0, certifications: [] }
    });

    useEffect(() => {
        if (user) {
            setForm({
                companyName: user.companyName || '',
                phone: user.phone || '',
                avatarUrl: user.avatarUrl || '',
                address: user.address || { street: '', city: '', state: '', zipCode: '', country: '' },
                professionalDetails: user.professionalDetails || { specialization: '', bio: '', yearsOfExperience: 0, certifications: [] }
            });
            fetchSessions();
        }
    }, [user]);

    const fetchSessions = async () => {
        const res = await getSessions();
        setSessions(res || []);
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await useAuthStore.getState().updateProfile(form);
        if (res.success) {
            setEditing(false);
            toast.success('Identity node updated');
        } else {
            toast.error(res.message);
        }
        setSaving(false);
    };

    const handleVerifyEmail = async () => {
        const res = await verifyEmail(otp);
        if (res.success) {
            toast.success('Email validated');
            setShowOtpInput(false);
        } else {
            toast.error(res.message);
        }
    };

    const handleToggle2FA = async () => {
        const res = await toggle2FA();
        if (res.success) {
            toast.success(`2FA ${res.data.enabled ? 'Enabled' : 'Disabled'}`);
            if (res.data.enabled) {
                alert(`IMPORTANT: Your 2FA Secret is ${res.data.secret}. Store it safely!`);
            }
        }
    };

    const handleLogoutSession = async (sid) => {
        const success = await deleteSession(sid);
        if (success) {
            setSessions(sessions.filter(s => s._id !== sid));
            toast.success('Node disconnected');
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('CRITICAL: Permanent identity purge initiated. Proceed?')) {
            const success = await deleteAccount();
            if (success) {
                toast.success('Identity purged');
                navigate('/login');
            }
        }
    };

    const calculateCompletion = () => {
        let score = 0;
        if (user?.companyName) score += 10;
        if (user?.phone) score += 10;
        if (user?.avatarUrl) score += 10;
        if (user?.isEmailVerified) score += 10;
        if (user?.hasFaceAuth) score += 10;
        if (user?.address?.street) score += 20;
        if (user?.professionalDetails?.specialization) score += 30;
        return score;
    };

    if (!user) return <div className="p-20 text-center text-brand-teal font-black uppercase">Synchronizing...</div>;

    const completion = calculateCompletion();
    const permissions = PERMISSION_MATRIX[user.role] || [];

    return (
        <DashboardLayout currentTab="Profile">
            <div className="font-outfit pb-20 animate-in fade-in duration-500">
                {/* Header Strip */}
                <div className="bg-white border-b-8 border-brand-teal px-4 md:px-8 py-4 md:py-6 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-brand-teal">Personnel Node</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">Identity Management // Level 4 Authorization</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        {!editing ? (
                            <button onClick={() => setEditing(true)} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-brand-teal text-white font-black"><Edit3 size={16} /> MODIFY RECORD</button>
                        ) : (
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => setEditing(false)} className="px-4 py-3 border-2 border-brand-teal text-brand-teal font-black shrink-0"><X size={16} /></button>
                                <button onClick={handleSave} className="flex-1 px-8 py-3 bg-brand-orange text-white font-black flex items-center justify-center gap-2"><Save size={16} /> <span className="hidden sm:inline">COMMIT PROTOCOL</span><span className="sm:hidden">SAVE</span></button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
                    {/* Top Row: Core Info & Completion */}
                    <div className="grid lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
                        <div className="lg:col-span-3 bg-white border-8 border-brand-teal p-6 md:p-12 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-48 h-1 bg-brand-orange animate-pulse"></div>
                           <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
                               <div className="relative shrink-0">
                                   {user.avatarUrl ? (
                                       <img src={user.avatarUrl} className="w-32 h-32 md:w-48 md:h-48 object-cover border-4 border-brand-teal" alt="Avatar" />
                                   ) : (
                                       <div className="w-32 h-32 md:w-48 md:h-48 bg-brand-orange text-white flex items-center justify-center font-black text-5xl md:text-7xl border-4 border-brand-teal uppercase">
                                           {user.companyName?.[0]}
                                       </div>
                                   )}
                                   <div className="absolute -bottom-3 -right-3 bg-brand-teal text-white px-4 py-2 font-black uppercase text-[10px] tracking-widest border-2 md:border-0 border-white md:border-transparent">{user.role}</div>
                               </div>
                               <div className="flex-1 w-full text-center md:text-left">
                                   <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-4 mb-2">
                                       <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-brand-teal leading-none text-balance">{user.companyName}</h1>
                                       {user.isEmailVerified && <CheckCircle2 size={24} className="text-brand-green hidden md:block" />}
                                   </div>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-10 text-left">
                                       <div className="space-y-4">
                                           <div className="group/item">
                                               <p className="text-[10px] font-black uppercase text-brand-teal/40 mb-1">Electronic Mail</p>
                                               <p className="font-bold text-lg text-brand-teal">{user.email}</p>
                                           </div>
                                           <div>
                                               <p className="text-[10px] font-black uppercase text-brand-teal/40 mb-1">Communication</p>
                                               <p className="font-bold text-lg text-brand-teal">{user.phone || 'DISCONNECTED'}</p>
                                           </div>
                                       </div>
                                       <div className="space-y-4">
                                           <div>
                                               <p className="text-[10px] font-black uppercase text-brand-teal/40 mb-1">Operations Base</p>
                                               <p className="font-bold text-lg text-brand-teal">{user.address?.city || 'NOT SET'}, {user.address?.country || 'GLOBAL'}</p>
                                           </div>
                                           <div>
                                               <p className="text-[10px] font-black uppercase text-brand-teal/40 mb-1">Operational Role</p>
                                               <p className="font-bold text-lg text-brand-teal">{user.professionalDetails?.specialization || 'GENERALIST'}</p>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                        </div>

                        <div className="bg-brand-teal text-white p-10 flex flex-col justify-between border-b-[20px] border-brand-orange">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Integrity Status</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Profile Index</p>
                            </div>
                            <div className="py-8">
                                <div className="text-7xl font-black tracking-tighter leading-none">{completion}%</div>
                                <div className="w-full h-4 bg-white/10 mt-6 relative overflow-hidden">
                                    <div className="h-full bg-brand-orange transition-all duration-1000" style={{ width: `${completion}%` }}></div>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-white/50 leading-relaxed uppercase">
                                {completion < 100 ? 'PROTOCOL: Information gaps detected. Update details to reach peak security.' : 'SYSTEM: All systems nominal. Peak integrity reached.'}
                            </p>
                        </div>
                    </div>

                    {/* Permission Matrix & Forms */}
                    <div className="grid lg:grid-cols-5 gap-12 items-start">
                        {/* Visual Permission Matrix */}
                        <div className="lg:col-span-2 bg-brand-cream border-8 border-brand-teal p-10 space-y-8">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-brand-teal flex items-center gap-3"><Key className="text-brand-orange" /> Access Matrix</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40 mt-1">Authorized Protocol Mapping</p>
                            </div>
                            <div className="space-y-4">
                                {permissions.map((perm, i) => (
                                    <div key={i} className="flex items-center gap-4 bg-white p-4 border-2 border-brand-teal/10 group hover:border-brand-teal transition-all">
                                        <div className="w-2 h-2 bg-brand-orange group-hover:scale-150 transition-transform"></div>
                                        <p className="font-black text-xs uppercase tracking-widest text-brand-teal">{perm}</p>
                                    </div>
                                ))}
                                <div className="pt-6 border-t-2 border-brand-teal/10">
                                    <p className="text-[9px] font-bold text-brand-teal/40 uppercase">Inherited Clearance: GUEST → {user.role.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Edit Forms or Display */}
                        <div className="lg:col-span-3 space-y-12">
                            {/* Personal & Address Node */}
                            <div className="card space-y-10 group relative">
                                <h3 className="text-xl font-black uppercase tracking-tight text-brand-teal flex items-center gap-3"><MapPin className="text-brand-orange" /> Geography & Contact</h3>
                                
                                {editing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">Street Protocol</label>
                                            <input className="input-field" value={form.address.street} onChange={(e) => setForm({...form, address: {...form.address, street: e.target.value}})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">City Node</label>
                                            <input className="input-field" value={form.address.city} onChange={(e) => setForm({...form, address: {...form.address, city: e.target.value}})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">State/Province</label>
                                            <input className="input-field" value={form.address.state} onChange={(e) => setForm({...form, address: {...form.address, state: e.target.value}})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">Country Network</label>
                                            <input className="input-field" value={form.address.country} onChange={(e) => setForm({...form, address: {...form.address, country: e.target.value}})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">Zip/Postal</label>
                                            <input className="input-field" value={form.address.zipCode} onChange={(e) => setForm({...form, address: {...form.address, zipCode: e.target.value}})} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-brand-cream/30 p-8 border-2 border-transparent hover:border-brand-teal/10 transition-all">
                                        <div>
                                            <p className="text-[9px] font-black uppercase opacity-40 mb-1">Postal Address</p>
                                            <p className="font-bold text-brand-teal uppercase">{form.address.street || 'EMPTY'}</p>
                                            <p className="font-bold text-brand-teal uppercase">{form.address.city || 'EMPTY'}, {form.address.state || 'EMPTY'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase opacity-40 mb-1">Global Region</p>
                                            <p className="font-bold text-brand-teal uppercase">{form.address.country || 'GLOBAL NETWORK'}</p>
                                            <p className="font-bold text-brand-teal uppercase">{form.address.zipCode || '—'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Professional Details Node */}
                            <div className="card space-y-10 group relative">
                                <h3 className="text-xl font-black uppercase tracking-tight text-brand-teal flex items-center gap-3"><Briefcase className="text-brand-orange" /> Operational Sector</h3>
                                
                                {editing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">Specialization</label>
                                            <input className="input-field" value={form.professionalDetails.specialization} onChange={(e) => setForm({...form, professionalDetails: {...form.professionalDetails, specialization: e.target.value}})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">Experience (Years)</label>
                                            <input type="number" className="input-field" value={form.professionalDetails.yearsOfExperience} onChange={(e) => setForm({...form, professionalDetails: {...form.professionalDetails, yearsOfExperience: e.target.value}})} />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase opacity-40">Operational Bio</label>
                                            <textarea className="input-field h-32 resize-none" value={form.professionalDetails.bio} onChange={(e) => setForm({...form, professionalDetails: {...form.professionalDetails, bio: e.target.value}})} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-brand-teal/5 p-8 border-l-8 border-brand-orange">
                                        <div className="flex justify-between items-center mb-6">
                                            <p className="font-black text-xl uppercase tracking-widest text-brand-teal">{form.professionalDetails.specialization || 'GENERAL OPERATIVE'}</p>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black uppercase opacity-40">Clearance Years</p>
                                                <p className="font-black text-2xl text-brand-orange">{form.professionalDetails.yearsOfExperience}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-brand-slate/60 leading-relaxed italic">"{form.professionalDetails.bio || 'Initial system calibration complete. Biometric bio-string pending update.'}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Security Hub & Operational Logs */}
                    <div className="grid md:grid-cols-2 gap-12 my-12">
                        <div className="card space-y-8">
                            <h3 className="text-xl font-black uppercase tracking-tight text-brand-teal flex items-center gap-3"><Shield className="text-brand-orange" /> Security Protocols</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-6 bg-brand-cream border-l-4 border-brand-teal">
                                    <div>
                                        <p className="font-black text-xs uppercase tracking-widest text-brand-teal">Contact Validation</p>
                                        <p className="text-[9px] font-bold text-brand-slate/40">{user.isEmailVerified ? 'VALIDATED' : 'ACTION REQUIRED'}</p>
                                    </div>
                                    {!user.isEmailVerified && !showOtpInput && (
                                        <button onClick={() => setShowOtpInput(true)} className="px-5 py-3 bg-brand-teal text-white text-[10px] font-black uppercase">Start Validation</button>
                                    )}
                                </div>
                                {showOtpInput && (
                                    <div className="flex gap-2 p-6 bg-brand-teal text-white animate-in slide-in-from-top-2">
                                        <input type="text" placeholder="ENTER OTP" className="bg-white/10 p-3 text-xs font-black uppercase w-full outline-none" value={otp} onChange={(e) => setOtp(e.target.value)} />
                                        <button onClick={handleVerifyEmail} className="bg-brand-orange px-6 font-black"><Check size={18}/></button>
                                    </div>
                                )}
                                <div className="flex justify-between items-center p-6 bg-brand-cream border-l-4 border-brand-orange">
                                    <div>
                                        <p className="font-black text-xs uppercase tracking-widest text-brand-teal">Identity Lock (2FA)</p>
                                        <p className="text-[9px] font-bold text-brand-slate/40">{user.twoFactorEnabled ? 'ENCRYPTED' : 'UNSECURED'}</p>
                                    </div>
                                    <button onClick={handleToggle2FA} className={`px-5 py-3 text-[10px] font-black uppercase ${user.twoFactorEnabled ? 'bg-red-500 text-white' : 'bg-brand-teal text-white'}`}>{user.twoFactorEnabled ? 'DEACTIVATE' : 'ENCRYPT'}</button>
                                </div>
                            </div>
                        </div>

                        <div className="card space-y-8">
                            <h3 className="text-xl font-black uppercase tracking-tight text-brand-teal flex items-center gap-3"><History className="text-brand-orange" /> Execution Logs</h3>
                            <div className="space-y-4">
                                {(user.activityLog || []).slice(-5).reverse().map((log, i) => (
                                    <div key={i} className="flex gap-4 items-center p-4 bg-brand-cream/30 hover:bg-brand-cream transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-brand-teal"></div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase text-brand-teal">{log.action}</p>
                                            <p className="text-[8px] font-bold text-brand-slate/30 uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Hardware Nodes */}
                    <div className="card mb-12">
                        <h3 className="text-xl font-black uppercase tracking-tight text-brand-teal flex items-center gap-3 mb-10"><Monitor className="text-brand-orange" /> Operational Nodes (Sessions)</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {sessions.map((session, i) => (
                                <div key={session._id || i} className="flex items-center gap-6 p-6 border-2 border-brand-teal/5 bg-brand-cream/20 group hover:border-brand-teal transition-all">
                                    <div className="w-14 h-14 bg-white flex items-center justify-center text-brand-teal border-2 border-brand-teal/10">
                                        {session.device.toLowerCase().includes('mobile') ? <Smartphone size={28} /> : <Laptop size={28} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-xs uppercase tracking-widest text-brand-teal">{session.device.split('(')[0]}</p>
                                            {session.isCurrent && <span className="text-[8px] font-black bg-brand-green text-white px-2 py-0.5">CURRENT</span>}
                                        </div>
                                        <p className="text-[10px] font-bold text-brand-slate/40 uppercase mt-1">IP: {session.ip} // ACTIVE: {new Date(session.lastActive).toLocaleTimeString()}</p>
                                    </div>
                                    {!session.isCurrent && (
                                        <button onClick={() => handleLogoutSession(session._id)} className="p-3 text-brand-slate/20 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data Control Center */}
                    <div className="flex flex-col md:flex-row gap-12 justify-between items-center border-t-8 border-brand-teal pt-12 mt-12">
                        <div className="space-y-2">
                            <h4 className="text-lg font-black uppercase text-brand-teal">Identity Archival</h4>
                            <p className="text-[10px] font-bold text-brand-slate/40 uppercase">Download all associated data strings</p>
                            <button className="flex items-center gap-3 px-8 py-3 bg-brand-teal text-white font-black uppercase text-xs hover:bg-black transition-all mt-4"><Download size={16}/> EXPORT SYSTEM RECORD</button>
                        </div>
                        <div className="text-right space-y-2">
                            <h4 className="text-lg font-black uppercase text-red-500">Node Termination</h4>
                            <p className="text-[10px] font-bold text-brand-slate/40 uppercase">Irreversible identity purge protocol</p>
                            <button onClick={handleDeleteAccount} className="flex items-center gap-3 px-8 py-3 border-2 border-red-500 text-red-500 font-black uppercase text-xs hover:bg-red-500 hover:text-white transition-all mt-4"><Trash2 size={16}/> PURGE IDENTITY</button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
