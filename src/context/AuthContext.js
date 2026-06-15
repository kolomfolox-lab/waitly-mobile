import React, { createContext, useState, useEffect, useContext } from 'react';
import Storage from '../utils/storage';
import { authLogin, getMe } from '../api/apiService';
import { telegramLogin, telegramLinkPhone } from '../api/telegramAuth';

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
        await Storage.setItem('user_data', JSON.stringify(userData));
        await Storage.setItem('user_role', userData.role);
    };

    const loadStorageData = async () => {
        try {
            await Storage.multiRemove([
                'auth_access_token',
                'auth_refresh_token',
                'user_role',
                'user_data',
            ]);
        } catch (e) {
            console.log('Failed to clear auth data:', e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (phoneNumber, password) => {
        try {
            const response = await authLogin(phoneNumber, password);

            if (response.access) {
                await Storage.setItem('auth_access_token', response.access);
            }
            if (response.refresh) {
                await Storage.setItem('auth_refresh_token', response.refresh);
            }

            const userData = await getMe();
            await applyUserData(userData);
            return true;
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            throw error;
        }
    };

    const telegramAuth = async (initData) => {
        try {
            const response = await telegramLogin(initData);

            if (response.needs_phone_link) {
                return { needsPhoneLink: true, initData };
            }

            if (response.access) {
                await Storage.setItem('auth_access_token', response.access);
            }
            if (response.refresh) {
                await Storage.setItem('auth_refresh_token', response.refresh);
            }

            const userData = await getMe();
            await applyUserData(userData);
            return true;
        } catch (error) {
            console.error('Telegram login failed:', error.response?.data || error.message);
            throw error;
        }
    };

    const telegramLink = async (initData, phoneNumber) => {
        try {
            const response = await telegramLinkPhone(initData, phoneNumber);

            if (response.access) {
                await Storage.setItem('auth_access_token', response.access);
            }
            if (response.refresh) {
                await Storage.setItem('auth_refresh_token', response.refresh);
            }

            const userData = await getMe();
            await applyUserData(userData);
            return true;
        } catch (error) {
            console.error('Telegram link failed:', error.response?.data || error.message);
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
        await Storage.multiRemove([
            'auth_access_token',
            'auth_refresh_token',
            'user_role',
            'user_data',
        ]);
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, login, logout, telegramAuth, telegramLink, refreshUser, subscriptionLock }}>
            {children}
        </AuthContext.Provider>
    );
};
