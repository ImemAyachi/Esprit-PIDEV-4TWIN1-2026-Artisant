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
import Checkout from './pages/Checkout';
import OrderStatus from './pages/OrderStatus';
import OrderHistory from './pages/OrderHistory';
import QuoteAcceptance from './pages/QuoteAcceptance';
import ProductDetail from './pages/ProductDetail';

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

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  
  return children;
};

function App() {
  const { getMe } = useAuthStore();

  useEffect(() => {
    getMe();
  }, [getMe]);

  return (
    <Router>
      <Toaster position="top-right" />
      <GestureController />
      <ScreenReaderFocus />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/quotes/:id/accept" element={<QuoteAcceptance />} />

        {/* Universal Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Marketplace & Orders */}
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <Marketplace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketplace/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/history"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />

        {/* Manufacturer Specific */}
        <Route
          path="/manage-products"
          element={
            <ProtectedRoute allowedRoles={['manufacturer', 'admin']}>
              <ManageProducts />
            </ProtectedRoute>
          }
        />

        {/* Admin Specific */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/order/new" element={<Navigate to="/checkout" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;