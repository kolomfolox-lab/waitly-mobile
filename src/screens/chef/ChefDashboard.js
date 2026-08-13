import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Animated, FlatList, Modal, RefreshControl,
    SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity,
    useWindowDimensions, View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { acceptOrder, fetchActiveOrders, markOrderReady, startCookingOrder } from '../../api/orders';
import client from '../../api/client';
import { formatElapsed, formatMoney, formatOrderItems, normalizeOrders } from '../../utils/orderFormat';
import { getDeviceLayout, getGridItemWidth } from '../../utils/responsive';
import { getKitchenAction, getStatusLabel, getUrgency, ORDER_STATUS } from '../../utils/orderStatus';
import { shouldAlertForOrders, triggerNewOrderAlert } from '../../services/kitchenAlerts';

const COLORS = {
    primary: '#ff6b6b', primarySoft: 'rgba(255, 107, 107, 0.15)',
    background: '#f8f5f5', card: '#ffffff', cardRaised: '#fafafa',
    border: '#e2e8f0', text: '#0f172a', muted: '#94a3b8',
    success: '#52D681', warning: '#F7B731', danger: '#ff6b6b',
    dangerSoft: 'rgba(255, 107, 107, 0.12)', white: '#ffffff',
    accent: '#667eea',
};

const REFRESH_INTERVAL_MS = 10000;

