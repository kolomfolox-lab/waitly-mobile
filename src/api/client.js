import axios from 'axios';
import Storage from '../utils/storage';
import { ensureApiBase } from './baseUrl';

const client = axios.create({
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const clearAuthStorage = async () => {
    await Storage.multiRemove(['auth_access_token', 'auth_refresh_token', 'user_role', 'user_data']);
};

client.interceptors.request.use(async (config) => {
    const base = await ensureApiBase();
    config.baseURL = `${base}/api/v1`;
    const token = await Storage.getItem('auth_access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await Storage.getItem('auth_refresh_token');
                if (!refreshToken) {
                    await clearAuthStorage();
                    return Promise.reject(error);
                }

                const base = await ensureApiBase();
                const refreshResponse = await axios.post(`${base}/api/v1/auth/refresh/`, {
                    refresh: refreshToken,
                });

                const { access, refresh } = refreshResponse.data;
                await Storage.setItem('auth_access_token', access);
                if (refresh) {
                    await Storage.setItem('auth_refresh_token', refresh);
                }

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return client(originalRequest);
            } catch (refreshError) {
                await clearAuthStorage();
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 403) {
            await clearAuthStorage();
        }

        return Promise.reject(error);
    }
);

export default client;
