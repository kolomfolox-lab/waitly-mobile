import axios from 'axios';
import Storage from '../src/utils/storage';
import { Alert } from 'react-native';
import { ensureApiBase } from '../src/api/baseUrl';

const api = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const clearAuthStorage = async () => {
    await Storage.multiRemove(['access_token', 'refresh_token', 'user', 'user_role', 'user_data']);
};

api.interceptors.request.use(
    async (config) => {
        const base = await ensureApiBase();
        config.baseURL = base;
        const token = await Storage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await Storage.getItem('refresh_token');
                if (!refreshToken) {
                    throw error;
                }

                const base = await ensureApiBase();
                const response = await axios.post(`${base}/api/v1/auth/refresh/`, {
                    refresh: refreshToken,
                });

                const { access, refresh } = response.data;
                await Storage.setItem('access_token', access);
                if (refresh) {
                    await Storage.setItem('refresh_token', refresh);
                }

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                await clearAuthStorage();
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 403) {
            await clearAuthStorage();
            Alert.alert('Access limited', error.response?.data?.error || 'Your access has been paused.');
        }

        return Promise.reject(error);
    }
);

export default api;
