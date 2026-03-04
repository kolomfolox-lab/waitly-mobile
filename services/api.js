import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL - change for production
const BASE_URL = 'http://192.168.31.242:8000'; // Change to your backend URL

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refresh_token');
                const response = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                await AsyncStorage.setItem('access_token', access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Logout user
                await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
