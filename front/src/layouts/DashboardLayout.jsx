import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import Sidebar from '../components/layout/Sidebar';
import Topbar  from '../components/layout/Topbar';
import { addNotification } from '../store/slices/notificationSlice';
import { fetchNotifications } from '../store/slices/notificationSlice';

let socket;

const DashboardLayout = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user, token } = useSelector((s) => s.auth);
  const { sidebarOpen } = useSelector((s) => s.ui);

  useEffect(() => {
    if (!token) return;

    // Charger les notifications initiales
    dispatch(fetchNotifications());

    // Connexion Socket.io
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    socket.on('connect', () => {
      if (user?._id) socket.emit('join', user._id);
    });

    // Écouter les nouvelles notifications
    socket.on('notification', (notif) => {
      dispatch(addNotification(notif));
    });

    return () => {
      socket?.disconnect();
    };
  }, [token, user?._id]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
