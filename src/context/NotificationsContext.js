import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getOrders, getTables } from '../api/apiService';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

const STORAGE_KEYS = {
    items: 'waiter_notifications',
    settings: 'waiter_notification_settings',
};

const DEFAULT_SETTINGS = {
    orderReady: true,
    waiterCalls: true,
    inAppAlerts: true,
};

const POLL_INTERVAL_MS = 15000;
const MAX_NOTIFICATIONS = 50;
const SUPPORTED_ROLES = new Set(['WAITER', 'HEAD_WAITER', 'HOSTESS']);

export const useNotifications = () => useContext(NotificationsContext);

const getNotificationTimestamp = (value) => {
    if (!value) return Date.now();
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Date.now() : parsed;
};

const buildOrderReadyNotifications = (orders, settings) => {
    if (!settings.orderReady || !Array.isArray(orders)) {
        return [];
    }

    return orders
        .filter((order) => order?.status === 'READY')
        .map((order) => ({
            id: `order-ready-${order.id}-${order.updated_at || order.ready_at || order.status}`,
            type: 'ORDER_READY',
            title: 'Заказ готов',
            message: `Заказ по столу ${order.table_number || 'без номера'} готов к подаче`,
            createdAt: order.updated_at || order.ready_at || order.created_at || new Date().toISOString(),
            entityId: order.id,
            meta: {
                orderId: order.id,
                tableId: order.table,
                tableNumber: order.table_number,
            },
        }));
};

const buildWaiterCallNotifications = (tables, user, settings) => {
    if (!settings.waiterCalls || !Array.isArray(tables)) {
        return [];
    }

    return tables
        .filter((table) => {
            const isAssignedToCurrentUser = !table?.current_waiter || table.current_waiter === user?.id;
            const hasWaiterCall = Boolean(
                table?.waiting_for_waiter ||
                table?.waiter_called ||
                table?.needs_waiter ||
                table?.is_waiter_called ||
                table?.call_waiter_requested_at ||
                table?.waiter_call_time ||
                table?.waiter_requested_at
            );
            return isAssignedToCurrentUser && hasWaiterCall;
        })
        .map((table) => {
            const callTime = table.call_waiter_requested_at ||
                table.waiter_call_time ||
                table.waiter_requested_at ||
                table.updated_at ||
                table.created_at;

            return {
                id: `table-call-${table.id}-${callTime || 'active'}`,
                type: 'WAITER_CALL',
                title: 'Вызов официанта',
                message: `Стол ${table.number || 'без номера'} вызывает официанта`,
                createdAt: callTime || new Date().toISOString(),
                entityId: table.id,
                meta: {
                    tableId: table.id,
                    tableNumber: table.number,
                },
            };
        });
};

export function NotificationsProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const lastShownAlertRef = useRef(null);
    const knownNotificationIdsRef = useRef(new Set());

    useEffect(() => {
        let isMounted = true;

        const loadStoredState = async () => {
            try {
                const [storedItems, storedSettings] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.items),
                    AsyncStorage.getItem(STORAGE_KEYS.settings),
                ]);

                if (isMounted && storedItems) {
                    const parsedItems = JSON.parse(storedItems);
                    if (Array.isArray(parsedItems)) {
                        setNotifications(parsedItems);
                        knownNotificationIdsRef.current = new Set(parsedItems.map((item) => item.id));
                    }
                }

                if (isMounted && storedSettings) {
                    setSettings({
                        ...DEFAULT_SETTINGS,
                        ...JSON.parse(storedSettings),
                    });
                }
            } catch (error) {
                console.log('Failed to load notification state:', error.message);
            }
        };

        loadStoredState();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEYS.items, JSON.stringify(notifications)).catch((error) => {
            console.log('Failed to persist notifications:', error.message);
        });
    }, [notifications]);

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)).catch((error) => {
            console.log('Failed to persist notification settings:', error.message);
        });
    }, [settings]);

    const syncNotifications = useCallback(async () => {
        if (!user || !SUPPORTED_ROLES.has(user.role)) {
            return;
        }

        try {
            const [ordersData, tablesData] = await Promise.all([
                getOrders().catch(() => ({ results: [] })),
                getTables().catch(() => ({ results: [] })),
            ]);

            const orders = ordersData?.results || ordersData || [];
            const tables = tablesData?.results || tablesData || [];

            const freshNotifications = [
                ...buildOrderReadyNotifications(orders, settings),
                ...buildWaiterCallNotifications(tables, user, settings),
            ]
                .map((item) => ({ ...item, read: false }))
                .sort((a, b) => getNotificationTimestamp(b.createdAt) - getNotificationTimestamp(a.createdAt));

            setNotifications((previous) => {
                const previousMap = new Map(previous.map((item) => [item.id, item]));
                const merged = freshNotifications.map((item) => {
                    const existing = previousMap.get(item.id);
                    return existing ? { ...item, read: existing.read } : item;
                }).slice(0, MAX_NOTIFICATIONS);

                const newItems = merged.filter((item) => !knownNotificationIdsRef.current.has(item.id));
                newItems.forEach((item) => knownNotificationIdsRef.current.add(item.id));

                if (settings.inAppAlerts && newItems.length > 0) {
                    const latest = newItems[0];
                    if (lastShownAlertRef.current !== latest.id) {
                        lastShownAlertRef.current = latest.id;
                        Alert.alert(latest.title, latest.message);
                    }
                }

                return merged;
            });
        } catch (error) {
            console.log('Notification sync failed:', error.message);
        }
    }, [settings, user]);

    useEffect(() => {
        if (!user || !SUPPORTED_ROLES.has(user.role)) {
            setNotifications([]);
            knownNotificationIdsRef.current = new Set();
            return;
        }

        syncNotifications();
        const intervalId = setInterval(syncNotifications, POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [syncNotifications, user]);

    const markAsRead = useCallback((id) => {
        setNotifications((previous) => previous.map((item) => (
            item.id === id ? { ...item, read: true } : item
        )));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        knownNotificationIdsRef.current = new Set();
        setNotifications([]);
    }, []);

    const updateSettings = useCallback((patch) => {
        setSettings((previous) => ({
            ...previous,
            ...patch,
        }));
    }, []);

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.read).length,
        [notifications]
    );

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        settings,
        refreshNotifications: syncNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        updateSettings,
    }), [
        notifications,
        unreadCount,
        settings,
        syncNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        updateSettings,
    ]);

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}
