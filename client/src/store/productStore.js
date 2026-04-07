import { create } from 'zustand';
import api from '../api/axios';

const useProductStore = create((set, get) => ({
    products: [],
    lowStock: [],
    loading: false,
    error: null,

    fetchProducts: async (params = {}) => {
        set({ loading: true });
        try {
            const res = await api.get('/products', { params });
            set({ products: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    fetchLowStock: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/products/low-stock');
            set({ lowStock: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    createProduct: async (data) => {
        try {
            const res = await api.post('/products', data);
            set(s => ({ products: [res.data.data, ...s.products] }));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || err.message };
        }
    },

    updateProduct: async (id, data) => {
        try {
            const res = await api.put(`/products/${id}`, data);
            set(s => ({
                products: s.products.map(p => p._id === id ? res.data.data : p)
            }));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    bulkUpdate: async (ids, updates) => {
        try {
            await api.patch('/products/bulk', { ids, updates });
            get().fetchProducts();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    addReview: async (id, review) => {
        try {
            const res = await api.post(`/reviews`, { productId: id, ...review });
            get().fetchProducts(); // Refresh products to update average rating
            return { success: true, data: res.data };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || err.message };
        }
    },

    getProductReviews: async (id) => {
        try {
            const res = await api.get(`/reviews/product/${id}`);
            return { success: true, reviews: res.data.reviews };
        } catch (err) {
            return { success: false, reviews: [] };
        }
    }
}));

export default useProductStore;
