import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
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
            set({
                user: data.user,
                token,
                isAuthenticated: true,
                loading: false
            });
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Login failed',
                loading: false
            });
            return false;
        }
    },

    register: async (userData) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/register', userData);
            const { token, data } = response.data;

            localStorage.setItem('token', token);
            set({
                user: data.user,
                token,
                isAuthenticated: true,
                loading: false
            });
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Registration failed',
                loading: false
            });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    getMe: async () => {
        if (!localStorage.getItem('token')) return;
        set({ loading: true });
        try {
            const response = await api.get('/auth/me');
            set({ user: response.data.data.user, isAuthenticated: true, loading: false });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false, loading: false });
        }
    },
}));

export default useAuthStore;
