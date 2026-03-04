import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set) => ({
    projects: [],
    loading: false,
    error: null,

    // GET /api/projects/my
    fetchMyProjects: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/projects/my');
            set({ projects: res.data.data, loading: false });
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Failed to load projects',
                loading: false,
            });
        }
    },

    // POST /api/projects
    createProject: async (formData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/projects', formData);
            set((state) => ({
                projects: [res.data.data, ...state.projects],
                loading: false,
            }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Failed to create project',
                loading: false,
            });
            return { success: false, message: err.response?.data?.message };
        }
    },

    // PUT /api/projects/:id
    updateProject: async (id, formData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.put(`/projects/${id}`, formData);
            set((state) => ({
                projects: state.projects.map((p) =>
                    p._id === id ? res.data.data : p
                ),
                loading: false,
            }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Failed to update project',
                loading: false,
            });
            return { success: false, message: err.response?.data?.message };
        }
    },

    // PATCH /api/projects/:id/archive
    archiveProject: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await api.patch(`/projects/${id}/archive`);
            set((state) => ({
                projects: state.projects.map((p) =>
                    p._id === id ? res.data.data : p
                ),
                loading: false,
            }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Failed to archive project',
                loading: false,
            });
            return { success: false, message: err.response?.data?.message };
        }
    },

    // DELETE /api/projects/:id
    deleteProject: async (id) => {
        set({ loading: true, error: null });
        try {
            await api.delete(`/projects/${id}`);
            set((state) => ({
                projects: state.projects.filter((p) => p._id !== id),
                loading: false,
            }));
            return { success: true };
        } catch (err) {
            set({
                error: err.response?.data?.message || 'Failed to delete project',
                loading: false,
            });
            return { success: false };
        }
    },
}));

export default useProjectStore;
