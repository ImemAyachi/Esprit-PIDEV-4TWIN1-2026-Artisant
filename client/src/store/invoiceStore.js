import { create } from 'zustand';
import api from '../api/axios';

const useInvoiceStore = create((set) => ({
    invoices: [],
    loading: false,
    error: null,
    summary: null,

    fetchMyInvoices: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/invoices/my');
            set({ invoices: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to fetch invoices', loading: false });
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

    convertToInvoice: async (quoteId) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post(`/invoices/convert/${quoteId}`);
            set(state => ({
                invoices: [res.data.data, ...state.invoices],
                loading: false
            }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: err.response?.data?.message || 'Conversion failed', loading: false });
            return { success: false, message: err.response?.data?.message };
        }
    }
}));

export default useInvoiceStore;
