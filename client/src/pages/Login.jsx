import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Key, Loader2, MoveRight, Hammer, ScanFace, LockKeyhole, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import FacialRecognitionCapture from '../components/FacialRecognitionCapture';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState('password'); // 'password' | 'face'
    const [faceState, setFaceState] = useState('idle'); // 'idle' | 'captured' | 'verifying' | 'success' | 'error'
    const [faceMessage, setFaceMessage] = useState('');
    const [capturedEmbedding, setCapturedEmbedding] = useState(null);
    const { login, loginWithFace, loading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Only hide overflow if needed, but let's allow it for mobile/small screens
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    // Clear error when switching modes
    useEffect(() => { clearError?.(); }, [authMode]);

    const redirectAfterLogin = () => {
        const role = useAuthStore.getState().user?.role;
        if (role === 'admin') navigate('/admin');
        else navigate('/dashboard');
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) redirectAfterLogin();
    };

    // Step 1: camera scan done → store embedding, show submit button
    const handleFaceCapture = (embedding) => {
        setCapturedEmbedding(embedding);
        setFaceState('captured');
        setFaceMessage('');
    };

    // Step 2: user clicks the submit button → call API
    const handleFaceSubmit = async () => {
        if (!email) {
            setFaceState('error');
            setFaceMessage('Please enter your email address first.');
            return;
        }
        if (!capturedEmbedding) return;
        setFaceState('verifying');
        const result = await loginWithFace(email, capturedEmbedding);
        if (result.success) {
            setFaceState('success');
            setTimeout(() => redirectAfterLogin(), 800);
        } else {
            setFaceState('error');
            setFaceMessage(result.message || 'Face not recognized. Try again or use password.');
            setCapturedEmbedding(null);
        }
    };

    const handleFaceReset = () => {
        setCapturedEmbedding(null);
        setFaceState('idle');
        setFaceMessage('');
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row items-stretch bg-brand-cream overflow-x-hidden">
            {/* Visual Side - Hidden on mobile */}
            <div className="hidden lg:flex lg:w-1/2 bg-brand-teal relative items-center justify-center p-20 border-r-8 border-brand-teal">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                    <img src={logo} alt="" className="w-[30rem] h-[30rem] object-contain invert grayscale" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-8">
                        The <br />
                        <span className="text-brand-orange">Platform</span> <br />
                        Standard.
                    </h1>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-brand-orange" />
                        <div className="w-12 h-12 bg-white" />
                        <div className="w-12 h-12 bg-brand-green" />
                    </div>
                </div>
                <div className="absolute top-12 left-12 p-4 bg-white text-brand-teal border-4 border-brand-teal">
                    <Hammer size={40} />
                </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-y-auto custom-scrollbar">
                {/* Mobile Header */}
                <div className="lg:hidden w-full flex justify-center mb-12">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="" className="w-10 h-10 object-contain" />
                        <span className="text-2xl font-black uppercase tracking-tighter text-brand-teal">Artisanat</span>
                    </div>
                </div>

                <div className="max-w-md w-full my-auto">
                    {/* Back link */}
                    <Link to="/" className="inline-flex items-center gap-2 mb-8 group overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal group-hover:pl-2 transition-all">
                            ← Back to landing
                        </span>
                    </Link>

                    <div className="mb-8 text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black text-brand-teal uppercase tracking-tighter mb-2">
                            Secure Access
                        </h2>
                        <p className="font-bold text-brand-teal opacity-60 uppercase text-[9px] md:text-[10px] tracking-[0.2em]">
                            Choose your authentication method
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex border-4 border-brand-teal mb-8">
                        <button
                            type="button"
                            onClick={() => { setAuthMode('password'); setFaceState('idle'); }}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${authMode === 'password' ? 'bg-brand-teal text-white' : 'bg-white text-brand-teal hover:bg-brand-cream'}`}
                        >
                            <LockKeyhole size={14} />
                            Password
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('face'); setFaceState('idle'); }}
                            className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-l-4 border-brand-teal ${authMode === 'face' ? 'bg-brand-teal text-white' : 'bg-white text-brand-teal hover:bg-brand-cream'}`}
                        >
                            <ScanFace size={14} />
                            Face ID
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {authMode === 'password' ? (
                            <motion.form
                                key="password-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                                onSubmit={handlePasswordSubmit}
                            >
                                {error && (
                                    <div className="bg-brand-orange text-white p-4 font-bold text-xs uppercase tracking-widest border-4 border-brand-teal flex items-center gap-2">
                                        <AlertTriangle size={16} />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div>
                                        <label htmlFor="email-pw" className="label">Primary Identifier</label>
                                        <input
                                            id="email-pw"
                                            type="email"
                                            required
                                            className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white placeholder:text-brand-teal/30"
                                            placeholder="name@industry.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative group">
                                        <div className="flex justify-between items-center mb-2">
                                            <label htmlFor="password" className="label mb-0">Security Key</label>
                                            <a href="#" className="text-[9px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal">
                                                Recover Access
                                            </a>
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white placeholder:text-brand-teal/30"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <div className="absolute right-4 top-[42px] text-brand-teal/20 pointer-events-none group-focus-within:text-white/20 transition-colors">
                                            <Key size={18} />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full py-5 text-base uppercase tracking-[0.2em] border-4 border-brand-teal flex justify-center items-center gap-4 group"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            Authenticate Session
                                            <MoveRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="face-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                {/* Email field (required for face login too) */}
                                <div>
                                    <label htmlFor="email-face" className="label">Account Email</label>
                                    <input
                                        id="email-face"
                                        type="email"
                                        required
                                        className="input-field border-4 border-brand-teal focus:bg-brand-teal focus:text-white placeholder:text-brand-teal/30"
                                        placeholder="name@industry.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {!email && (
                                        <p className="text-[9px] font-bold text-brand-orange mt-1 uppercase tracking-widest">
                                            ↑ Enter your email first
                                        </p>
                                    )}
                                </div>

                                {/* Status messages */}
                                {faceState === 'error' && (
                                    <div className="bg-red-500/10 border-2 border-red-500 p-3 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">{faceMessage}</p>
                                    </div>
                                )}
                                {faceState === 'success' && (
                                    <div className="bg-green-500/10 border-2 border-green-500 p-3 flex items-center gap-2">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Identity verified! Redirecting...</p>
                                    </div>
                                )}
                                {faceState === 'verifying' && (
                                    <div className="bg-brand-teal/10 border-2 border-brand-teal p-3 flex items-center gap-2">
                                        <Loader2 size={16} className="text-brand-teal shrink-0 animate-spin" />
                                        <p className="text-xs font-bold text-brand-teal uppercase tracking-wider">Verifying identity with server...</p>
                                    </div>
                                )}

                                {/* Camera */}
                                <div className="border-4 border-brand-teal overflow-hidden mx-auto max-w-sm w-full">
                                    <FacialRecognitionCapture
                                        mode="verify"
                                        onVerify={handleFaceCapture}
                                        label="Scan Face to Login"
                                    />
                                </div>

                                <p className="text-[9px] text-brand-teal/40 text-center uppercase tracking-widest font-bold">
                                    Look directly at the camera. Ensure good lighting.
                                </p>

                                {/* Submit button — appears after face is scanned */}
                                <button
                                    type="button"
                                    onClick={handleFaceSubmit}
                                    disabled={!capturedEmbedding || loading || faceState === 'verifying' || faceState === 'success'}
                                    className="btn-primary w-full py-5 text-base uppercase tracking-[0.2em] border-4 border-brand-teal flex justify-center items-center gap-4 group disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {faceState === 'verifying' ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <ScanFace size={22} />
                                            Authenticate with Face ID
                                            <MoveRight size={22} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-8 border-t-4 border-brand-teal/10">
                        <p className="text-xs font-bold text-brand-teal opacity-60 uppercase tracking-widest leading-loose">
                            New to the Platform? <br />
                            <Link to="/register" className="text-brand-orange hover:text-brand-teal transition-colors border-b-2 border-brand-orange">
                                Initialize your account today
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-orange" />
                <div className="absolute bottom-8 right-8 w-24 h-24 border-8 border-brand-teal" />
            </div>
        </div>
    );
};

export default Login;
