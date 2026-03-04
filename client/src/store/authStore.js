import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set, get) => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, data } = response.data;
            localStorage.setItem('token', token);
            set({ user: data.user, token, isAuthenticated: true, loading: false, error: null });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login failed', loading: false });
            return false;
        }
    },

    loginWithFace: async (email, faceEmbedding) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/login/face', { email, faceEmbedding });
            const { token, data } = response.data;
            localStorage.setItem('token', token);
            set({ user: data.user, token, isAuthenticated: true, loading: false, error: null });
            return { success: true };
        } catch (error) {
            const msg = error.response?.data?.message || 'Face recognition failed';
            set({ error: msg, loading: false });
            return { success: false, message: msg };
        }
    },

    register: async (userData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/register', userData);
            const { token, data } = response.data;
            localStorage.setItem('token', token);
            set({ user: data.user, token, isAuthenticated: true, loading: false, error: null });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Registration failed', loading: false });
            return false;
        }
    },

    enrollFace: async (faceEmbedding) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/me/face/enroll', { faceEmbedding });
            set({
                user: { ...get().user, hasFaceAuth: true },
                loading: false,
                error: null,
            });
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.message || 'Face enrollment failed', loading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    removeFace: async () => {
        set({ loading: true, error: null });
        try {
            await api.delete('/auth/me/face');
            set({
                user: { ...get().user, hasFaceAuth: false },
                loading: false,
                error: null,
            });
            return { success: true };
        } catch (error) {
            set({ error: error.response?.data?.message || 'Failed to remove Face ID', loading: false });
            return { success: false };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, loading: false, error: null });
    },

    getMe: async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        set({ loading: true });
        try {
            const response = await api.get('/auth/me');
            set({ user: response.data.data.user, token, isAuthenticated: true, loading: false, error: null });
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, loading: false, error: null });
        }
    },

    updateProfile: async (userData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.put('/auth/me/profile', userData);
            set({ user: response.data.data.user, loading: false, error: null });
            return { success: true, data: response.data.data.user };
        } catch (error) {
            set({ error: error.response?.data?.message || 'Update failed', loading: false });
            return { success: false, message: error.response?.data?.message };
        }
    },

    clearError: () => set({ error: null }),

    getRole: () => {
        const user = get().user;
        return user?.role || null;
    },
}));

export default useAuthStore;