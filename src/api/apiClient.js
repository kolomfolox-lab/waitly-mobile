import axios from 'axios';
import Storage from '../utils/storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://api.waitly.uz';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await Storage.getItem('auth_access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (e) {
            // Silent fail
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                const refreshToken = await Storage.getItem('auth_refresh_token');
                if (refreshToken) {
                    const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
                        refresh: refreshToken,
                    });
                    const { access, refresh } = refreshResponse.data;
                    await Storage.setItem('auth_access_token', access);
                    if (refresh) {
                        await Storage.setItem('auth_refresh_token', refresh);
                    }
                    error.config.headers.Authorization = `Bearer ${access}`;
                    return apiClient(error.config);
                }
            } catch {
                // Fall through to clear
            }
            await Storage.multiRemove([
                'auth_access_token',
                'auth_refresh_token',
                'user_role',
                'user_data',
            ]);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
