import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL for your local network - use this IP on your physical device
// For Android Emulator, use: http://10.0.2.2:8000/api
// For iOS Simulator, use: http://localhost:8000/api
export const API_URL = 'https://gusto.moonlauncher.org/api';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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
        // Handle 401 calls (logout or refresh token logic here)
        if (error.response && error.response.status === 401) {
            // Ideally trigger token refresh or logout
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('user_role');
            await AsyncStorage.removeItem('user_data');
        }
        return Promise.reject(error);
    }
);

export default client;
