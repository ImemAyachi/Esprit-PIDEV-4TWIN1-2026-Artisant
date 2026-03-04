import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import GestureController from './components/GestureController';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import ManageProducts from './pages/ManageProducts';
import OrderForm from './pages/OrderForm';
import OrderStatus from './pages/OrderStatus';
import OrderHistory from './pages/OrderHistory';

// Accessibility
import ScreenReaderFocus from './components/ScreenReaderFocus';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { getMe } = useAuthStore();

  useEffect(() => {
    getMe();
  }, []);

  return (
    <Router>
      <ScreenReaderFocus />
      <GestureController />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#18181b',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontWeight: '600',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['artisan', 'manufacturer', 'expert']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['artisan', 'manufacturer', 'expert', 'admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['artisan', 'manufacturer', 'expert', 'admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Module 4 — Marketplace & Commandes */}
        <Route
          path="/marketplace"
          element={<Marketplace />}
        />

        <Route
          path="/manage-products"
          element={
            <ProtectedRoute allowedRoles={['manufacturer', 'admin']}>
              <ManageProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order/new"
          element={
            <ProtectedRoute allowedRoles={['artisan', 'manufacturer', 'expert', 'admin']}>
              <OrderForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/:id/status"
          element={
            <ProtectedRoute allowedRoles={['artisan', 'manufacturer', 'expert', 'admin']}>
              <OrderStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/history"
          element={
            <ProtectedRoute allowedRoles={['artisan', 'manufacturer', 'expert', 'admin']}>
              <OrderHistory />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;