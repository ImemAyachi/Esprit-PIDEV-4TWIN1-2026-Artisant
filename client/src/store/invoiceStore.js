import { create } from 'zustand';
import api from '../api/axios';

const useInvoiceStore = create((set) => ({
    invoices: [],
    loading: false,
    error: null,
    summary: null,

    fetchMyInvoices: async (params = {}) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/invoices/my', { params });
            set({ invoices: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
        }
    },

    fetchSummary: async () => {
        try {
            const res = await api.get('/invoices/summary');
            set({ summary: res.data.data });
        } catch (err) {
            console.error('Failed to fetch invoice summary', err);
        }
    },

    createInvoice: async (data) => {
        set({ loading: true });
        try {
            const res = await api.post('/invoices', data);
            set(state => ({ invoices: [res.data.data, ...state.invoices], loading: false }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false };
        }
    },

    recordPayment: async (id, paymentData) => {
        set({ loading: true });
        try {
            const res = await api.patch(`/invoices/${id}/payment`, paymentData);
            set(state => ({ 
                invoices: state.invoices.map(i => i._id === id ? res.data.data : i),
                loading: false 
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false };
        }
    },

    voidInvoice: async (id, reason) => {
        set({ loading: true });
        try {
            const res = await api.patch(`/invoices/${id}/void`, { reason });
            set(state => ({ 
                invoices: state.invoices.map(i => i._id === id ? res.data.data : i),
                loading: false 
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message, loading: false });
            return { success: false };
        }
    }
}));

export default useInvoiceStore;
