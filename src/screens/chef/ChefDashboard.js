import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
    acceptOrder,
    fetchActiveOrders,
    markOrderReady,
    startCookingOrder,
} from '../../api/orders';
import { formatElapsed, formatMoney, formatOrderItems, normalizeOrders } from '../../utils/orderFormat';
import { getDeviceLayout, getGridItemWidth } from '../../utils/responsive';
import { getKitchenAction, getStatusLabel, getUrgency, ORDER_STATUS } from '../../utils/orderStatus';
import { shouldAlertForOrders, triggerNewOrderAlert } from '../../services/kitchenAlerts';

const COLORS = {
    primary: '#ff7a59',
    primarySoft: 'rgba(255, 122, 89, 0.15)',
    background: '#0b1320',
    card: '#121d2b',
    cardRaised: '#172638',
    border: '#26384c',
    text: '#f8fafc',
    muted: '#9aa8b7',
    success: '#2dd4bf',
    warning: '#fbbf24',
    danger: '#fb7185',
    dangerSoft: 'rgba(251, 113, 133, 0.14)',
    white: '#ffffff',
};

const REFRESH_INTERVAL_MS = 10000;

export default function ChefDashboard() {
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();
    const layout = useMemo(() => getDeviceLayout(width), [width]);
    const cardWidth = useMemo(
        () => getGridItemWidth(width, layout.columns, layout.gutter),
        [width, layout.columns, layout.gutter]
    );

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyOrderId, setBusyOrderId] = useState(null);
    const [lastAlertAt, setLastAlertAt] = useState(null);
    const [clockTick, setClockTick] = useState(0);
    const seenOrderIds = useRef(new Set());
    const pulse = useRef(new Animated.Value(0)).current;

    const loadOrders = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setRefreshing(true);
        }

        try {
            const payload = await fetchActiveOrders();
            const nextOrders = normalizeOrders(payload);

            if (shouldAlertForOrders(seenOrderIds.current, nextOrders)) {
                triggerNewOrderAlert();
                setLastAlertAt(new Date());
            }

            seenOrderIds.current = new Set(nextOrders.map((order) => order.id));
            setOrders(nextOrders);
        } catch (error) {
            console.error('Failed to load kitchen orders:', error);
            if (!silent) {
                Alert.alert('Kitchen offline', 'Could not load orders. Check connection and try again.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
        const refreshTimer = setInterval(() => loadOrders({ silent: true }), REFRESH_INTERVAL_MS);
        const clockTimer = setInterval(() => setClockTick((value) => value + 1), 30000);

        return () => {
            clearInterval(refreshTimer);
            clearInterval(clockTimer);
        };
    }, [loadOrders]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
            ])
        ).start();
    }, [pulse]);

    const stats = useMemo(() => {
        const open = orders.filter((order) => order.status === ORDER_STATUS.CREATED).length;
        const cooking = orders.filter((order) => order.status === ORDER_STATUS.ACCEPTED || order.status === ORDER_STATUS.COOKING).length;
        const ready = orders.filter((order) => order.status === ORDER_STATUS.READY).length;
        const urgent = orders.filter((order) => ['late', 'critical'].includes(getUrgency(order))).length;
        return { open, cooking, ready, urgent };
    }, [orders, clockTick]);

    const handleAction = async (order) => {
        const action = getKitchenAction(order.status);
        if (!action) {
            return;
        }

        setBusyOrderId(order.id);
        try {
            if (action.nextStatus === ORDER_STATUS.ACCEPTED) {
                await acceptOrder(order.id);
            } else if (action.nextStatus === ORDER_STATUS.COOKING) {
                await startCookingOrder(order.id);
            } else if (action.nextStatus === ORDER_STATUS.READY) {
                await markOrderReady(order.id);
            }
            await loadOrders({ silent: true });
        } catch (error) {
            console.error('Failed to update order status:', error);
            Alert.alert('Status not changed', 'Order was probably updated by another cook. Refreshing now.');
            await loadOrders({ silent: true });
        } finally {
            setBusyOrderId(null);
        }
    };

    const renderOrder = ({ item }) => {
        const action = getKitchenAction(item.status);
        const urgency = getUrgency(item);
        const isBusy = busyOrderId === item.id;
        const isCancelled = item.status === ORDER_STATUS.CANCELLED;
        const scale = urgency === 'critical'
            ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] })
            : 1;

        return (
            <Animated.View style={[
                styles.orderCard,
                { width: cardWidth, minHeight: layout.cardMinHeight, transform: [{ scale }] },
                urgency === 'warning' && styles.orderCardWarning,
                urgency === 'late' && styles.orderCardLate,
                urgency === 'critical' && styles.orderCardCritical,
                isCancelled && styles.orderCardCancelled,
            ]}>
                <View style={styles.orderTopRow}>
                    <View style={styles.tableBadge}>
                        <MaterialIcons name="table-restaurant" size={18} color={COLORS.white} />
                        <Text style={styles.tableText}>Table {item.table_number || '-'}</Text>
                    </View>
                    <View style={[styles.statusPill, isCancelled && styles.statusPillCancelled]}>
                        <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                    </View>
                </View>

                <View style={styles.timerRow}>
                    <Text style={[styles.elapsed, isCancelled && styles.cancelledText]}>
                        {formatElapsed(item.created_at)}
                    </Text>
                    <Text style={styles.target}>target {item.estimated_time || 15}m</Text>
                </View>

                <Text style={[styles.items, isCancelled && styles.cancelledText]} numberOfLines={4}>
                    {formatOrderItems(item.items)}
                </Text>

                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Waiter: {item.waiter_name || 'Unassigned'}</Text>
                    <Text style={styles.metaText}>{formatMoney(item.total_amount)}</Text>
                </View>

                {isCancelled ? (
                    <View style={styles.cancelledBanner}>
                        <MaterialIcons name="block" size={18} color={COLORS.danger} />
                        <Text style={styles.cancelledBannerText}>Cancelled - do not cook</Text>
                    </View>
                ) : action ? (
                    <TouchableOpacity
                        style={[styles.actionButton, styles[`action_${action.tone}`], isBusy && styles.actionDisabled]}
                        onPress={() => handleAction(item)}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <MaterialIcons name="bolt" size={20} color={COLORS.white} />
                                <Text style={styles.actionText}>{action.label}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.readyBanner}>
                        <MaterialIcons name="room-service" size={18} color={COLORS.success} />
                        <Text style={styles.readyBannerText}>Waiting for waiter pickup</Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading kitchen board...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.kicker}>KDS Control</Text>
                    <Text style={styles.title}>Kitchen board</Text>
                    <Text style={styles.subtitle}>
                        {user?.full_name || 'Cook'} - auto refresh every 10 seconds
                    </Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <MaterialIcons name="logout" size={18} color={COLORS.white} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.open}</Text>
                    <Text style={styles.statLabel}>New</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.cooking}</Text>
                    <Text style={styles.statLabel}>In work</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.ready}</Text>
                    <Text style={styles.statLabel}>Ready</Text>
                </View>
                <View style={[styles.statCard, stats.urgent > 0 && styles.statCardUrgent]}>
                    <Text style={[styles.statValue, stats.urgent > 0 && styles.statValueUrgent]}>{stats.urgent}</Text>
                    <Text style={styles.statLabel}>Late</Text>
                </View>
            </View>

            {lastAlertAt && (
                <View style={styles.alertStrip}>
                    <MaterialIcons name="notifications-active" size={18} color={COLORS.primary} />
                    <Text style={styles.alertText}>New order alert at {lastAlertAt.toLocaleTimeString()}</Text>
                </View>
            )}

            <FlatList
                key={layout.columns}
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                numColumns={layout.columns}
                columnWrapperStyle={layout.columns > 1 ? { gap: layout.gutter } : null}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders()} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="restaurant" size={64} color={COLORS.muted} />
                        <Text style={styles.emptyTitle}>Kitchen is clear</Text>
                        <Text style={styles.emptyText}>New guest and waiter orders will appear here automatically.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.muted,
        fontWeight: '700',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    kicker: {
        color: '#8bd8ff',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
    title: {
        color: COLORS.text,
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        color: COLORS.muted,
        fontSize: 14,
        marginTop: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.cardRaised,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 999,
    },
    logoutText: {
        color: COLORS.white,
        fontWeight: '800',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 14,
    },
    statCardUrgent: {
        borderColor: COLORS.danger,
        backgroundColor: COLORS.dangerSoft,
    },
    statValue: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: '900',
    },
    statValueUrgent: {
        color: COLORS.danger,
    },
    statLabel: {
        color: COLORS.muted,
        fontWeight: '800',
        marginTop: 2,
    },
    alertStrip: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primarySoft,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    alertText: {
        color: COLORS.text,
        fontWeight: '800',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },
    orderCard: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
    },
    orderCardWarning: {
        borderColor: COLORS.warning,
    },
    orderCardLate: {
        borderColor: COLORS.danger,
    },
    orderCardCritical: {
        borderColor: COLORS.danger,
        backgroundColor: '#221321',
    },
    orderCardCancelled: {
        opacity: 0.8,
        borderColor: COLORS.danger,
    },
    orderTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    tableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    tableText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '900',
    },
    statusPill: {
        backgroundColor: COLORS.cardRaised,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusPillCancelled: {
        borderColor: COLORS.danger,
        backgroundColor: COLORS.dangerSoft,
    },
    statusText: {
        color: COLORS.text,
        fontWeight: '900',
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 1,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 18,
    },
    elapsed: {
        color: COLORS.text,
        fontSize: 44,
        fontWeight: '900',
        letterSpacing: -1,
    },
    target: {
        color: COLORS.muted,
        fontWeight: '800',
        marginBottom: 8,
    },
    items: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 28,
        marginTop: 10,
    },
    cancelledText: {
        textDecorationLine: 'line-through',
        color: COLORS.muted,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    metaText: {
        color: COLORS.muted,
        fontWeight: '700',
    },
    actionButton: {
        marginTop: 18,
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    action_primary: {
        backgroundColor: COLORS.primary,
    },
    action_warning: {
        backgroundColor: COLORS.warning,
    },
    action_success: {
        backgroundColor: COLORS.success,
    },
    actionDisabled: {
        opacity: 0.6,
    },
    actionText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '900',
    },
    readyBanner: {
        marginTop: 18,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(45, 212, 191, 0.12)',
        borderRadius: 18,
        paddingVertical: 14,
    },
    readyBannerText: {
        color: COLORS.success,
        fontWeight: '900',
    },
    cancelledBanner: {
        marginTop: 18,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.dangerSoft,
        borderRadius: 18,
        paddingVertical: 14,
    },
    cancelledBannerText: {
        color: COLORS.danger,
        fontWeight: '900',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: '900',
        marginTop: 16,
    },
    emptyText: {
        color: COLORS.muted,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
});
