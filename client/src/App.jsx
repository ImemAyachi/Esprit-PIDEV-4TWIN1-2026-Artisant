import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" />;

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  // Redirect admin away from normal dashboard to admin dashboard
  if (!requireAdmin && user?.role === 'admin' && window.location.pathname === '/dashboard') {
    return <Navigate to="/admin" />;
  }

  return children;
};

function App() {
  const { getMe } = useAuthStore();

  useEffect(() => {
    getMe();
  }, [getMe]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}


export default App;
