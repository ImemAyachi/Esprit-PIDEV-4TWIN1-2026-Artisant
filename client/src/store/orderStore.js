import { create } from 'zustand';
import api from '../api/axios';

const useOrderStore = create((set, get) => ({
    orders: [],
    analytics: null,
    loading: false,
    error: null,

    fetchMyOrders: async (filters = {}) => {
        set({ loading: true });
        try {
            const res = await api.get('/orders/my', { params: filters });
            set({ orders: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    fetchManufacturerOrders: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/orders/manufacturer');
            set({ orders: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    createOrder: async (orderData) => {
        set({ loading: true });
        try {
            const res = await api.post('/orders', orderData);
            set(s => ({ orders: [res.data.data, ...s.orders], loading: false }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ loading: false });
            return { success: false, message: err.response?.data?.message || err.message };
        }
    },

    updateOrderStatus: async (id, status, comment) => {
        try {
            const res = await api.patch(`/orders/${id}/status`, { status, comment });
            set(s => ({
                orders: s.orders.map(o => o._id === id ? res.data.data : o)
            }));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    fetchOrderAnalytics: async () => {
        try {
            const res = await api.get('/orders/summary');
            set({ analytics: res.data.data });
        } catch (err) {
            console.error('Analytics fail:', err);
        }
    }
}));

export default useOrderStore;
