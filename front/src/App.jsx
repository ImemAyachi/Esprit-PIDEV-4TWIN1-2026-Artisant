import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import GestureController from './components/common/GestureController';
import { store } from './store';
import ChatbotWidget from './components/chatbot/ChatbotWidget';
import BatiBot2Chat from './components/catalog/BatiBot2Chat';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardLayout from './layouts/DashboardLayout';

// Dashboard pages par rôle
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import CatalogPage from './pages/catalog/CatalogPage';
import ProductDetail from './pages/catalog/ProductDetail';
import ArtisansPage from './pages/artisans/ArtisansPage';
import QuotesPage from './pages/quotes/QuotesPage';
import QuoteDetail from './pages/quotes/QuoteDetail';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetail from './pages/projects/ProjectDetail';
import MyProductsPage from './pages/supplier/MyProductsPage';
import SupplierOrdersPage from './pages/supplier/SupplierOrdersPage';
import SupplierStatsPage from './pages/supplier/SupplierStatsPage';
import MyOrdersPage from './pages/artisans/MyOrdersPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ProjectPlannerPage from './pages/ProjectPlannerPage';
import DashboardPlannerPage from './pages/dashboard/DashboardPlannerPage';
import Ai2DPlanPage from './pages/Ai2DPlanPage';
import AiChantierBrainPage from './pages/AiChantierBrainPage';

// Guards
import PrivateRoute from './components/auth/PrivateRoute';
import RoleRoute from './components/auth/RoleRoute';

function AppContent() {
  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <GestureController />
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/project-planner" element={<ProjectPlannerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Dashboard protégé */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          {/* Admin */}
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<AdminDashboard />} />
          <Route path="users" element={<RoleRoute roles={['SuperAdmin']}><AdminUsers /></RoleRoute>} />

          {/* Catalogue (tous) */}
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:id" element={<ProductDetail />} />

          {/* Artisans */}
          <Route path="artisans" element={<ArtisansPage />} />

          {/* Devis */}
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="quotes/:id" element={<QuoteDetail />} />

          <Route path="my-orders" element={
            <RoleRoute roles={['Artisan', 'Ingenieur']}>
              <MyOrdersPage />
            </RoleRoute>
          } />

          {/* Projets / Chantiers */}
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetail />} />

          {/* Fournisseur */}
          <Route path="my-products" element={
            <RoleRoute roles={['Fournisseur', 'SuperAdmin']}>
              <MyProductsPage />
            </RoleRoute>
          } />
          <Route path="supplier/orders" element={
            <RoleRoute roles={['Fournisseur', 'SuperAdmin']}>
              <SupplierOrdersPage />
            </RoleRoute>
          } />
          <Route path="supplier/stats" element={
            <RoleRoute roles={['Fournisseur', 'SuperAdmin']}>
              <SupplierStatsPage />
            </RoleRoute>
          } />

          {/* Profil commun */}
          <Route path="profile" element={<ProfilePage />} />

          {/* Planificateur IA — tous les rôles authentifiés */}
          <Route path="planner" element={<DashboardPlannerPage />} />

          {/* Texte -> Plan 2D — tous les rôles authentifiés */}
          <Route path="ai-2d-plan" element={<Ai2DPlanPage />} />

          {/* 🧠 AI Chantier Brain — Ingénieur & Architecte uniquement */}
          <Route path="chantier-brain" element={
            <RoleRoute roles={['Ingenieur', 'Architecte']}>
              <AiChantierBrainPage />
            </RoleRoute>
          } />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Chatbot available for all logged-in users */}
      {isAuthenticated && <ChatbotWidget />}
      {isAuthenticated && <BatiBot2Chat />}
    </BrowserRouter>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
