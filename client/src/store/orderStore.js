import { create } from 'zustand';
import api from '../api/axios';

const useOrderStore = create((set) => ({
    orders: [],
    order: null,
    loading: false,
    error: null,

    createOrder: async (data) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/orders', data);
            set((s) => ({ orders: [res.data.data, ...s.orders] }));
            return res.data.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors de la commande';
            set({ error: msg });
            throw new Error(msg);
        } finally {
            set({ loading: false });
        }
    },

    fetchMyOrders: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/orders/my');
            set({ orders: res.data.data });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Erreur de chargement' });
        } finally {
            set({ loading: false });
        }
    },

    fetchOrderById: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get(`/orders/${id}`);
            set({ order: res.data.data });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Commande introuvable' });
        } finally {
            set({ loading: false });
        }
    },

    updateOrderStatus: async (id, status) => {
        const res = await api.patch(`/orders/${id}/status`, { status });
        set((s) => ({
            orders: s.orders.map((o) => (o._id === id ? res.data.data : o)),
            order: s.order?._id === id ? res.data.data : s.order,
        }));
        return res.data.data;
    },
}));

export default useOrderStore;
