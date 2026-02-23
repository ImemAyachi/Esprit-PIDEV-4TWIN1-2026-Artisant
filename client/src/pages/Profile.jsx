import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Mail,
    Shield,
    Phone,
    MapPin,
    Briefcase,
    Award,
    Clock,
    Globe,
    Linkedin,
    Github,
    Edit3,
    Save,
    X,
    Wrench,
    Calendar,
    Hash,
    ChevronRight,
    CheckCircle2,
    AlertCircle
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
        name: '',
        bio: '',
        phone: '',
        address: { city: '', state: '', country: '', zipCode: '' },
        companyName: '',
        specialty: '',
        experienceYears: '',
        skills: [],
        socialLinks: { website: '', linkedin: '', github: '' },
    });
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                bio: user.profile?.bio || '',
                phone: user.profile?.phone || '',
                address: {
                    city: user.profile?.address?.city || '',
                    state: user.profile?.address?.state || '',
                    country: user.profile?.address?.country || '',
                    zipCode: user.profile?.address?.zipCode || '',
                },
                companyName: user.profile?.companyName || '',
                specialty: user.profile?.specialty || '',
                experienceYears: user.profile?.experienceYears || '',
                skills: user.profile?.skills || [],
                socialLinks: {
                    website: user.profile?.socialLinks?.website || '',
                    linkedin: user.profile?.socialLinks?.linkedin || '',
                    github: user.profile?.socialLinks?.github || '',
                },
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
            await api.put('/auth/me/profile', {
                ...form,
                experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
            });
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
        // Reset form from user data
        if (user) {
            setForm({
                name: user.name || '',
                bio: user.profile?.bio || '',
                phone: user.profile?.phone || '',
                address: {
                    city: user.profile?.address?.city || '',
                    state: user.profile?.address?.state || '',
                    country: user.profile?.address?.country || '',
                    zipCode: user.profile?.address?.zipCode || '',
                },
                companyName: user.profile?.companyName || '',
                specialty: user.profile?.specialty || '',
                experienceYears: user.profile?.experienceYears || '',
                skills: user.profile?.skills || [],
                socialLinks: {
                    website: user.profile?.socialLinks?.website || '',
                    linkedin: user.profile?.socialLinks?.linkedin || '',
                    github: user.profile?.socialLinks?.github || '',
                },
            });
        }
    };

    const addSkill = () => {
        if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
            setForm(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const removeSkill = (skill) => {
        setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Admin': return 'bg-red-600';
            case 'Expert': return 'bg-blue-600';
            case 'Manufacturer': return 'bg-purple-600';
            case 'Artisan':
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
            <div className="max-w-7xl mx-auto p-12">
                {/* Profile Header Card */}
                <div className="bg-white border-8 border-brand-teal mb-12 relative overflow-hidden group">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-80 h-full bg-brand-orange transform translate-x-20 -skew-x-12 opacity-5 group-hover:translate-x-10 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange"></div>

                    <div className="p-12 relative z-10 flex flex-col md:flex-row items-start gap-10">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-32 h-32 bg-brand-orange text-white flex items-center justify-center font-black text-5xl uppercase border-4 border-brand-teal">
                                {user.name?.charAt(0)}
                            </div>
                            <div className={`absolute -bottom-2 -right-2 px-3 py-1 text-white text-[8px] font-black uppercase tracking-widest ${getRoleBadgeColor(user.role)}`}>
                                {user.role}
                            </div>
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                            {editing ? (
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="text-4xl font-black uppercase tracking-tighter text-brand-teal bg-transparent border-b-4 border-brand-teal/20 focus:border-brand-orange outline-none pb-2 w-full mb-4 transition-colors"
                                />
                            ) : (
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-4">
                                    {user.name}
                                </h1>
                            )}

                            <div className="flex flex-wrap items-center gap-6 mb-6">
                                <div className="flex items-center gap-2 text-brand-slate/60">
                                    <Mail size={14} />
                                    <span className="text-xs font-bold">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-brand-slate/60">
                                    <Calendar size={14} />
                                    <span className="text-xs font-bold">Joined {memberSince}</span>
                                </div>
                                <div className="flex items-center gap-2 text-brand-slate/60">
                                    <Shield size={14} />
                                    <span className="text-xs font-bold">{user.role} Clearance</span>
                                </div>
                                {user.isActive !== undefined && (
                                    <div className={`flex items-center gap-2 ${user.isActive ? 'text-brand-green' : 'text-red-500'}`}>
                                        <div className={`w-2 h-2 ${user.isActive ? 'bg-brand-green' : 'bg-red-500'} animate-pulse`}></div>
                                        <span className="text-xs font-bold">{user.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                )}
                            </div>

                            {/* Bio */}
                            {editing ? (
                                <textarea
                                    value={form.bio}
                                    onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Write your bio here..."
                                    rows={3}
                                    className="input-field w-full resize-none"
                                />
                            ) : (
                                <p className="font-bold text-sm text-brand-slate/50 leading-relaxed max-w-2xl">
                                    {user.profile?.bio || 'No bio information available. Click "Modify Record" to add your bio.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Sections Grid */}
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-teal text-white flex items-center justify-center">
                                <Phone size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Contact Intel</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="label">Phone Number</label>
                                {editing ? (
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Enter phone number"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                        <Phone size={14} className="text-brand-teal/40" />
                                        {user.profile?.phone || '—'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="label">Email Address</label>
                                <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                    <Mail size={14} className="text-brand-teal/40" />
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-orange text-white flex items-center justify-center">
                                <MapPin size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Location Data</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="label">City</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={form.address.city}
                                        onChange={(e) => setForm(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                                        placeholder="City"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70">{user.profile?.address?.city || '—'}</p>
                                )}
                            </div>
                            <div>
                                <label className="label">State</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={form.address.state}
                                        onChange={(e) => setForm(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                                        placeholder="State"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70">{user.profile?.address?.state || '—'}</p>
                                )}
                            </div>
                            <div>
                                <label className="label">Country</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={form.address.country}
                                        onChange={(e) => setForm(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))}
                                        placeholder="Country"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70">{user.profile?.address?.country || '—'}</p>
                                )}
                            </div>
                            <div>
                                <label className="label">Zip Code</label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={form.address.zipCode}
                                        onChange={(e) => setForm(prev => ({ ...prev, address: { ...prev.address, zipCode: e.target.value } }))}
                                        placeholder="Zip Code"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70">{user.profile?.address?.zipCode || '—'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-green text-white flex items-center justify-center">
                                <Briefcase size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Professional Data</h3>
                        </div>

                        <div className="space-y-6">
                            {(user.role === 'Manufacturer' || editing) && (
                                <div>
                                    <label className="label">Company Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={form.companyName}
                                            onChange={(e) => setForm(prev => ({ ...prev, companyName: e.target.value }))}
                                            placeholder="Company name"
                                            className="input-field"
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                            <Briefcase size={14} className="text-brand-teal/40" />
                                            {user.profile?.companyName || '—'}
                                        </p>
                                    )}
                                </div>
                            )}

                            {(user.role === 'Expert' || editing) && (
                                <div>
                                    <label className="label">Specialty</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={form.specialty}
                                            onChange={(e) => setForm(prev => ({ ...prev, specialty: e.target.value }))}
                                            placeholder="Your specialty"
                                            className="input-field"
                                        />
                                    ) : (
                                        <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                            <Award size={14} className="text-brand-teal/40" />
                                            {user.profile?.specialty || '—'}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="label">Experience (Years)</label>
                                {editing ? (
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.experienceYears}
                                        onChange={(e) => setForm(prev => ({ ...prev, experienceYears: e.target.value }))}
                                        placeholder="Years of experience"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                        <Clock size={14} className="text-brand-teal/40" />
                                        {user.profile?.experienceYears ? `${user.profile.experienceYears} years` : '—'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-slate text-white flex items-center justify-center">
                                <Globe size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Network Links</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="label">Website</label>
                                {editing ? (
                                    <input
                                        type="url"
                                        value={form.socialLinks.website}
                                        onChange={(e) => setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, website: e.target.value } }))}
                                        placeholder="https://your-website.com"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                        <Globe size={14} className="text-brand-teal/40" />
                                        {user.profile?.socialLinks?.website ? (
                                            <a href={user.profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
                                                {user.profile.socialLinks.website}
                                            </a>
                                        ) : '—'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="label">LinkedIn</label>
                                {editing ? (
                                    <input
                                        type="url"
                                        value={form.socialLinks.linkedin}
                                        onChange={(e) => setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))}
                                        placeholder="https://linkedin.com/in/username"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                        <Linkedin size={14} className="text-brand-teal/40" />
                                        {user.profile?.socialLinks?.linkedin ? (
                                            <a href={user.profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
                                                {user.profile.socialLinks.linkedin}
                                            </a>
                                        ) : '—'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="label">GitHub</label>
                                {editing ? (
                                    <input
                                        type="url"
                                        value={form.socialLinks.github}
                                        onChange={(e) => setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, github: e.target.value } }))}
                                        placeholder="https://github.com/username"
                                        className="input-field"
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-brand-slate/70 flex items-center gap-2">
                                        <Github size={14} className="text-brand-teal/40" />
                                        {user.profile?.socialLinks?.github ? (
                                            <a href={user.profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
                                                {user.profile.socialLinks.github}
                                            </a>
                                        ) : '—'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Skills - Full Width */}
                    <div className="card lg:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-brand-teal text-white flex items-center justify-center">
                                <Wrench size={18} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-brand-teal">Skill Matrix</h3>
                        </div>

                        {editing && (
                            <div className="flex gap-3 mb-6">
                                <input
                                    type="text"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                                    placeholder="Add a new skill..."
                                    className="input-field flex-1"
                                />
                                <button onClick={addSkill} className="btn-primary">
                                    Add
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {form.skills.length > 0 ? (
                                form.skills.map((skill, i) => (
                                    <div
                                        key={i}
                                        className="px-4 py-2 bg-brand-cream border-2 border-brand-teal/20 text-brand-teal font-black uppercase text-[10px] tracking-widest flex items-center gap-2 group hover:border-brand-teal transition-colors"
                                    >
                                        <Hash size={12} className="text-brand-orange" />
                                        {skill}
                                        {editing && (
                                            <button onClick={() => removeSkill(skill)} className="ml-1 text-brand-teal/30 hover:text-red-500 transition-colors">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm font-bold text-brand-slate/40">
                                    {editing ? 'Add skills using the input above' : 'No skills registered yet'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* System Info - Full Width */}
                    <div className="lg:col-span-2 bg-brand-teal p-12 text-white relative overflow-hidden">
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
                                <p className="text-xs font-bold text-white/80">{user.role}</p>
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
                            {user.permissions && user.permissions.length > 0 && (
                                <div className="col-span-2 md:col-span-4 mt-4 pt-6 border-t border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Access Permissions</p>
                                    <div className="flex flex-wrap gap-2">
                                        {user.permissions.map((perm, i) => (
                                            <span key={i} className="px-3 py-1 bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest">
                                                {perm}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
