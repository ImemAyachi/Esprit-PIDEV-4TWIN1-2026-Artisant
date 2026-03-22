import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set, get) => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,

    fetchMyProjects: async (params = {}) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/projects/my', { params });
            set({ projects: res.data.data, loading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to load projects', loading: false });
        }
    },

    fetchProject: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await api.get(`/projects/${id}`);
            set({ currentProject: res.data.data, loading: false });
            return res.data.data;
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to fetch project protocol', loading: false });
        }
    },

    createProject: async (formData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post('/projects', formData);
            set((state) => ({ projects: [res.data.data, ...state.projects], loading: false }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: err.response?.data?.message || 'Failed to initiate project', loading: false });
            return { success: false, message: err.response?.data?.message };
        }
    },

    updateProject: async (id, formData) => {
        set({ loading: true, error: null });
        try {
            const res = await api.put(`/projects/${id}`, formData);
            set((state) => ({
                projects: state.projects.map((p) => p._id === id ? res.data.data : p),
                currentProject: res.data.data,
                loading: false
            }));
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: err.response?.data?.message || 'Update failed', loading: false });
            return { success: false, message: err.response?.data?.message };
        }
    },

    bulkUpdate: async (ids, updates) => {
        set({ loading: true });
        try {
            await api.patch('/projects/bulk', { ids, updates });
            get().fetchMyProjects();
            return { success: true };
        } catch (err) {
            set({ error: 'Bulk update protocol failed', loading: false });
            return { success: false };
        }
    },

    deleteProject: async (id, permanent = false) => {
        set({ loading: true });
        try {
            await api.delete(`/projects/${id}${permanent ? '?permanent=true' : ''}`);
            set((state) => ({ projects: state.projects.filter((p) => p._id !== id), loading: false }));
            return { success: true };
        } catch (err) {
            set({ error: 'Disposal protocol failure', loading: false });
            return { success: false };
        }
    },

    restoreProject: async (id) => {
        set({ loading: true });
        try {
            const res = await api.patch(`/projects/${id}/restore`);
            get().fetchMyProjects();
            return { success: true, data: res.data.data };
        } catch (err) {
            set({ error: 'Restoration failed', loading: false });
            return { success: false };
        }
    },

    addMilestone: async (id, milestone) => {
        try {
            const res = await api.post(`/projects/${id}/milestones`, milestone);
            set({ currentProject: { ...get().currentProject, milestones: res.data.data } });
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    },

    manageTeam: async (id, teamData) => {
        try {
            const res = await api.post(`/projects/${id}/team`, teamData);
            set({ currentProject: { ...get().currentProject, team: res.data.data } });
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    },

    addComment: async (id, content, mentions = []) => {
        try {
            await api.post(`/projects/${id}/comments`, { content, mentions });
            get().fetchProject(id);
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    },

    updateBudget: async (id, budget) => {
        try {
            const res = await api.patch(`/projects/${id}/budget`, { budget });
            set({ currentProject: { ...get().currentProject, budget: res.data.data } });
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    }
}));

export default useProjectStore;
