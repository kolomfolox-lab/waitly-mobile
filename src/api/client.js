import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const API_URL = 'https://api.moonlauncher.org/api/v1';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const clearAuthStorage = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_role', 'user_data']);
};

client.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
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
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw error;
                }

                const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
                    refresh: refreshToken,
                });

                const { access, refresh } = refreshResponse.data;
                await AsyncStorage.setItem('access_token', access);
                if (refresh) {
                    await AsyncStorage.setItem('refresh_token', refresh);
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
            Alert.alert(
                'Access changed',
                error.response?.data?.error?.message || 'Your role or access changed. Please sign in again.'
            );
        }

        return Promise.reject(error);
    }
);

export default client;
