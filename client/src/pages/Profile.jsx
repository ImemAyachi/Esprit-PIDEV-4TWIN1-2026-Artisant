import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Mail,
    Shield,
    Phone,
    Building2,
    Edit3,
    Save,
    X,
    Calendar,
    Image,
    CheckCircle2,
    AlertCircle,
    User
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import logo from '../assets/logo.png';

const Profile = () => {
    const navigate = useNavigate();
    const { user, getMe } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({
        companyName: '',
        phone: '',
        avatarUrl: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                companyName: user.companyName || '',
                phone: user.phone || '',
                avatarUrl: user.avatarUrl || '',
            });
        }
    }, [user]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/auth/me/profile', form);
            await getMe();
            setEditing(false);
            showToast('Profile updated successfully');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        if (user) {
            setForm({
                companyName: user.companyName || '',
                phone: user.phone || '',
                avatarUrl: user.avatarUrl || '',
            });
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-600';
            case 'expert': return 'bg-blue-600';
            case 'manufacturer': return 'bg-purple-600';
            case 'artisan':
            default: return 'bg-brand-orange';
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-cream">
                <div className="animate-spin w-12 h-12 border-4 border-brand-teal border-t-transparent"></div>
            </div>
        );
    }

    const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Unknown';

    const lastUpdated = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Unknown';

    return (
        <div className="min-h-screen bg-brand-cream font-outfit">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 border-2 animate-in ${toast.type === 'success'
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-red-600 text-white border-red-600'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-black uppercase text-[10px] tracking-widest">{toast.message}</span>
                </div>
            )}

            {/* Top Navigation Bar */}
            <header className="h-24 border-b-8 border-brand-teal bg-white px-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="" className="w-10 h-10 object-contain bg-white" />
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-brand-teal leading-none">Operator Profile</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal opacity-40 mt-1">Personnel Database / Active Record</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Edit3 size={16} />
                            <span className="font-black uppercase text-[10px] tracking-widest">Modify Record</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleCancel}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <X size={16} />
                                <span className="font-black uppercase text-[10px] tracking-widest">Discard</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin"></div>
                                ) : (
                                    <Save size={16} />
                                )}
                                <span className="font-black uppercase text-[10px] tracking-widest">
                                    {saving ? 'Processing...' : 'Commit Changes'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto p-12">
                {/* Profile Header Card */}
                <div className="bg-white border-8 border-brand-teal mb-12 relative overflow-hidden group">
                    {/* decorative elements */}
                    <div className="absolute top-0 right-0 w-80 h-full bg-brand-orange transform translate-x-20 -skew-x-12 opacity-5 group-hover:translate-x-10 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange"></div>

                    <div className="p-12 relative z-10 flex flex-col md:flex-row items-start gap-10">
                        {/* avatar */}
                        <div className="relative shrink-0">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.companyName}
                                    className="w-32 h-32 object-cover border-4 border-brand-teal"
                                />
                            ) : (
                                <div className="w-32 h-32 bg-brand-orange text-white flex items-center justify-center font-black text-5xl uppercase border-4 border-brand-teal">
                                    {user.companyName?.charAt(0)}
                                </div>
                            )}
                            <div className={`absolute -bottom-2 -right-2 px-3 py-1 text-white text-[8px] font-black uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                                {user.role}
                            </div>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-4">
                                {user.companyName}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 mb-6">
                                <div className="flex items-center gap-2 text-brand-slate/60">
                                    <Mail size={14} />
                                    <span className="text-xs font-bold">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-brand-slate/60">
                                    <Phone size={14} />
                                    <span className="text-xs font-bold">{user.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-brand-slate/60">
                                    <Calendar size={14} />
                                    <span className="text-xs font-bold">Joined {memberSince}</span>
                                </div>
                                <div className={`flex items-center gap-2 ${user.isActive ? 'text-brand-green' : 'text-red-500'}`}>
                                    <div className={`w-2 h-2 ${user.isActive ? 'bg-brand-green' : 'bg-red-500'} animate-pulse`}></div>
                                    <span className="text-xs font-bold">{user.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editable Fields */}
                <div className="grid md:grid-cols-2 gap-12 mb-12">
                    {/* Company Name */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-teal text-white flex items-center justify-center">
                                <Building2 size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Company Name</h3>
                        </div>
                        {editing ? (
                            <input
                                type="text"
                                value={form.companyName}
                                onChange={(e) => setForm(prev => ({ ...prev, companyName: e.target.value }))}
                                placeholder="Enter company name"
                                className="input-field"
                            />
                        ) : (
                            <p className="text-lg font-bold text-brand-slate/70 flex items-center gap-3">
                                <Building2 size={18} className="text-brand-teal/40" />
                                {user.companyName || '—'}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-orange text-white flex items-center justify-center">
                                <Phone size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Phone Number</h3>
                        </div>
                        {editing ? (
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter phone number"
                                className="input-field"
                            />
                        ) : (
                            <p className="text-lg font-bold text-brand-slate/70 flex items-center gap-3">
                                <Phone size={18} className="text-brand-teal/40" />
                                {user.phone || '—'}
                            </p>
                        )}
                    </div>

                    {/* Email (read-only) */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-green text-white flex items-center justify-center">
                                <Mail size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Email Address</h3>
                        </div>
                        <p className="text-lg font-bold text-brand-slate/70 flex items-center gap-3">
                            <Mail size={18} className="text-brand-teal/40" />
                            {user.email}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/30 mt-3">Read Only</p>
                    </div>

                    {/* Role (read-only) */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-slate text-white flex items-center justify-center">
                                <Shield size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Role</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 text-white text-sm font-black uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                                {user.role}
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/30 mt-3">Read Only</p>
                    </div>

                    {/* Avatar URL */}
                    <div className="card md:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-teal text-white flex items-center justify-center">
                                <Image size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Avatar URL</h3>
                        </div>
                        {editing ? (
                            <div>
                                <input
                                    type="url"
                                    value={form.avatarUrl}
                                    onChange={(e) => setForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                                    placeholder="https://example.com/avatar.png"
                                    className="input-field mb-4"
                                />
                                {form.avatarUrl && (
                                    <div className="flex items-center gap-4 p-4 bg-brand-cream border-2 border-brand-teal/10">
                                        <img
                                            src={form.avatarUrl}
                                            alt="Preview"
                                            className="w-16 h-16 object-cover border-2 border-brand-teal"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">Preview</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-3 break-all">
                                <Image size={18} className="text-brand-teal/40 shrink-0" />
                                {user.avatarUrl || 'No avatar set'}
                            </p>
                        )}
                    </div>
                </div>

                {/* System Info Footer */}
                <div className="bg-brand-teal p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange"></div>
                    <div className="absolute top-8 right-8 text-white opacity-5">
                        <Shield size={120} />
                    </div>

                    <h3 className="text-xl font-black uppercase tracking-tight mb-8">System Metadata</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">User ID</p>
                            <p className="text-xs font-bold text-white/80 break-all">{user._id}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Role</p>
                            <p className="text-xs font-bold text-white/80 capitalize">{user.role}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Status</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 ${user.isActive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                                <p className="text-xs font-bold text-white/80">{user.isActive ? 'Operational' : 'Offline'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Registered</p>
                            <p className="text-xs font-bold text-white/80">{memberSince}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Last Updated</p>
                            <p className="text-xs font-bold text-white/80">{lastUpdated}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email</p>
                            <p className="text-xs font-bold text-white/80">{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
