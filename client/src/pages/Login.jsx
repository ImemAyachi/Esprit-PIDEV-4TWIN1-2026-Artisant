import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Key, Loader2, Sparkles, MoveRight, Hammer } from 'lucide-react';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="h-screen flex items-stretch bg-brand-cream overflow-hidden">
            {/* Visual Side */}
            <div className="hidden lg:flex w-1/2 bg-brand-teal relative items-center justify-center p-20 border-r-8 border-brand-teal">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                    <img src={logo} alt="" className="w-[30rem] h-[30rem] object-contain invert grayscale" />
                </div>

                <div className="relative z-10 animate-in">
                    <h1 className="text-8xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-8">
                        The <br />
                        <span className="text-brand-orange">Platform</span> <br />
                        Standard.
                    </h1>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-brand-orange"></div>
                        <div className="w-12 h-12 bg-white"></div>
                        <div className="w-12 h-12 bg-brand-green"></div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-12 left-12 p-4 bg-white text-brand-teal border-4 border-brand-teal">
                    <Hammer size={40} />
                </div>
            </div>

            {/* Form Side */}
            <div className="flex-1 flex items-center justify-center p-8 md:p-12 relative overflow-hidden">
                <div className="max-w-md w-full animate-in">
                    <div className="mb-12">
                        <Link to="/" className="inline-flex items-center gap-2 mb-8 group overflow-hidden">
                            <img src={logo} alt="" className="w-8 h-8 object-contain" />
                            <span className="text-xs font-black uppercase tracking-widest text-brand-teal group-hover:pl-2 transition-all">Back to overview</span>
                        </Link>

                        <h2 className="text-5xl font-black text-brand-teal uppercase tracking-tighter mb-2">
                            Secure Access
                        </h2>
                        <p className="font-bold text-brand-teal opacity-60 uppercase text-[10px] tracking-[0.2em]">
                            Enter your operational credentials
                        </p>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-brand-orange text-white p-4 font-bold text-xs uppercase tracking-widest border-4 border-brand-teal">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="relative group">
                                <label htmlFor="email" className="label">Primary Identifier</label>
                                <input
                                    id="email"
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
                                    <a href="#" className="text-[9px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal">Recover Access</a>
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

                        <div className="pt-4">
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
                        </div>
                    </form>

                    <div className="mt-12 pt-12 border-t-4 border-brand-teal/10">
                        <p className="text-xs font-bold text-brand-teal opacity-60 uppercase tracking-widest leading-loose">
                            New to the Platform? <br />
                            <Link to="/register" className="text-brand-orange hover:text-brand-teal transition-colors border-b-2 border-brand-orange">
                                Initialize your account today
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Corner Decoration */}
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-orange"></div>
                <div className="absolute bottom-8 right-8 w-24 h-24 border-8 border-brand-teal"></div>
            </div>
        </div>
    );
};

export default Login;
