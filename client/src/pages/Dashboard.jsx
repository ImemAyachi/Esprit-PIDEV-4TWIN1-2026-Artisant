import React, { useState } from 'react';
import {
    LayoutDashboard, Briefcase, ShoppingBag,
    Settings, LogOut, Search, Bell, Menu, X, Clock,
    Plus, Hammer, ArrowUpRight, Package, Wrench,
    Leaf, FolderOpen, ClipboardList,
    Receipt, BarChart2, Eye, Download, CheckCircle2,
    AlertCircle, ChevronRight, Tag, ShieldCheck, Pencil,
    FileText, Users, Shield, FolderPlus, ArrowRight
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import UserList from '../components/dashboard/UserList';
import DocumentLibrary from '../components/dashboard/DocumentLibrary';
import ProjectList from '../components/dashboard/ProjectList';
import ProjectCreation from '../components/dashboard/ProjectCreation';
import VoiceAssistant from '../components/VoiceAssistant';
import EditProjectModal from '../components/dashboard/EditProjectModal';


const NAV_BY_ROLE = {
    artisan: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Projects', icon: Briefcase },
        { name: 'Quotes', icon: ClipboardList },
        { name: 'Orders', icon: ShoppingBag },
        { name: 'Invoices', icon: Receipt },
        { name: 'Settings', icon: Settings },
    ],
    manufacturer: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Products', icon: Package },
        { name: 'Orders', icon: ShoppingBag },
        { name: 'Documents', icon: FolderOpen },
        { name: 'Settings', icon: Settings },
    ],
    expert: [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Documents', icon: FolderOpen },
        { name: 'Quotes', icon: ClipboardList },
        { name: 'Invoices', icon: Receipt },
        { name: 'Access Logs', icon: BarChart2 },
        { name: 'Settings', icon: Settings },
    ],
};


const PROJECTS = [
    {
        id: 1,
        name: 'Site Alpha – Renovation',
        status: 'In Progress',
        client: 'ACME Corp',
        description: 'Rénovation complète du bâtiment A incluant la plomberie, l\'électricité et la finition des murs intérieurs.',
        address: '12 Rue de la République',
        city: 'Tunis',
        startDate: '2026-01-15',
        endDate: '2026-04-30',
        budget: 45000,
    },
    {
        id: 2,
        name: 'Site Beta – Foundation',
        status: 'Planned',
        client: 'BuildX',
        description: 'Travaux de fondation et de terrassement pour le nouveau complexe résidentiel de 6 étages.',
        address: '8 Avenue Habib Bourguiba',
        city: 'Sfax',
        startDate: '2026-02-01',
        endDate: '2026-05-15',
        budget: 28500,
    },
    {
        id: 3,
        name: 'Site Gamma – Finishing',
        status: 'Completed',
        client: 'UrbanPlan',
        description: 'Finitions intérieures : carrelage, peinture, menuiserie et installation sanitaire.',
        address: '45 Rue Ibn Khaldoun',
        city: 'Sousse',
        startDate: '2025-11-01',
        endDate: '2026-01-05',
        budget: 12000,
    },
];

const QUOTES = [
    { id: 1, ref: 'DEV-0041', project: 'Site Alpha', client: 'ACME Corp', total: 14200, status: 'accepté', date: '2026-01-10' },
    { id: 2, ref: 'DEV-0042', project: 'Site Beta', client: 'BuildX', total: 8950, status: 'envoyé', date: '2026-02-03' },
    { id: 3, ref: 'DEV-0043', project: 'Site Gamma', client: 'UrbanPlan', total: 3300, status: 'refusé', date: '2026-01-20' },
];

const ORDERS = [
    { id: 1, ref: 'CMD-2201', product: 'Ciment CEM II 50kg', qty: 120, status: 'en_attente', fabricant: 'MatBuild', date: '2026-02-10' },
    { id: 2, ref: 'CMD-2202', product: 'Acier B500B 12mm', qty: 60, status: 'livré', fabricant: 'SteelPro', date: '2026-01-28' },
    { id: 3, ref: 'CMD-2203', product: 'Carrelage 60x60', qty: 400, status: 'confirmé', fabricant: 'TileWorld', date: '2026-02-14' },
];

