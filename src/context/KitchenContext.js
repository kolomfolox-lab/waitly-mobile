import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    addOrderDelay,
    assignOrderCook,
    cancelOrder,
    getDishes,
    getMenuSettings,
    getOrderDetail,
    getOrders,
    getUsers,
    acceptOrder,
    markOrderReady,
    startOrderCooking,
    toggleDishAvailability,
} from '../api/apiService';
import { useAuth } from './AuthContext';
import {
    KITCHEN_HOME_FILTERS,
    KITCHEN_ROLES,
    KITCHEN_ROLE_LABELS,
    buildKitchenCounts,
    buildKitchenEvents,
    extractKitchenMode,
    filterKitchenOrders,
    getApiErrorMessage,
    getKitchenModeLabel,
    getKitchenRealtimeUrl,
    getOrderId,
    mergeUniqueKitchenEvents,
    normalizeListResponse,
    sortKitchenOrders,
} from '../utils/kitchen';

const KitchenContext = createContext(null);

const POLL_INTERVAL_MS = 15000;
const CLOCK_INTERVAL_MS = 30000;
const MAX_EVENTS = 60;
const ACTIVE_ORDER_STATUSES = new Set(['CREATED', 'ACCEPTED', 'COOKING', 'READY']);

export const useKitchen = () => useContext(KitchenContext);

const upsertOrder = (orders, nextOrder) => {
    const nextId = getOrderId(nextOrder);
    const existingIndex = orders.findIndex((order) => getOrderId(order) === nextId);

    if (existingIndex === -1) {
        return [nextOrder, ...orders];
    }

    const nextOrders = [...orders];
    nextOrders[existingIndex] = {
        ...nextOrders[existingIndex],
        ...nextOrder,
    };
    return nextOrders;
};

