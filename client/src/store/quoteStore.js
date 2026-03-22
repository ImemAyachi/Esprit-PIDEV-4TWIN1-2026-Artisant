import { create } from 'zustand';
import api from '../api/axios';

const useQuoteStore = create((set) => ({
    quotes: [],
    currentQuote: null,
    loading: false,
    error: null,

    fetchMyQuotes: async (params = {}) => {
        set({ loading: true });
        try {
            const res = await api.get('/quotes/my', { params });
            set({ quotes: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
        }
    },

    createQuote: async (data) => {
        set({ loading: true });
        try {
            const res = await api.post('/quotes', data);
            set(state => ({ quotes: [res.data.data, ...state.quotes], loading: false }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false, message: err.response?.data?.message };
        }
    },

    updateQuote: async (id, data) => {
        set({ loading: true });
        try {
            const res = await api.put(`/quotes/${id}`, data);
            // res.status 201 means new version created
            if (res.status === 201) {
                set(state => ({ quotes: [res.data.data, ...state.quotes], loading: false }));
            } else {
                set(state => ({ quotes: state.quotes.map(q => q._id === id ? res.data.data : q), loading: false }));
            }
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false };
        }
    },

    acceptQuote: async (id, signatureData) => {
        set({ loading: true });
        try {
            const res = await api.patch(`/quotes/${id}/accept`, { signatureData, termsAccepted: true });
            set(state => ({ 
                quotes: state.quotes.map(q => q._id === id ? res.data.data : q),
                loading: false 
            }));
            return { success: true, data: res.data.data, invoice: res.data.invoice };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false };
        }
    },

    reactivateQuote: async (id) => {
        set({ loading: true });
        try {
            const res = await api.patch(`/quotes/${id}/reactivate`);
            set(state => ({ quotes: [res.data.data, ...state.quotes], loading: false }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false };
        }
    },

    deleteQuote: async (id) => {
        set({ loading: true });
        try {
            const res = await api.delete(`/quotes/${id}`);
            set(state => ({ 
                quotes: state.quotes.filter(q => q._id !== id),
                loading: false 
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false };
        }
    }
}));

export default useQuoteStore;
