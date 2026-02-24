import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle deactivated accounts
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403) {
            const message = error.response?.data?.message || '';
            // Only force logout if the account was specifically deactivated
            if (message.toLowerCase().includes('deactivated')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

