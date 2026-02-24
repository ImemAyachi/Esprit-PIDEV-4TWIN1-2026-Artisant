import React from 'react';
import { Link } from 'react-router-dom';
import { Hammer, Wrench, Leaf, Shield, ArrowRight, Zap, Globe, Users } from 'lucide-react';
import logo from '../assets/logo.png';

const Landing = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-none border-b-4 border-brand-teal px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Artisanat Logo" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-black uppercase tracking-tighter text-brand-teal">Artisanat</span>
                </div>
                <div className="hidden md:flex gap-8">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#platform" className="nav-link">Platform</a>
                    <a href="#ecosystem" className="nav-link">Ecosystem</a>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="nav-link pt-2.5">Login</Link>
                    <Link to="/register" className="btn-primary py-2 px-4 text-xs">Join Industry</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-40 pb-20 px-8 bg-pattern overflow-hidden border-b-4 border-brand-teal">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="animate-in" style={{ animationDelay: '0.1s' }}>
                        <div className="inline-block px-4 py-1 bg-brand-orange text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                            Next Gen Industry OS
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-brand-teal uppercase leading-[0.9] tracking-tighter mb-8">
                            Crafting The <br />
                            <span className="text-brand-orange">Digital</span> <br />
                            Standard.
                        </h1>
                        <p className="text-lg text-brand-slate font-bold max-w-lg mb-10 leading-relaxed">
                            The comprehensive platform for modern artisans, manufacturers, and experts.
                            Build, manage, and scale your industrial footprint with precision.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/register" className="btn-primary text-base px-8 py-4 flex items-center gap-3">
                                Start Your Project <ArrowRight size={20} />
                            </Link>
                            <Link to="/login" className="btn-secondary text-base px-8 py-4">
                                Documentation
                            </Link>
                        </div>
                    </div>

                    <div className="relative animate-in" style={{ animationDelay: '0.3s' }}>
                        {/* Creative Flat Illustration Element */}
                        <div className="aspect-square bg-brand-teal p-1 border-4 border-brand-teal flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-white opacity-5"></div>
                            <div className="grid grid-cols-2 gap-1 w-full h-full">
                                <div className="bg-brand-orange"></div>
                                <div className="bg-brand-green"></div>
                                <div className="bg-white col-span-2 p-12 flex flex-col justify-end">
                                    <div className="text-6xl font-black text-brand-teal border-b-8 border-brand-teal pb-4">01</div>
                                    <div className="text-sm font-black uppercase tracking-widest mt-4">Precision Engine</div>
                                </div>
                            </div>
                            {/* Floating Icons */}
                            <div className="absolute top-8 left-8 bg-brand-slate text-white p-4">
                                <Hammer size={32} />
                            </div>
                            <div className="absolute bottom-12 right-12 bg-white text-brand-teal p-4 border-4 border-brand-teal">
                                <Leaf size={32} />
                            </div>
                        </div>
                        {/* Decorative Squares */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 border-4 border-brand-orange -z-10"></div>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-brand-green/20 -z-10"></div>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-24 px-8 border-b-4 border-brand-teal">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black uppercase tracking-tighter border-b-8 border-brand-teal inline-block pb-2">
                            Infrastructure Components
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-0 border-4 border-brand-teal">
                        {[
                            { title: 'Project Core', icon: Hammer, desc: 'Centralized workspace for site management and real-time coordination.' },
                            { title: 'Global Catalog', icon: Globe, desc: 'Direct access to verified manufacturer product streams and inventory.' },
                            { title: 'Expert Network', icon: Users, desc: 'Consult with high-tier technical specialists across all industrial sectors.' },
                            { title: 'Secure Ledger', icon: Shield, desc: 'Professional invoicing and financial tracking with institutional integrity.' },
                            { title: 'Fast Execution', icon: Zap, desc: 'Streamlined workflows designed for rapid scale and delivery.' },
                            { title: 'Sustainability', icon: Leaf, desc: 'Eco-conscious orchestration focused on long-term resource efficiency.' }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                tabIndex="0"
                                aria-label={`${feature.title}: ${feature.desc}`}
                                className="p-10 border border-brand-teal/20 hover:bg-brand-teal hover:text-white transition-all group flex flex-col items-start gap-6 cursor-pointer focus:z-10"
                            >
                                <div className="p-3 bg-brand-teal text-white group-hover:bg-white group-hover:text-brand-teal transition-colors">
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight">{feature.title}</h3>
                                <p className="font-bold text-sm opacity-70 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Stats */}
            <section id="platform" className="bg-brand-teal py-20 px-8 text-white text-center">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
                    <div>
                        <div className="text-5xl font-black mb-2">2.4k</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Artisans</div>
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-2">180+</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Manufacturers</div>
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-2">12k</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Completed Projects</div>
                    </div>
                    <div>
                        <div className="text-5xl font-black mb-2">$42M</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Transaction Volume</div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-8 bg-brand-orange text-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
                        Ready to Build the Future?
                    </h2>
                    <p className="text-xl font-bold mb-12 opacity-90 italic">
                        The Artisanat ecosystem is waiting for your expertise.
                        Deploy your workspace today.
                    </p>
                    <div className="flex flex-center justify-center gap-6">
                        <Link to="/register" className="btn-outline-white text-lg px-12 py-5 uppercase tracking-widest border-4">
                            Establish Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-brand-slate text-white py-12 px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white text-brand-slate flex items-center justify-center font-black">A</div>
                        <span className="text-2xl font-black uppercase tracking-tighter">Artisanat</span>
                    </div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                        Precision Engineering &copy; 2026 / All Rights Reserved
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-brand-orange">Twitter</a>
                        <a href="#" className="hover:text-brand-orange">LinkedIn</a>
                        <a href="#" className="hover:text-brand-orange">Github</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
