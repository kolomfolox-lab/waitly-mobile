import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('access_token');
            const userRole = await AsyncStorage.getItem('user_role');
            const userData = await AsyncStorage.getItem('user_data');

            if (accessToken && userRole && userData) {
                setUser(JSON.parse(userData));
                setRole(userRole);
            }
        } catch (e) {
            console.log('Failed to load auth data');
        } finally {
            setLoading(false);
        }
    };

    const login = async (phoneNumber, password) => {
        try {
            const response = await client.post('/auth/login/', {
                phone_number: phoneNumber,
                password: password,
            });

            const { access, refresh, user: userData } = response.data;

            // Ensure your backend returns 'role' in the user object
            // If not, we need to fetch user profile
            const userRole = userData.role;

            await AsyncStorage.setItem('access_token', access);
            await AsyncStorage.setItem('refresh_token', refresh);
            await AsyncStorage.setItem('user_role', userRole);
            await AsyncStorage.setItem('user_data', JSON.stringify(userData));

            setUser(userData);
            setRole(userRole);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('user_role');
        await AsyncStorage.removeItem('user_data');
        setUser(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
