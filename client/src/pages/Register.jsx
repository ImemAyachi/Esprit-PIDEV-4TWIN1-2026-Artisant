import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Check, Loader2, Hammer, Wrench, Leaf, MoveRight, ScanFace, LockKeyhole, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import FacialRecognitionCapture from '../components/FacialRecognitionCapture';

const roles = [
    { id: 'artisan', label: 'Artisan', icon: Hammer, desc: 'Project site management and labor orchestration.' },
    { id: 'manufacturer', label: 'Manufacturer', icon: Wrench, desc: 'Industrial supply chain and catalog publication.' },
    { id: 'expert', label: 'Expert', icon: Leaf, desc: 'Technical consulting and professional oversight.' },
];

// Step 1: Account details (always required)
// Step 2: Face enrollment (optional)
const STEPS = ['details', 'face'];

const Register = () => {
    const [step, setStep] = useState('details'); // 'details' | 'face'
    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        password: '',
        phone: '',
        role: 'artisan',
    });
    const [faceEmbedding, setFaceEmbedding] = useState(null);
    const [faceEnrolled, setFaceEnrolled] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { register, loading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleRoleSelect = (roleId) => setFormData({ ...formData, role: roleId });

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        setStep('face');
    };

    const handleFaceCapture = (embedding) => {
        setFaceEmbedding(embedding);
        setFaceEnrolled(true);
    };

    const handleFaceReset = () => {
        setFaceEmbedding(null);
        setFaceEnrolled(false);
    };

    const finishRegistration = async (includeFace) => {
        setSubmitting(true);
        const payload = { ...formData };
        if (includeFace && faceEmbedding) {
            payload.faceEmbedding = faceEmbedding;
        }
        const success = await register(payload);
        setSubmitting(false);
        if (success) {
            const role = useAuthStore.getState().user?.role;
            if (role === 'admin') navigate('/admin');
            else navigate('/dashboard');
        }
    };

    return (
        <div className="h-screen w-full flex items-stretch bg-brand-cream overflow-hidden no-scrollbar relative">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-teal/5 transform translate-x-1/2 -translate-y-1/2 -z-10 opacity-20" />

            <div className="w-full flex flex-col lg:flex-row bg-white relative z-10 border-r-8 border-brand-teal overflow-hidden">
                {/* Sidebar */}
                <div className="lg:w-1/3 bg-brand-teal text-white p-12 flex flex-col justify-between shrink-0">
                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-2 mb-16 group">
                            <img src={logo} alt="" className="w-8 h-8 object-contain bg-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:pl-2 transition-all">
                                Artisanat / Home
                            </span>
                        </Link>

                        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-8">
                            Account <br />
                            <span className="text-brand-orange">Protocol</span> <br />
                            Init.
                        </h1>
                        <p className="font-bold text-sm opacity-60 leading-relaxed mb-12">
                            Deploy your professional identity within the global artisan network.
                        </p>

                        {/* Step indicator */}
                        <div className="space-y-3">
                            {[
                                { key: 'details', label: 'Account Details' },
                                { key: 'face', label: 'Face ID (Optional)' },
                            ].map((s, i) => (
                                <div key={s.key} className={`flex items-center gap-3 transition-all ${step === s.key ? 'opacity-100' : 'opacity-40'}`}>
                                    <div className={`w-6 h-6 flex items-center justify-center border-2 font-black text-[10px] transition-all ${step === s.key ? 'bg-brand-orange border-brand-orange text-white' : s.key === 'face' && step === 'face' ? 'bg-brand-orange border-brand-orange text-white' : 'border-white/50 text-white/50'}`}>
                                        {s.key === 'details' && step === 'face' ? <Check size={12} strokeWidth={3} /> : i + 1}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-brand-orange" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Industrial Integrity</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-brand-green" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Global Scale Ready</span>
                        </div>
                    </div>

                    <div className="absolute -bottom-20 -left-20 pointer-events-none select-none opacity-5">
                        <img src={logo} alt="" className="w-[25rem] h-[25rem] object-contain invert grayscale" />
                    </div>
                </div>

                {/* Form Area */}
                <div className="flex-1 p-8 md:p-14 overflow-y-auto no-scrollbar flex flex-col justify-center">
                    <AnimatePresence mode="wait">

                        {/* ── STEP 1: Account Details ── */}
                        {step === 'details' && (
                            <motion.form
                                key="details"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                                onSubmit={handleDetailsSubmit}
                            >
                                {error && (
                                    <div className="bg-brand-orange text-white p-4 font-bold text-xs uppercase tracking-widest border-4 border-brand-teal">
                                        {error}
                                    </div>
                                )}

                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <label className="label">Operational Sector</label>
                                    <div className="grid grid-cols-3 border-4 border-brand-teal">
                                        {roles.map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => handleRoleSelect(role.id)}
                                                className={`p-4 text-left border border-brand-teal/10 transition-all relative ${formData.role === role.id ? 'bg-brand-teal text-white' : 'bg-white hover:bg-slate-50'}`}
                                            >
                                                <div className={`mb-2 ${formData.role === role.id ? 'text-brand-orange' : 'text-brand-teal'}`}>
                                                    <role.icon size={18} />
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-widest mb-0.5">{role.label}</p>
                                                <p className="text-[8px] font-bold opacity-60 leading-tight">{role.desc}</p>
                                                {formData.role === role.id && (
                                                    <div className="absolute top-2 right-2 text-brand-orange">
                                                        <Check size={12} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Input grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Company Designation', name: 'companyName', type: 'text', placeholder: 'Enter company name', required: true },
                                        { label: 'Contact Vector (Phone)', name: 'phone', type: 'tel', placeholder: '+216 -- --- ---', required: true },
                                        { label: 'Operational Email', name: 'email', type: 'email', placeholder: 'name@industry.com', required: true },
                                        { label: 'Security Access Key', name: 'password', type: 'password', placeholder: 'Min. 8 characters', required: true },
                                    ].map((field) => (
                                        <div key={field.name} className="space-y-2">
                                            <label htmlFor={field.name} className="label">{field.label}</label>
                                            <input
                                                id={field.name}
                                                name={field.name}
                                                type={field.type}
                                                required={field.required}
                                                className="input-field border-4 border-brand-teal"
                                                placeholder={field.placeholder}
                                                value={formData[field.name]}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Terms */}
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

                                <button
                                    type="submit"
                                    className="btn-primary w-full py-5 text-base uppercase tracking-[0.2em] border-4 border-brand-teal flex justify-center items-center gap-4 group"
                                >
                                    Continue to Face ID Setup
                                    <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </motion.form>
                        )}

                        {/* ── STEP 2: Face Enrollment ── */}
                        {step === 'face' && (
                            <motion.div
                                key="face"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h3 className="text-3xl font-black text-brand-teal uppercase tracking-tighter mb-1">
                                        Face ID Setup
                                    </h3>
                                    <p className="text-[10px] font-bold text-brand-teal/50 uppercase tracking-widest">
                                        Optional — enroll your face for instant secure login
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-brand-orange text-white p-3 font-bold text-xs uppercase tracking-widest border-4 border-brand-teal">
                                        {error}
                                    </div>
                                )}

                                {!faceEnrolled ? (
                                    <>
                                        {/* Info badges */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { icon: ScanFace, text: 'Face stored as encrypted math vector' },
                                                { icon: LockKeyhole, text: 'Never shared or sent to 3rd parties' },
                                            ].map(({ icon: Icon, text }) => (
                                                <div key={text} className="flex items-start gap-2 bg-brand-teal/5 border-2 border-brand-teal/10 p-3">
                                                    <Icon size={16} className="text-brand-teal shrink-0 mt-0.5" />
                                                    <p className="text-[9px] font-bold text-brand-teal/60 uppercase tracking-wider leading-relaxed">{text}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Camera */}
                                        <div className="border-4 border-brand-teal overflow-hidden mx-auto max-w-sm w-full">
                                            <FacialRecognitionCapture
                                                mode="enroll"
                                                onCapture={handleFaceCapture}
                                                label="Capture Face ID"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    /* Face enrolled confirmation */
                                    <div className="bg-brand-teal/5 border-4 border-brand-teal p-8 text-center space-y-4">
                                        <div className="w-16 h-16 bg-brand-teal text-white flex items-center justify-center mx-auto">
                                            <CheckCircle2 size={36} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-brand-teal uppercase tracking-tighter">Face ID Captured!</h4>
                                            <p className="text-[10px] font-bold text-brand-teal/50 uppercase tracking-widest mt-1">
                                                Your biometric profile is ready to be enrolled.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleFaceReset}
                                            className="text-brand-orange text-[10px] font-black uppercase tracking-widest hover:text-brand-teal transition-colors"
                                        >
                                            Retake
                                        </button>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={submitting || loading}
                                        onClick={() => finishRegistration(true)}
                                        className={`btn-primary w-full py-4 text-[11px] uppercase tracking-[0.2em] border-4 border-brand-teal flex justify-center items-center gap-3 group ${!faceEnrolled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        {(submitting || loading) ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <ScanFace size={18} />
                                                Register with Face ID
                                                <MoveRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={submitting || loading}
                                        onClick={() => finishRegistration(false)}
                                        className="w-full py-4 text-[11px] font-black uppercase tracking-[0.2em] border-2 border-brand-teal/30 text-brand-teal/60 hover:bg-brand-cream hover:border-brand-teal hover:text-brand-teal transition-all flex justify-center items-center gap-3"
                                    >
                                        {(submitting || loading) ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <LockKeyhole size={16} />
                                                Skip — Password Only
                                            </>
                                        )}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep('details')}
                                    className="text-[9px] font-black text-brand-teal/40 uppercase tracking-widest hover:text-brand-teal transition-colors"
                                >
                                    ← Back to account details
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center">
                        <p className="text-xs font-bold text-brand-teal opacity-60 uppercase tracking-widest">
                            Existing Authorization?{' '}
                            <Link to="/login" className="text-brand-orange hover:text-brand-teal transition-colors border-b-2 border-brand-orange pb-0.5">
                                Enter Session
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="absolute top-12 left-12 w-48 h-48 border-8 border-brand-orange -z-10 animate-pulse" />
        </div>
    );
};

export default Register;
