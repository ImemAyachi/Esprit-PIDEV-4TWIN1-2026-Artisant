import { create } from 'zustand';
import api from '../api/axios';

const useProductStore = create((set) => ({
    products: [],
    product: null,
    pagination: {},
    loading: false,
    error: null,

    fetchProducts: async (filters = {}) => {
        set({ loading: true, error: null });
        try {
            const params = new URLSearchParams(
                Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
            ).toString();
            const res = await api.get(`/products?${params}`);
            set({ products: res.data.data, pagination: res.data.pagination });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Erreur de chargement' });
        } finally {
            set({ loading: false });
        }
    },

    fetchProductById: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get(`/products/${id}`);
            set({ product: res.data.data });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Produit introuvable' });
        } finally {
            set({ loading: false });
        }
    },

    createProduct: async (data) => {
        const res = await api.post('/products', data);
        set((s) => ({ products: [res.data.data, ...s.products] }));
        return res.data.data;
    },

    updateProduct: async (id, data) => {
        const res = await api.put(`/products/${id}`, data);
        set((s) => ({
            products: s.products.map((p) => (p._id === id ? res.data.data : p)),
        }));
        return res.data.data;
    },

    deleteProduct: async (id) => {
        await api.delete(`/products/${id}`);
        set((s) => ({ products: s.products.filter((p) => p._id !== id) }));
    },

    generateAIDescription: async (data) => {
        const res = await api.post('/products/ai-description', data);
        return res.data.description;
    },
    uploadImage: async (formData) => {
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.url;
    },
}));

export default useProductStore;