export function KitchenProvider({ children }) {
    const { user, subscriptionLock } = useAuth();
    const isKitchenRole = KITCHEN_ROLES.has(user?.role);
    const readOnly = Boolean(subscriptionLock?.blocked);

    const [orders, setOrders] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [menuSettings, setMenuSettings] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingActions, setPendingActions] = useState({});
    const [detailsCache, setDetailsCache] = useState({});
    const [connectionMode, setConnectionMode] = useState('polling');
    const [lastViewedAt, setLastViewedAt] = useState(Date.now());
    const [currentTime, setCurrentTime] = useState(Date.now());

    const previousOrdersRef = useRef([]);

    const refreshKitchenData = useCallback(async ({ silent = false } = {}) => {
        if (!isKitchenRole || !user?.id) {
            setOrders([]);
            setDishes([]);
            setMenuSettings(null);
            setTeamMembers([]);
            setEvents([]);
            previousOrdersRef.current = [];
            setLoading(false);
            return;
        }

        if (!silent) {
            setLoading(true);
        }

        try {
            const restaurantId = user?.restaurant?.id || user?.restaurant_id || user?.restaurant;
            const [ordersPayload, dishesPayload, menuSettingsPayload, teamPayload] = await Promise.all([
                getOrders({ page_size: 100 }).catch(() => ({ results: [] })),
                getDishes({ page_size: 100 }).catch(() => ({ results: [] })),
                getMenuSettings({ page_size: 20 }).catch(() => ({ results: [] })),
                getUsers({ page_size: 100 }).catch(() => ({ results: [] })),
            ]);

            const nextOrders = normalizeListResponse(ordersPayload);
            const nextDishes = normalizeListResponse(dishesPayload);
            const nextMenuSettings = normalizeListResponse(menuSettingsPayload)[0] || null;
            const nextTeam = normalizeListResponse(teamPayload)
                .filter((member) => {
                    if (!KITCHEN_ROLES.has(member?.role)) {
                        return false;
                    }

                    const memberRestaurantId = member?.restaurant?.id || member?.restaurant_id || member?.restaurant;
                    if (!restaurantId || !memberRestaurantId) {
                        return true;
                    }

                    return memberRestaurantId === restaurantId;
                });

            const newEvents = previousOrdersRef.current.length > 0
                ? buildKitchenEvents(previousOrdersRef.current, nextOrders)
                : [];
            previousOrdersRef.current = nextOrders;

            if (newEvents.length > 0) {
                setEvents((previous) => mergeUniqueKitchenEvents(newEvents, previous).slice(0, MAX_EVENTS));
            }

            setOrders(nextOrders);
            setDishes(nextDishes);
            setMenuSettings(nextMenuSettings);
            setTeamMembers(nextTeam);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isKitchenRole, user?.id]);

    useEffect(() => {
        refreshKitchenData();
    }, [refreshKitchenData]);

    useEffect(() => {
        if (!isKitchenRole) {
            return undefined;
        }

        const pollId = setInterval(() => {
            refreshKitchenData({ silent: true });
        }, POLL_INTERVAL_MS);

        return () => clearInterval(pollId);
    }, [isKitchenRole, refreshKitchenData]);

    useEffect(() => {
        const clockId = setInterval(() => {
            setCurrentTime(Date.now());
        }, CLOCK_INTERVAL_MS);

        return () => clearInterval(clockId);
    }, []);

    useEffect(() => {
        if (!isKitchenRole) {
            setConnectionMode('polling');
            return undefined;
        }

        const realtimeUrl = getKitchenRealtimeUrl(user);
        if (!realtimeUrl || typeof WebSocket === 'undefined') {
            setConnectionMode('polling');
            return undefined;
        }

        let isMounted = true;
        let socket;

        try {
            socket = new WebSocket(realtimeUrl);
            socket.onopen = () => {
                if (isMounted) {
                    setConnectionMode('live');
                }
            };
            socket.onerror = () => {
                if (isMounted) {
                    setConnectionMode('polling');
                }
            };
            socket.onclose = () => {
                if (isMounted) {
                    setConnectionMode('polling');
                }
            };
            socket.onmessage = (message) => {
                try {
                    const payload = JSON.parse(message.data);
                    const title = payload?.title || payload?.event || 'Kitchen update';
                    const nextEvent = {
                        id: [
                            payload?.event || 'kitchen',
                            payload?.order_id || payload?.id || 'system',
                            payload?.status || 'unknown',
                            payload?.created_at || payload?.updated_at || 'no-timestamp',
                        ].join('-'),
                        type: payload?.event || 'kitchen.event',
                        title,
                        message: payload?.message || 'The kitchen queue has changed.',
                        createdAt: payload?.created_at || payload?.updated_at || null,
                        orderId: payload?.order_id || payload?.id,
                        status: payload?.status,
                    };
                    setEvents((previous) => mergeUniqueKitchenEvents([nextEvent], previous).slice(0, MAX_EVENTS));
                    refreshKitchenData({ silent: true });
                } catch (error) {
                    setConnectionMode('polling');
                }
            };
        } catch (error) {
            setConnectionMode('polling');
        }

        return () => {
            isMounted = false;
            if (socket?.close) {
                socket.close();
            }
        };
    }, [isKitchenRole, refreshKitchenData, user]);

    const withPendingState = useCallback(async (key, action) => {
        setPendingActions((previous) => ({ ...previous, [key]: true }));
        try {
            return await action();
        } finally {
            setPendingActions((previous) => ({ ...previous, [key]: false }));
        }
    }, []);

    const ensureWritable = useCallback(() => {
        if (!readOnly) {
            return;
        }

        const error = new Error('Subscription expired. Kitchen is in read-only mode.');
        error.readOnly = true;
        throw error;
    }, [readOnly]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await refreshKitchenData({ silent: true });
    }, [refreshKitchenData]);

    const refreshOrderDetails = useCallback(async (orderId) => {
        const detail = await getOrderDetail(orderId);
        setDetailsCache((previous) => ({ ...previous, [orderId]: detail }));
        setOrders((previous) => upsertOrder(previous, detail));
        return detail;
    }, []);

    const takeOrder = useCallback((orderId) => withPendingState(`order:${orderId}:accept`, async () => {
        ensureWritable();
        const response = await acceptOrder(orderId);
        setOrders((previous) => upsertOrder(previous, response));
        await refreshKitchenData({ silent: true });
        return response;
    }), [ensureWritable, refreshKitchenData, withPendingState]);

    const startOrder = useCallback((orderId) => withPendingState(`order:${orderId}:cooking`, async () => {
        ensureWritable();
        const response = await startOrderCooking(orderId);
        setOrders((previous) => upsertOrder(previous, response));
        await refreshKitchenData({ silent: true });
        return response;
    }), [ensureWritable, refreshKitchenData, withPendingState]);

    const readyOrder = useCallback((orderId) => withPendingState(`order:${orderId}:ready`, async () => {
        ensureWritable();
        const response = await markOrderReady(orderId);
        setOrders((previous) => upsertOrder(previous, response));
        await refreshKitchenData({ silent: true });
        return response;
    }), [ensureWritable, refreshKitchenData, withPendingState]);

    const delayOrder = useCallback((orderId, payload) => withPendingState(`order:${orderId}:delay`, async () => {
        ensureWritable();
        const response = await addOrderDelay(orderId, payload);
        setOrders((previous) => upsertOrder(previous, response));
        await refreshKitchenData({ silent: true });
        return response;
    }), [ensureWritable, refreshKitchenData, withPendingState]);

    const assignOrder = useCallback((orderId, cookId) => withPendingState(`order:${orderId}:assign`, async () => {
        ensureWritable();
        const response = await assignOrderCook(orderId, cookId);
        setOrders((previous) => upsertOrder(previous, response));
        await refreshKitchenData({ silent: true });
        return response;
    }), [ensureWritable, refreshKitchenData, withPendingState]);

    const cancelKitchenOrder = useCallback((orderId, payload = {}) => withPendingState(`order:${orderId}:cancel`, async () => {
        ensureWritable();
        const response = await cancelOrder(orderId, payload);
        setOrders((previous) => upsertOrder(previous, response));
        await refreshKitchenData({ silent: true });
        return response;
    }), [ensureWritable, refreshKitchenData, withPendingState]);

    const setDishAvailability = useCallback((dishId, payload = {}) => withPendingState(`dish:${dishId}:availability`, async () => {
        ensureWritable();
        const response = await toggleDishAvailability(dishId, payload);
        await refreshKitchenData({ silent: true });
        return response;
    }), [ensureWritable, refreshKitchenData, withPendingState]);

    const activeOrders = useMemo(
        () => sortKitchenOrders(
            orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order?.status)),
            currentTime
        ),
        [currentTime, orders]
    );

    const kitchenMode = useMemo(
        () => extractKitchenMode(user, menuSettings),
        [menuSettings, user]
    );

    const counts = useMemo(
        () => buildKitchenCounts(activeOrders, user?.id, currentTime),
        [activeOrders, currentTime, user?.id]
    );

    const availableOrders = useMemo(
        () => filterKitchenOrders(activeOrders, 'AVAILABLE', user?.id, currentTime),
        [activeOrders, currentTime, user?.id]
    );

    const assignedOrders = useMemo(
        () => filterKitchenOrders(activeOrders, 'MINE', user?.id, currentTime),
        [activeOrders, currentTime, user?.id]
    );

    const unreadUpdatesCount = useMemo(
        () => events.filter((event) => new Date(event.createdAt).getTime() > lastViewedAt).length,
        [events, lastViewedAt]
    );

    const value = useMemo(() => ({
        orders,
        activeOrders,
        assignedOrders,
        availableOrders,
        dishes,
        menuSettings,
        teamMembers,
        events,
        counts,
        filters: KITCHEN_HOME_FILTERS,
        detailsCache,
        loading,
        refreshing,
        pendingActions,
        currentTime,
        isKitchenRole,
        readOnly,
        kitchenMode,
        kitchenModeLabel: getKitchenModeLabel(kitchenMode),
        roleLabel: KITCHEN_ROLE_LABELS[user?.role] || user?.role || 'Kitchen',
        connectionMode,
        connectionLabel: connectionMode === 'live' ? 'Realtime' : 'Polling',
        unreadUpdatesCount,
        getOrderDetails: refreshOrderDetails,
        refresh,
        markUpdatesViewed: () => setLastViewedAt(Date.now()),
        takeOrder,
        startOrder,
        readyOrder,
        delayOrder,
        assignOrder,
        cancelKitchenOrder,
        setDishAvailability,
        getErrorMessage: getApiErrorMessage,
    }), [
        orders,
        activeOrders,
        assignedOrders,
        availableOrders,
        dishes,
        menuSettings,
        teamMembers,
        events,
        counts,
        detailsCache,
        loading,
        refreshing,
        pendingActions,
        currentTime,
        isKitchenRole,
        readOnly,
        kitchenMode,
        connectionMode,
        unreadUpdatesCount,
        refreshOrderDetails,
        refresh,
        takeOrder,
        startOrder,
        readyOrder,
        delayOrder,
        assignOrder,
        cancelKitchenOrder,
        setDishAvailability,
        user?.role,
    ]);

    return (
        <KitchenContext.Provider value={value}>
            {children}
        </KitchenContext.Provider>
    );
}