const INVOICES = [
    { id: 1, ref: 'FAC-1001', quote: 'DEV-0041', client: 'ACME Corp', total: 14200, paid: 10000, status: 'payé', date: '2026-01-25' },
    { id: 2, ref: 'FAC-1002', quote: 'DEV-0042', client: 'BuildX', total: 8950, paid: 0, status: 'en_attente', date: '2026-02-05' },
];

const PRODUCTS = [
    { id: 1, name: 'Ciment CEM II 50kg', category: 'Matériaux', stock: 340, price: 12.5, status: 'disponible' },
    { id: 2, name: 'Acier B500B 12mm', category: 'Métaux', stock: 80, price: 3.8, status: 'disponible' },
    { id: 3, name: 'Carrelage 60x60', category: 'Revêtement', stock: 0, price: 22.0, status: 'rupture' },
    { id: 4, name: 'Isolant Laine Roche', category: 'Isolation', stock: 200, price: 8.9, status: 'disponible' },
];

const ACCESS_LOGS = [
    { id: 1, type: 'Reconnaissance Faciale', user: 'Artisan Hassan', result: 'succès', ts: '2026-02-24 00:12' },
    { id: 2, type: 'Vote IA', user: 'Admin System', result: 'succès', ts: '2026-02-23 22:07' },
    { id: 3, type: 'Génération Texte IA', user: 'Expert Amira', result: 'succès', ts: '2026-02-23 18:43' },
    { id: 4, type: 'Prédiction IA', user: 'Artisan Khalil', result: 'échec', ts: '2026-02-23 14:30' },
];

/* ─────────────────────────────────────────────
   Shared badge
───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const map = {
        // French statuses
        en_cours: 'bg-blue-100 text-blue-700',
        planifié: 'bg-yellow-100 text-yellow-700',
        terminé: 'bg-green-100 text-green-700',
        accepté: 'bg-green-100 text-green-700',
        envoyé: 'bg-blue-100 text-blue-700',
        refusé: 'bg-red-100 text-red-700',
        en_attente: 'bg-yellow-100 text-yellow-700',
        livré: 'bg-green-100 text-green-700',
        confirmé: 'bg-teal-100 text-teal-700',
        payé: 'bg-green-100 text-green-700',
        succès: 'bg-green-100 text-green-700',
        échec: 'bg-red-100 text-red-700',
        disponible: 'bg-green-100 text-green-700',
        rupture: 'bg-red-100 text-red-700',
        // English statuses (from Project model)
        'In Progress': 'bg-blue-100 text-blue-700',
        'Planned': 'bg-yellow-100 text-yellow-700',
        'Completed': 'bg-green-100 text-green-700',
        'Archived': 'bg-gray-100 text-gray-500',
    };
    return (
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-sm ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

/* ─────────────────────────────────────────────
   Tab panels
───────────────────────────────────────────── */

