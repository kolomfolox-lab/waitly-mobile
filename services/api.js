import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const BASE_URL = 'https://api.moonlauncher.org';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const clearAuthStorage = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user', 'user_role', 'user_data']);
};

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access_token');
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
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw error;
                }

                const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh/`, {
                    refresh: refreshToken,
                });

                const { access, refresh } = response.data;
                await AsyncStorage.setItem('access_token', access);
                if (refresh) {
                    await AsyncStorage.setItem('refresh_token', refresh);
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
