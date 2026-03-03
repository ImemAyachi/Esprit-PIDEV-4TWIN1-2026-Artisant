import { create } from 'zustand';
import api from '../api/axios';

const useQuoteStore = create((set) => ({
    quotes: [],
    loading: false,
    error: null,

    fetchMyQuotes: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/quotes/my');
            set({ quotes: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to fetch quotes', loading: false });
        }
    },

    createQuote: async (quoteData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/quotes', quoteData);
            set(state => ({
                quotes: [res.data.data, ...state.quotes],
                loading: false
            }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to create quote', loading: false });
            return { success: false, message: err.response?.data?.message };
        }
    },

    updateQuote: async (id, quoteData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.put(`/quotes/${id}`, quoteData);
            set(state => ({
                quotes: state.quotes.map(q => q._id === id ? res.data.data : q),
                loading: false
            }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to update quote', loading: false });
            return { success: false, message: err.response?.data?.message };
        }
    },

    deleteQuote: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/quotes/${id}`);
            set(state => ({
                quotes: state.quotes.filter(q => q._id !== id),
                loading: false
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to delete quote', loading: false });
            return { success: false, message: err.response?.data?.message };
        }
    }
}));

export default useQuoteStore;
