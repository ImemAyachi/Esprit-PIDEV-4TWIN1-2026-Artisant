import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Check, Loader2, Hammer, Wrench, Leaf, MoveRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';

import FacialRecognitionCapture from '../components/FacialRecognitionCapture';

const roles = [
    { id: 'artisan', label: 'Artisan', icon: Hammer, desc: 'Project site management and labor orchestration.' },
    { id: 'manufacturer', label: 'Manufacturer', icon: Wrench, desc: 'Industrial supply chain and catalog publication.' },
    { id: 'expert', label: 'Expert', icon: Leaf, desc: 'Technical consulting and professional oversight.' },
];

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        phoneNumber: '',
        email: '',
        password: '',
        role: 'artisan',
        facialFingerprint: null,
    });
    const { register, loading, error } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (step === 1) {
            // Basic email validation before proceeding
            const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
            if (!emailRegex.test(formData.email)) {
                alert("Please provide a valid operational email format.");
                return;
            }
            setStep(2);
            return;
        }

        const success = await register(formData);
        if (success) {
            navigate('/dashboard');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (roleId) => {
        setFormData({ ...formData, role: roleId });
    };

    const handleFaceCaptured = (descriptor) => {
        setFormData({ ...formData, facialFingerprint: Array.from(descriptor) });
        // Auto submit if face captured? Or let user click finish.
    };

    return (
        <div className="h-screen w-full flex items-stretch bg-brand-cream overflow-hidden no-scrollbar relative">
            {/* Background Texture Elements */}
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-teal/5 transform translate-x-1/2 -translate-y-1/2 -z-10 bg-pattern opacity-20"></div>

            <div className="w-full flex flex-col lg:flex-row gap-0 bg-white animate-in relative z-10 border-r-8 border-brand-teal">
                {/* Information Sidebar */}
                <div className="lg:w-1/3 bg-brand-teal text-white p-12 flex flex-col justify-between overflow-hidden">
                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-2 mb-16 group">
                            <img src={logo} alt="" className="w-8 h-8 object-contain bg-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:pl-2 transition-all">Artisanat / Home</span>
                        </Link>

                        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-8">
                            Account <br />
                            <span className="text-brand-orange">Protocol</span> <br />
                            {step === 1 ? 'Step 01' : 'Step 02'}
                        </h1>
                        <p className="font-bold text-sm opacity-60 leading-relaxed mb-12">
                            {step === 1
                                ? 'Deploy your professional identity within the global artisan network.'
                                : 'Initialize your biometric signature for high-security industrial access.'}
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 ${step >= 1 ? 'bg-brand-orange' : 'bg-white/20'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">01: Operational Context</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 ${step >= 2 ? 'bg-brand-orange' : 'bg-white/20'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">02: Biometric Sync</span>
                        </div>
                    </div>

                    {/* Background Logo Mark */}
                    <div className="absolute -bottom-20 -left-20 pointer-events-none select-none opacity-5">
                        <img src={logo} alt="" className="w-[25rem] h-[25rem] object-contain invert grayscale" />
                    </div>
                </div>

                {/* Form Area */}
                <div className="flex-1 p-8 md:p-16 overflow-hidden no-scrollbar flex flex-col justify-center">
                    {error && (
                        <div className="mb-8 bg-brand-orange text-white p-4 font-bold text-xs uppercase tracking-widest border-4 border-brand-teal animate-in fade-in slide-in-from-top-4">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form className="space-y-10" onSubmit={handleSubmit}>
                            {/* Role Selection */}
                            <div className="space-y-4">
                                <label className="label">Operational Sector</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-brand-teal">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => handleRoleSelect(role.id)}
                                            className={`p-6 text-left border border-brand-teal/10 transition-all group relative ${formData.role === role.id
                                                ? 'bg-brand-teal text-white'
                                                : 'bg-white hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`mb-4 ${formData.role === role.id ? 'text-brand-orange' : 'text-brand-teal'}`}>
                                                <role.icon size={24} />
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-widest mb-2">{role.label}</p>
                                            <p className="text-[9px] font-bold opacity-60 leading-tight group-hover:opacity-100 transition-opacity">
                                                {role.desc}
                                            </p>
                                            {formData.role === role.id && (
                                                <div className="absolute top-4 right-4 text-brand-orange">
                                                    <Check size={16} strokeWidth={4} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Input Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="companyName" className="label">Company / Entity Name</label>
                                    <input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        required
                                        className="input-field border-4 border-brand-teal"
                                        placeholder="e.g. Atlas Forge Industrial"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phoneNumber" className="label">Primary Phone Contact</label>
                                    <input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        required
                                        className="input-field border-4 border-brand-teal"
                                        placeholder="+216 -- --- ---"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="label">Operational Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="input-field border-4 border-brand-teal"
                                        placeholder="auth@industry.tech"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="label">Security Access Key</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="input-field border-4 border-brand-teal"
                                        placeholder="Min. 8 characters professional grade"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    required
                                    className="w-5 h-5 bg-white border-4 border-brand-teal rounded-none appearance-none checked:bg-brand-orange transition-all cursor-pointer relative after:content-['✓'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-white after:font-bold after:opacity-0 checked:after:opacity-100"
                                />
                                <label htmlFor="terms" className="text-[10px] font-black text-brand-teal uppercase tracking-widest cursor-pointer">
                                    Accept Industry Protocol & Terms
                                </label>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    className="btn-primary w-full py-5 text-base uppercase tracking-[0.2em] border-4 border-brand-teal flex justify-center items-center gap-4 group"
                                >
                                    Next Phase: Biometrics
                                    <MoveRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black uppercase tracking-widest text-brand-teal italic">
                                    Face Recognition <span className="text-brand-orange">Calibration</span>
                                </h3>
                                <p className="text-[10px] font-bold text-brand-teal uppercase tracking-widest opacity-60">
                                    Please align your face within the scanner frame. High environmental lighting is recommended for optimal fingerprint generation.
                                </p>
                            </div>

                            <div className="aspect-video bg-slate-900 border-8 border-brand-teal relative overflow-hidden group">
                                <FacialRecognitionCapture onCapture={handleFaceCaptured} />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 border-4 border-brand-teal text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                                >
                                    Modify Data
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.facialFingerprint}
                                    className="flex-[2] btn-primary py-4 border-4 border-brand-teal flex justify-center items-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Finalize Registration'}
                                    <Check size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-12 text-center">
                        <p className="text-xs font-bold text-brand-teal opacity-60 uppercase tracking-widest">
                            Existing Authorization? {' '}
                            <Link to="/login" className="text-brand-orange hover:text-brand-teal transition-colors border-b-2 border-brand-orange pb-0.5">
                                Enter Session
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Square Decoration */}
            <div className={`absolute top-12 left-12 w-48 h-48 border-8 border-brand-orange -z-10 transition-all duration-1000 ${step === 2 ? 'rotate-45 scale-150' : ''}`}></div>
        </div>
    );
};

export default Register;
