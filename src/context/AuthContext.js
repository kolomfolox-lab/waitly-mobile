import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authLogin, getMe } from '../api/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getRestaurantSubscription = (userData) => {
    const restaurantSource = userData?.restaurant && typeof userData.restaurant === 'object'
        ? userData.restaurant
        : userData;

    const subscriptionActive = restaurantSource?.subscription_active;
    const subscriptionExpiresAt = restaurantSource?.subscription_expires_at;
    const subscriptionStatus = restaurantSource?.subscription_status;

    const isExpiredByDate = subscriptionExpiresAt
        ? new Date(subscriptionExpiresAt).getTime() < Date.now()
        : false;

    const isInactive = subscriptionActive === false;
    const statusExpired = typeof subscriptionStatus === 'string' &&
        ['expired', 'inactive', 'blocked'].includes(subscriptionStatus.toLowerCase());

    return {
        blocked: Boolean(isInactive || isExpiredByDate || statusExpired),
        subscriptionActive,
        subscriptionExpiresAt,
        subscriptionStatus,
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscriptionLock, setSubscriptionLock] = useState({
        blocked: false,
        subscriptionActive: true,
        subscriptionExpiresAt: null,
        subscriptionStatus: null,
    });

    useEffect(() => {
        loadStorageData();
    }, []);

    const applyUserData = async (userData) => {
        const subscriptionState = getRestaurantSubscription(userData);
        setUser(userData);
        setRole(userData.role);
        setSubscriptionLock(subscriptionState);
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        await AsyncStorage.setItem('user_role', userData.role);
    };

    const loadStorageData = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_access_token');
            if (token) {
                try {
                    const userData = await getMe();
                    await applyUserData(userData);
                } catch (apiError) {
                    console.log('Token verification failed, trying cached data:', apiError.message);
                    const cachedRole = await AsyncStorage.getItem('user_role');
                    const cachedUser = await AsyncStorage.getItem('user_data');
                    if (cachedRole && cachedUser) {
                        const parsedUser = JSON.parse(cachedUser);
                        setUser(parsedUser);
                        setRole(cachedRole);
                        setSubscriptionLock(getRestaurantSubscription(parsedUser));
                    } else {
                        await clearStorage();
                    }
                }
            }
        } catch (e) {
            console.log('Failed to load auth data:', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (phoneNumber, password) => {
        try {
            const response = await authLogin(phoneNumber, password);

            if (response.access) {
                await AsyncStorage.setItem('auth_access_token', response.access);
            }
            if (response.refresh) {
                await AsyncStorage.setItem('auth_refresh_token', response.refresh);
            }

            const userData = await getMe();
            await applyUserData(userData);
            return true;
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            throw error;
        }
    };

    const refreshUser = async () => {
        const userData = await getMe();
        await applyUserData(userData);
        return userData;
    };

    const logout = async () => {
        await clearStorage();
        setUser(null);
        setRole(null);
        setSubscriptionLock({
            blocked: false,
            subscriptionActive: true,
            subscriptionExpiresAt: null,
            subscriptionStatus: null,
        });
    };

    const clearStorage = async () => {
        await AsyncStorage.multiRemove([
            'auth_access_token',
            'auth_refresh_token',
            'user_role',
            'user_data',
        ]);
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, login, logout, refreshUser, subscriptionLock }}>
            {children}
        </AuthContext.Provider>
    );
};
