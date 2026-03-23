import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.moonlauncher.org';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach JWT token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('auth_access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            console.log('Error reading auth token:', e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired — clear storage, app will redirect to login
            await AsyncStorage.multiRemove([
                'auth_access_token',
                'auth_refresh_token',
                'user_role',
                'user_data',
            ]);
            // Let the calling code handle the redirect
        }
        return Promise.reject(error);
    }
);

export default apiClient;