export default function ChefDashboard() {
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();
    const layout = useMemo(() => getDeviceLayout(width), [width]);
    const cardWidth = useMemo(() => getGridItemWidth(width, layout.columns, layout.gutter), [width, layout.columns, layout.gutter]);

    const [orders, setOrders] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyOrderId, setBusyOrderId] = useState(null);
    const [lastAlertAt, setLastAlertAt] = useState(null);
    const [clockTick, setClockTick] = useState(0);
    const [selectedStationId, setSelectedStationId] = useState(null);
    const [techModal, setTechModal] = useState(null);
    const seenOrderIds = useRef(new Set());
    const pulse = useRef(new Animated.Value(0)).current;

    const loadOrders = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setRefreshing(true);
        try {
            const payload = await fetchActiveOrders();
            const nextOrders = normalizeOrders(payload);
            if (shouldAlertForOrders(seenOrderIds.current, nextOrders)) {
                triggerNewOrderAlert();
                setLastAlertAt(new Date());
            }
            seenOrderIds.current = new Set(nextOrders.map((o) => o.id));
            setOrders(nextOrders);
        } catch (e) {
            if (!silent) Alert.alert('Kitchen offline', 'Could not load orders.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const loadStations = useCallback(async () => {
        try {
            const res = await client.get('/kitchen/stations/');
            setStations(res.data || []);
        } catch { /* ignore */ }
    }, []);

    const loadTechCard = async (dishId) => {
        try {
            const res = await client.get(`/inventory/tech-cards/?dish_id=${dishId}`);
            if (res.data && res.data.length > 0) {
                setTechModal(res.data[0]);
            } else {
                alert('Тех-карта не найдена для этого блюда.');
            }
        } catch {
            alert('Не удалось загрузить тех-карту.');
        }
    };

    useEffect(() => {
        loadOrders();
        loadStations();
        const refreshTimer = setInterval(() => loadOrders({ silent: true }), REFRESH_INTERVAL_MS);
        const clockTimer = setInterval(() => setClockTick(v => v + 1), 30000);
        return () => { clearInterval(refreshTimer); clearInterval(clockTimer); };
    }, [loadOrders, loadStations]);

    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
        ])).start();
    }, [pulse]);

    const filteredOrders = useMemo(() => {
        if (!selectedStationId) return orders;
        return orders.filter(order =>
            order.items && order.items.some(item => item.station_id === selectedStationId)
        );
    }, [orders, selectedStationId]);

    const stats = useMemo(() => {
        const o = filteredOrders;
        const open = o.filter(r => r.status === ORDER_STATUS.CREATED).length;
        const cooking = o.filter(r => [ORDER_STATUS.ACCEPTED, ORDER_STATUS.COOKING].includes(r.status)).length;
        const ready = o.filter(r => r.status === ORDER_STATUS.READY).length;
        const urgent = o.filter(r => ['late', 'critical'].includes(getUrgency(r))).length;
        const completed = o.filter(r => r.status === ORDER_STATUS.DELIVERED).length;
        return { open, cooking, ready, urgent, completed, total: o.length };
    }, [filteredOrders, clockTick]);

    const handleAction = async (order) => {
        const action = getKitchenAction(order.status);
        if (!action) return;
        setBusyOrderId(order.id);
        try {
            if (action.nextStatus === ORDER_STATUS.ACCEPTED) await acceptOrder(order.id);
            else if (action.nextStatus === ORDER_STATUS.COOKING) await startCookingOrder(order.id);
            else if (action.nextStatus === ORDER_STATUS.READY) await markOrderReady(order.id);
            await loadOrders({ silent: true });
        } catch (e) {
            Alert.alert('Status not changed', 'Refresh.');
            await loadOrders({ silent: true });
        } finally { setBusyOrderId(null); }
    };

    const renderOrder = ({ item }) => {
        const action = getKitchenAction(item.status);
        const urgency = getUrgency(item);
        const isBusy = busyOrderId === item.id;
        const isCancelled = item.status === ORDER_STATUS.CANCELLED;
        const scale = urgency === 'critical' ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) : 1;

        return (
            <Animated.View style={[
                styles.orderCard, { width: cardWidth, minHeight: layout.cardMinHeight, transform: [{ scale }] },
                urgency === 'warning' && styles.cardWarning,
                urgency === 'late' && styles.cardLate,
                urgency === 'critical' && styles.cardCritical,
                isCancelled && styles.cardCancelled,
            ]}>
                <View style={styles.orderTopRow}>
                    <View style={styles.tableBadge}>
                        <MaterialIcons name="table-restaurant" size={18} color={COLORS.white} />
                        <Text style={styles.tableText}>Table {item.table_number || '-'}</Text>
                    </View>
                    <View style={[styles.statusPill, isCancelled && styles.pillCancelled]}>
                        <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                    </View>
                </View>
                <View style={styles.timerRow}>
                    <Text style={[styles.elapsed, isCancelled && styles.cancelledText]}>{formatElapsed(item.created_at)}</Text>
                    <Text style={styles.target}>target {item.estimated_time || 15}m</Text>
                </View>
                <Text style={[styles.items, isCancelled && styles.cancelledText]} numberOfLines={4}>{formatOrderItems(item.items)}</Text>

                {!isCancelled && item.items && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {item.items.map((dish, idx) => (
                            <TouchableOpacity key={idx} onPress={() => loadTechCard(dish.dish_id)} style={styles.techChip}>
                                <Text style={{ fontSize: 9, color: COLORS.accent, fontWeight: '700' }}>📋 карта</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

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
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: action.tone === 'warning' ? COLORS.warning : action.tone === 'success' ? COLORS.success : COLORS.primary }, isBusy && { opacity: 0.6 }]}
                        onPress={() => handleAction(item)} disabled={isBusy}>
                        {isBusy ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.actionText}>{action.label}</Text>}
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
                    <Text style={styles.subtitle}>{user?.full_name || 'Cook'} - auto refresh 10s</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <MaterialIcons name="logout" size={18} color={COLORS.white} />
                    <Text style={styles.logoutText}>Exit</Text>
                </TouchableOpacity>
            </View>

            {/* Station filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity onPress={() => setSelectedStationId(null)}
                    style={[styles.stationChip, !selectedStationId && styles.stationChipActive]}>
                    <Text style={[styles.stationChipText, !selectedStationId && styles.stationChipTextActive]}>Все станции</Text>
                </TouchableOpacity>
                {stations.map(s => (
                    <TouchableOpacity key={s.id} onPress={() => setSelectedStationId(s.id)}
                        style={[styles.stationChip, selectedStationId === s.id && styles.stationChipActive]}>
                        <Text style={[styles.stationChipText, selectedStationId === s.id && styles.stationChipTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

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
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Done</Text>
                </View>
            </View>

            <FlatList key={layout.columns} data={filteredOrders} renderItem={renderOrder}
                keyExtractor={item => item.id} numColumns={layout.columns}
                columnWrapperStyle={layout.columns > 1 ? { gap: layout.gutter } : null}
                contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders()} tintColor={COLORS.primary} />}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 80 }}>
                        <MaterialIcons name="restaurant" size={64} color={COLORS.muted} />
                        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '900', marginTop: 16 }}>Kitchen is clear</Text>
                    </View>
                }
            />

            {/* Tech Card Modal */}
            <Modal visible={!!techModal} animationType="slide" transparent>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>Тех-карта</Text>
                            <TouchableOpacity onPress={() => setTechModal(null)}>
                                <MaterialIcons name="close" size={24} color={COLORS.muted} />
                            </TouchableOpacity>
                        </View>
                        {techModal && (
                            <ScrollView>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>{techModal.dish_name}</Text>
                                <Text style={{ color: COLORS.muted, marginBottom: 8 }}>Выход: {techModal.yield_amount} порц. | Время: {techModal.cooking_time_minutes} мин</Text>
                                {techModal.cooking_instructions ? (
                                    <View style={{ marginVertical: 12 }}>
                                        <Text style={{ fontWeight: '800', marginBottom: 4, color: COLORS.text }}>Инструкция:</Text>
                                        <Text style={{ color: COLORS.text, lineHeight: 22 }}>{techModal.cooking_instructions}</Text>
                                    </View>
                                ) : null}
                                {techModal.items && techModal.items.length > 0 && (
                                    <>
                                        <Text style={{ fontWeight: '800', marginBottom: 8, marginTop: 8, color: COLORS.text }}>Ингредиенты:</Text>
                                        {techModal.items.map((item, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
                                                <Text style={{ color: COLORS.text, flex: 1 }}>{item.ingredient_name}</Text>
                                                <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                                                    {item.gross_weight ? `${item.gross_weight}g/` : ''}{item.quantity_needed} {item.ingredient_unit}
                                                    {item.net_weight ? ` (нетто ${item.net_weight}g)` : ''}
                                                </Text>
                                            </View>
                                        ))}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: COLORS.text }}>
                                            <Text style={{ fontWeight: '900', color: COLORS.text }}>Себестоимость:</Text>
                                            <Text style={{ fontWeight: '900', color: COLORS.primary }}>{formatMoney(techModal.total_cost)}</Text>
                                        </View>
                                    </>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 12, color: COLORS.muted, fontWeight: '700' },
    header: { paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
    kicker: { color: '#8bd8ff', fontSize: 11, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
    title: { color: COLORS.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    subtitle: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
    stationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    stationChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    stationChipText: { fontSize: 13, fontWeight: '700', color: COLORS.muted },
    stationChipTextActive: { color: COLORS.white },
    logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.cardRaised, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 999 },
    logoutText: { color: COLORS.text, fontWeight: '800' },
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
    statCard: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14 },
    statCardUrgent: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerSoft },
    statValue: { color: COLORS.text, fontSize: 28, fontWeight: '900' },
    statValueUrgent: { color: COLORS.danger },
    statLabel: { color: COLORS.muted, fontWeight: '800', marginTop: 2 },
    orderCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, padding: 18, marginBottom: 16 },
    cardWarning: { borderColor: COLORS.warning },
    cardLate: { borderColor: COLORS.danger },
    cardCritical: { borderColor: COLORS.danger, backgroundColor: COLORS.primarySoft },
    cardCancelled: { opacity: 0.8, borderColor: COLORS.danger },
    orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    tableBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    tableText: { color: COLORS.white, fontSize: 18, fontWeight: '900' },
    statusPill: { backgroundColor: COLORS.cardRaised, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    pillCancelled: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerSoft },
    statusText: { color: COLORS.text, fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
    timerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18 },
    elapsed: { color: COLORS.text, fontSize: 44, fontWeight: '900', letterSpacing: -1 },
    target: { color: COLORS.muted, fontWeight: '800', marginBottom: 8 },
    items: { color: COLORS.text, fontSize: 20, fontWeight: '800', lineHeight: 28, marginTop: 10 },
    cancelledText: { textDecorationLine: 'line-through', color: COLORS.muted },
    techChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(102,126,234,0.12)', borderWidth: 1, borderColor: 'rgba(102,126,234,0.3)' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
    metaText: { color: COLORS.muted, fontWeight: '700' },
    actionButton: { marginTop: 18, borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    actionText: { color: COLORS.white, fontSize: 18, fontWeight: '900' },
    readyBanner: { marginTop: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(45,212,191,0.12)', borderRadius: 18, paddingVertical: 14 },
    readyBannerText: { color: COLORS.success, fontWeight: '900' },
    cancelledBanner: { marginTop: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.dangerSoft, borderRadius: 18, paddingVertical: 14 },
    cancelledBannerText: { color: COLORS.danger, fontWeight: '900' },
});
