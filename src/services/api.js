import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const API_URL = 'https://backend.goutsecret.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for refreshing token
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${API_URL}/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const newAccessToken = response.data.access;
                    localStorage.setItem('access_token', newAccessToken);

                    api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                    return api(originalRequest);
                } catch (refreshError) {
                    // Logout if refresh fails
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/admin/login';
                    return Promise.reject(refreshError);
                }
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/admin/login', { username, password });
        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },
    getCurrentUser: () => {
        try {
            const token = localStorage.getItem('access_token');
            return token ? jwtDecode(token) : null;
        } catch {
            return null;
        }
    },
    isAuthenticated: () => {
        const token = localStorage.getItem('access_token');
        if (!token) return false;
        try {
            const decoded = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }
};

export const deviceService = {
    register: async (fingerprint, model = 'Web Browser', osVersion = navigator.userAgent) => {
        return await api.post('/device/register', { fingerprint, model, os_version: osVersion });
    },
    checkStatus: async (fingerprint) => {
        return await api.post('/license/status', { device_hash: fingerprint });
    },
    activate: async (code, fingerprint) => {
        return await api.post('/license/activate', { code: code, device_hash: fingerprint });
    },
    startTrial: async (fingerprint) => {
        return await api.post('/license/trial/start', { device_hash: fingerprint });
    }
};

export const channelService = {
    getChannels: async (page = 1, params = {}) => {
        return await api.get('/channels/', { params: { page, page_size: 50, ...params } });
    },
    getCategories: async () => {
        return await api.get('/channels/categories/');
    },
    getCountries: async () => {
        return await api.get('/channels/countries/');
    },
    recordView: async (channelId, deviceHash) => {
        return await api.post('/analytics/view/', { channel_id: channelId, device_hash: deviceHash });
    }
};

export default api;