/* OVERVIEW – shown to all */
const OverviewPanel = ({ user }) => {
    const roleLabels = { artisan: 'Artisan', manufacturer: 'Fabricant', expert: 'Expert Technique' };
    const roleIcons = { artisan: Hammer, manufacturer: Wrench, expert: Leaf };
    const RoleIcon = roleIcons[user?.role] || Hammer;

    const roleStats = {
        artisan: [{ label: 'Projets actifs', value: '3', trend: '+1' }, { label: 'Devis envoyés', value: '2', trend: '+2' }, { label: 'Commandes', value: '3', trend: '0' }],
        manufacturer: [{ label: 'Produits catalogue', value: '4', trend: '+1' }, { label: 'Commandes reçues', value: '3', trend: '+2' }, { label: 'Rupture stock', value: '1', trend: '-' }],
        expert: [{ label: 'Documents consultés', value: '12', trend: '+4' }, { label: 'Devis examinés', value: '3', trend: '+1' }, { label: 'Logs accessibilité', value: '4', trend: '0' }],
    };
    const stats = roleStats[user?.role] || roleStats.artisan;

    return (
        <>
            {/* Welcome banner */}
            <div className="mb-10 bg-white border-8 border-brand-teal p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-full bg-brand-orange transform translate-x-12 -skew-x-12 opacity-10 group-hover:translate-x-4 transition-transform duration-700" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-brand-teal/10 border-2 border-brand-teal flex items-center justify-center text-brand-teal">
                            <RoleIcon size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-teal/50">{roleLabels[user?.role]}</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-3">
                        Bienvenue, <span className="text-brand-orange">{user?.companyName}</span>
                    </h3>
                    <p className="font-bold text-sm text-brand-slate opacity-60 leading-relaxed max-w-lg">
                        Votre espace de travail est configuré pour le module <span className="text-brand-teal font-black">{roleLabels[user?.role]}</span>.
                        Tous les systèmes sont opérationnels.
                    </p>
                </div>
                <div className="absolute bottom-6 right-8 text-brand-teal opacity-10"><RoleIcon size={100} /></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-brand-teal mb-10">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-8 border border-brand-teal/10 flex flex-col justify-between hover:bg-brand-cream transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="label leading-none">{s.label}</p>
                            <span className="px-2 py-1 bg-brand-teal text-white text-[8px] font-black uppercase tracking-widest">{s.trend}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-4xl font-black text-brand-teal">{s.value}</p>
                            <ArrowUpRight className="text-brand-teal opacity-10 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" size={32} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent activity */}
            <div className="card">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl font-black uppercase tracking-tight text-brand-teal">Activité Récente</h4>
                    <button className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal">Voir tout</button>
                </div>
                <div className="space-y-4">
                    {[
                        'Projet "Site Alpha" mis à jour',
                        'Devis DEV-0042 envoyé au client BuildX',
                        'Commande CMD-2202 marquée comme livrée',
                    ].map((msg, i) => (
                        <div key={i} className="flex gap-4 p-4 border-2 border-transparent hover:border-brand-teal/10 hover:bg-brand-cream transition-all group cursor-pointer">
                            <div className="w-10 h-10 bg-brand-teal text-white flex items-center justify-center shrink-0"><Clock size={16} /></div>
                            <div className="flex-1">
                                <p className="font-black uppercase text-xs text-brand-teal mb-0.5">{msg}</p>
                                <p className="text-[10px] font-bold text-brand-slate opacity-40">Il y a {i + 1}h</p>
                            </div>
                            <ChevronRight size={16} className="self-center text-brand-teal/20 group-hover:text-brand-teal transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

/* PROJECTS – artisan only */
const ProjectsPanel = () => {
    const [editProject, setEditProject] = useState(null);

    const handleSave = (updated) => {
        // TODO: call your API here to persist changes
        console.log('Project updated:', updated);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal">Mes Projets</h3>
                    <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Créés et gérés par vous</p>
                </div>
                <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Nouveau Projet</button>
            </div>
            <div className="space-y-0 border-4 border-brand-teal">
                <div className="grid grid-cols-5 bg-brand-teal text-white p-4">
                    {['Nom du Projet', 'Client', 'Date', 'Statut', 'Actions'].map(h => (
                        <p key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</p>
                    ))}
                </div>
                {PROJECTS.map((p, i) => (
                    <div key={p.id} className={`grid grid-cols-5 p-4 border-b border-brand-teal/10 hover:bg-brand-cream transition-colors items-center ${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream/40'}`}>
                        <p className="font-black text-xs text-brand-teal">{p.name}</p>
                        <p className="text-xs font-bold text-brand-slate/60">{p.client}</p>
                        <p className="text-xs font-bold text-brand-slate/60">{p.startDate}</p>
                        <StatusBadge status={p.status} />
                        <div className="flex gap-2">
                            <button
                                title="Voir"
                                className="p-1.5 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all">
                                <Eye size={12} />
                            </button>
                            <button
                                title="Modifier"
                                onClick={() => setEditProject(p)}
                                className="p-1.5 border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-all">
                                <Pencil size={12} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit slide-in panel */}
            {editProject && (
                <EditProjectModal
                    project={editProject}
                    onClose={() => setEditProject(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

/* QUOTES – artisan + expert */
const QuotesPanel = ({ role }) => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal">Devis</h3>
                <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">
                    {role === 'artisan' ? 'Devis générés pour vos projets' : 'Devis consultés en tant qu\'expert'}
                </p>
            </div>
            {role === 'artisan' && (
                <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Nouveau Devis</button>
            )}
        </div>
        <div className="space-y-0 border-4 border-brand-teal">
            <div className="grid grid-cols-6 bg-brand-teal text-white p-4">
                {['Référence', 'Projet', 'Client', 'Total (DT)', 'Statut', 'Actions'].map(h => (
                    <p key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</p>
                ))}
            </div>
            {QUOTES.map((q, i) => (
                <div key={q.id} className={`grid grid-cols-6 p-4 border-b border-brand-teal/10 hover:bg-brand-cream transition-colors items-center ${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream/40'}`}>
                    <p className="font-black text-xs text-brand-orange">{q.ref}</p>
                    <p className="text-xs font-bold text-brand-teal">{q.project}</p>
                    <p className="text-xs font-bold text-brand-slate/60">{q.client}</p>
                    <p className="text-xs font-black text-brand-teal">{q.total.toLocaleString()} DT</p>
                    <StatusBadge status={q.status} />
                    <div className="flex gap-2">
                        <button className="p-1.5 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"><Eye size={12} /></button>
                        {role === 'artisan' && (
                            <button className="p-1.5 border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-white transition-all"><Download size={12} /></button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/* ORDERS – artisan (place) + manufacturer (process) */
const OrdersPanel = ({ role }) => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal">Commandes</h3>
                <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">
                    {role === 'artisan' ? 'Commandes que vous avez passées' : 'Commandes à traiter / livrer'}
                </p>
            </div>
            {role === 'artisan' && (
                <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Passer Commande</button>
            )}
        </div>
        <div className="space-y-0 border-4 border-brand-teal">
            <div className="grid grid-cols-6 bg-brand-teal text-white p-4">
                {['Réf.', 'Produit', 'Qté', role === 'artisan' ? 'Fabricant' : 'Artisan', 'Statut', 'Actions'].map(h => (
                    <p key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</p>
                ))}
            </div>
            {ORDERS.map((o, i) => (
                <div key={o.id} className={`grid grid-cols-6 p-4 border-b border-brand-teal/10 hover:bg-brand-cream transition-colors items-center ${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream/40'}`}>
                    <p className="font-black text-xs text-brand-orange">{o.ref}</p>
                    <p className="text-xs font-bold text-brand-teal">{o.product}</p>
                    <p className="text-xs font-bold text-brand-slate/60">{o.qty} u.</p>
                    <p className="text-xs font-bold text-brand-slate/60">{o.fabricant}</p>
                    <StatusBadge status={o.status} />
                    <div className="flex gap-2">
                        <button className="p-1.5 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all"><Eye size={12} /></button>
                        {role === 'manufacturer' && o.status === 'en_attente' && (
                            <button className="p-1.5 border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-white transition-all" title="Confirmer">
                                <CheckCircle2 size={12} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/* INVOICES – artisan + expert */
const InvoicesPanel = () => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal">Factures</h3>
                <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Générées depuis les devis acceptés</p>
            </div>
        </div>
        <div className="space-y-0 border-4 border-brand-teal">
            <div className="grid grid-cols-6 bg-brand-teal text-white p-4">
                {['Réf.', 'Devis', 'Client', 'Total', 'Payé', 'Statut'].map(h => (
                    <p key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</p>
                ))}
            </div>
            {INVOICES.map((f, i) => (
                <div key={f.id} className={`grid grid-cols-6 p-4 border-b border-brand-teal/10 hover:bg-brand-cream transition-colors items-center ${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream/40'}`}>
                    <p className="font-black text-xs text-brand-orange">{f.ref}</p>
                    <p className="text-xs font-bold text-brand-slate/60">{f.quote}</p>
                    <p className="text-xs font-bold text-brand-slate/60">{f.client}</p>
                    <p className="text-xs font-black text-brand-teal">{f.total.toLocaleString()} DT</p>
                    <p className="text-xs font-bold text-brand-green">{f.paid.toLocaleString()} DT</p>
                    <StatusBadge status={f.status} />
                </div>
            ))}
        </div>
    </div>
);

/* PRODUCTS – manufacturer only */
const ProductsPanel = () => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal">Catalogue Produits</h3>
                <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Gérez votre offre industrielle</p>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm"><Plus size={16} /> Ajouter Produit</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRODUCTS.map(p => (
                <div key={p.id} className="bg-white border-4 border-brand-teal p-6 flex flex-col gap-4 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-black text-sm uppercase tracking-tight text-brand-teal">{p.name}</p>
                            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest text-brand-teal/40">
                                <Tag size={10} /> {p.category}
                            </span>
                        </div>
                        <StatusBadge status={p.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-brand-teal/10 pt-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40 mb-1">Stock</p>
                            <p className={`text-2xl font-black ${p.stock === 0 ? 'text-red-500' : 'text-brand-teal'}`}>{p.stock} <span className="text-xs font-bold opacity-40">unités</span></p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-teal/40 mb-1">Prix unitaire</p>
                            <p className="text-2xl font-black text-brand-orange">{p.price} <span className="text-xs font-bold opacity-40">DT</span></p>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-brand-teal/10">
                        <button className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all">Modifier</button>
                        {p.stock === 0 && (
                            <button className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-all flex items-center justify-center gap-1">
                                <AlertCircle size={10} /> Réapprovisionner
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/* ACCESS LOGS – expert only */
const AccessLogsPanel = () => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal">Logs d'Accessibilité</h3>
                <p className="text-[10px] font-bold text-brand-teal/40 uppercase tracking-widest mt-1">Supervision des fonctionnalités IA & accès</p>
            </div>
        </div>
        <div className="space-y-0 border-4 border-brand-teal">
            <div className="grid grid-cols-4 bg-brand-teal text-white p-4">
                {['Type de service', 'Utilisateur', 'Horodatage', 'Résultat'].map(h => (
                    <p key={h} className="text-[9px] font-black uppercase tracking-widest">{h}</p>
                ))}
            </div>
            {ACCESS_LOGS.map((log, i) => (
                <div key={log.id} className={`grid grid-cols-4 p-4 border-b border-brand-teal/10 hover:bg-brand-cream transition-colors items-center ${i % 2 === 0 ? 'bg-white' : 'bg-brand-cream/40'}`}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-brand-teal/40 shrink-0" />
                        <p className="font-black text-xs text-brand-teal">{log.type}</p>
                    </div>
                    <p className="text-xs font-bold text-brand-slate/60">{log.user}</p>
                    <p className="text-xs font-bold text-brand-slate/60">{log.ts}</p>
                    <StatusBadge status={log.result} />
                </div>
            ))}
        </div>
    </div>
);

/* SETTINGS – all roles */
const SettingsPanel = ({ user }) => (
    <div className="max-w-2xl">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-brand-teal mb-8">Paramètres du Compte</h3>
        <div className="card space-y-6">
            {[
                { label: 'Entreprise', value: user?.companyName },
                { label: 'Email', value: user?.email },
                { label: 'Téléphone', value: user?.phone || '—' },
                { label: 'Rôle', value: user?.role },
            ].map(f => (
                <div key={f.label} className="flex items-center justify-between border-b border-brand-teal/10 pb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/50">{f.label}</p>
                    <p className="font-black text-sm text-brand-teal capitalize">{f.value}</p>
                </div>
            ))}
            <button className="btn-primary w-full mt-4">Modifier le Profil</button>
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   Main Dashboard component
───────────────────────────────────────────── */
const Dashboard = () => {
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    const [projectAction, setProjectAction] = useState('list'); // 'list' or 'create'

    const navigation = [
        { name: 'Overview', icon: LayoutDashboard },
        { name: 'Projects', icon: Briefcase },
        { name: 'Invoices', icon: FileText },
        { name: 'Marketplace', icon: ShoppingBag },
        { name: 'Network', icon: Users },
        // Conditional Navigation based on Role could be here, but for now we add for all and let components handle permissions or show placeholders
        // Ideally filter this list based on user.role
        ...(user?.role === 'admin' ? [{ name: 'User Mgmt', icon: Shield }] : []),
        { name: 'Documents', icon: FolderPlus },
        { name: 'Preferences', icon: Settings },
    ];

    const stats = [
        { label: 'Active Sites', value: '12', trend: '+2', color: 'brand-teal' },
        { label: 'Verified Quote', value: '$42k', trend: '+12%', color: 'brand-orange' },
        { label: 'Global Rank', value: '#142', trend: '-5', color: 'brand-green' },
    ];

    return (
        <div className="h-screen w-full bg-brand-cream flex overflow-hidden font-outfit">

            {/* ── Sidebar ── */}
            <aside className={`bg-brand-teal text-white border-r-8 border-brand-teal transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-72' : 'w-20'}`}>

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
                                setActiveTab(item.name);
                                if (item.name === 'Projects') setProjectAction('list');
                            }}
                            aria-label={`Go to ${item.name}`}
                            className={`flex items-center gap-4 p-4 border-2 transition-all group ${activeTab === item.name
                                ? 'bg-white text-brand-teal border-white'
                                : 'bg-transparent text-white/60 border-transparent hover:border-white/20 hover:text-white'
                                }`}
                        >
                            <item.icon size={24} className={activeTab === item.name ? 'text-brand-orange' : ''} aria-hidden="true" />
                            {sidebarOpen && (
                                <span className="font-black uppercase tracking-widest text-[10px] animate-in">{item.name}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User + logout */}
                <div className="p-4 border-t-4 border-white/10 bg-black/10">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-brand-orange text-white flex items-center justify-center font-black text-sm shrink-0">
                                {user?.companyName?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-black uppercase text-[10px] tracking-widest leading-none mb-1">{user?.companyName}</p>
                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{user?.role}</p>
                            </div>
                            <ChevronRight size={14} className="text-white/20 group-hover/user:text-white/60 group-hover/user:translate-x-0.5 transition-all" />
                        </div>
                    ) : (
                        <div className="flex justify-center mb-4">
                            <div className="w-9 h-9 bg-brand-orange text-white flex items-center justify-center font-black text-sm">
                                {user?.companyName?.charAt(0)}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className={`w-full flex items-center justify-center gap-2 p-3 bg-white/5 border-2 border-white/20 text-white hover:bg-white hover:text-brand-teal transition-all font-black uppercase text-[9px] tracking-widest ${!sidebarOpen && 'px-0'}`}
                    >
                        <LogOut size={14} />
                        {sidebarOpen && <span>Déconnexion</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col relative overflow-hidden">

                {/* Topbar */}
                <header className="h-20 border-b-8 border-brand-teal bg-white px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                            className="p-2 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white transition-all focus:z-10"
                        >
                            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-brand-teal leading-none">{activeTab}</h2>
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
                            aria-label="View Notifications"
                            className="relative w-12 h-12 border-4 border-brand-teal flex items-center justify-center text-brand-teal hover:bg-brand-teal hover:text-white transition-all focus:z-10"
                        >
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-orange"></span>
                        </button>
                    </div>
                </header>

                {/* Content Scroller */}
                <section className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    {activeTab === 'Overview' && (
                        <>
                            {/* Welcome Banner */}
                            <div className="mb-12 bg-white border-8 border-brand-teal p-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-full bg-brand-orange transform translate-x-12 -skew-x-12 opacity-10 group-hover:translate-x-4 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <h3 className="text-5xl font-black uppercase tracking-tighter text-brand-teal leading-none mb-4">
                                        Welcome back,<br />
                                        <span className="text-brand-orange">Operator {user?.companyName}</span>
                                    </h3>
                                    <p className="max-w-xl font-bold text-sm text-brand-slate opacity-60 leading-relaxed mb-8">
                                        Your current workspace is optimized for the <span className="text-brand-teal">{user?.role}</span> module.
                                        All industrial systems are operational and ready for deployment.
                                    </p>

                                    <button
                                        onClick={() => {
                                            setActiveTab('Projects');
                                            setProjectAction('create');
                                        }}
                                        className="btn-primary flex items-center gap-3"
                                    >
                                        Initialize New Site <Plus size={20} />
                                    </button>
                                </div>
                                <div className="absolute bottom-8 right-8 text-brand-teal opacity-10">
                                    <Hammer size={120} />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-brand-teal mb-12">
                                {stats.map((stat, i) => (
                                    <div
                                        key={i}
                                        tabIndex="0"
                                        aria-label={`${stat.label}: ${stat.value}, trend is ${stat.trend}`}
                                        className="bg-white p-8 border border-brand-teal/10 flex flex-col justify-between hover:bg-brand-cream transition-colors group cursor-pointer focus:z-10"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="label leading-none">{stat.label}</p>
                                            <span className={`px-2 py-1 bg-${stat.color} text-white text-[8px] font-black uppercase tracking-widest`}>
                                                {stat.trend}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <p className="text-4xl font-black text-brand-teal">{stat.value}</p>
                                            <ArrowUpRight className="text-brand-teal opacity-10 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" size={32} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Secondary Grid */}
                            <div className="grid lg:grid-cols-2 gap-12">
                                {/* Activity Ledger */}
                                <div className="card h-full min-h-[400px]">
                                    <div className="flex justify-between items-center mb-10">
                                        <h4 className="text-xl font-black uppercase tracking-tight text-brand-teal">System Ledger</h4>
                                        <button className="text-[10px] font-black uppercase tracking-widest text-brand-orange hover:text-brand-teal">View Logs</button>
                                    </div>
                                    <div className="space-y-6">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                tabIndex="0"
                                                aria-label="System Ledger entry: Project Sync Completed. Site-Alpha deployment verified by controller."
                                                className="flex gap-6 p-4 border-2 border-transparent hover:border-brand-teal/10 hover:bg-brand-cream transition-all group cursor-pointer focus:border-brand-teal/20 focus:bg-brand-cream"
                                            >
                                                <div className="w-12 h-12 bg-brand-teal text-white flex items-center justify-center shrink-0">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase text-xs text-brand-teal mb-1">Project Sync Completed</p>
                                                    <p className="text-[10px] font-bold text-brand-slate opacity-40 leading-tight">Site-Alpha deployment verified by controller.</p>
                                                </div>
                                                <div className="ml-auto text-[8px] font-black text-brand-teal/20 uppercase group-hover:text-brand-teal transition-colors pt-1">
                                                    2h / ago
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Creative Box */}
                                <div className="bg-brand-teal p-12 text-white relative flex flex-col justify-between overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-orange"></div>
                                    <div className="relative z-10 text-6xl font-black uppercase tracking-tighter opacity-10 leading-none mb-12">
                                        Industrial<br />Standard.
                                    </div>
                                    <div className="relative z-10">
                                        <h4 className="text-2xl font-black uppercase tracking-tight mb-4">Network Protocols</h4>
                                        <p className="font-bold text-sm text-white/50 leading-relaxed max-w-xs mb-8">
                                            Expand your operational reach by connecting with verified experts and manufacturers.
                                        </p>
                                        <button className="btn-outline-white w-full flex items-center justify-center gap-3">
                                            Explore Ecosystem <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'Projects' && (
                        <div className="animate-in">
                            {projectAction === 'list' ? (
                                <ProjectList onAddNew={() => setProjectAction('create')} />
                            ) : (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setProjectAction('list')}
                                        className="text-brand-teal font-black uppercase text-xs hover:text-brand-orange transition-colors flex items-center gap-2"
                                    >
                                        ← Retour à la liste
                                    </button>
                                    <ProjectCreation onProjectCreated={() => setProjectAction('list')} />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'User Mgmt' && <UserList />}
                    {activeTab === 'Documents' && <DocumentLibrary />}
                </section>

                <VoiceAssistant />
            </main>
        </div>
    );
};

export default Dashboard;
