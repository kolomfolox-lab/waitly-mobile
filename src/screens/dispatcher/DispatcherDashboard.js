import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    RefreshControl, TouchableOpacity, SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    danger: '#FF4757',
    white: '#FFFFFF',
    textDark: '#0B1527',
    textMuted: '#8F9BB3',
    slate100: '#F1F5F9',
};

const TABS = [
    { key: 'deliveries', label: 'Доставки', icon: 'local-shipping' },
    { key: 'assign', label: 'Назначить', icon: 'assignment' },
];

const STATUS_CONFIG = {
    CREATED: { label: 'Новый', color: COLORS.warning },
    READY: { label: 'Готов', color: COLORS.success },
    IN_TRANSIT: { label: 'В пути', color: '#3b82f6' },
    DELIVERED: { label: 'Доставлен', color: COLORS.success },
    CANCELLED: { label: 'Отменён', color: COLORS.danger },
};

export default function DispatcherDashboard({ navigation }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('deliveries');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await client.get('/api/orders/orders/', {
                params: { status: 'CREATED,READY,IN_TRANSIT', is_delivery: true }
            }).catch(() => null);
            if (res?.data) {
                const data = res.data.results || res.data || [];
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, [fetchOrders]);

    const newOrders = orders.filter(o => o.status === 'CREATED');
    const activeDeliveries = orders.filter(o => o.status === 'READY' || o.status === 'IN_TRANSIT');

    const assignCourier = async (orderId) => {
        // placeholder
    };

    const renderDeliveriesTab = () => (
        <>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{newOrders.length}</Text>
                    <Text style={styles.statLabel}>Новые доставки</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{activeDeliveries.length}</Text>
                    <Text style={styles.statLabel}>Активные</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{orders.filter(o => o.status === 'DELIVERED').length}</Text>
                    <Text style={styles.statLabel}>Доставлено</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Активные доставки</Text>
            {orders.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="local-shipping" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : orders.map(order => (
                <View key={order.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Заказ №{order.id}</Text>
                            <Text style={styles.cardSub}>{order.delivery_address || 'Адрес не указан'}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: (STATUS_CONFIG[order.status]?.color || COLORS.textMuted) + '20' }]}>
                            <Text style={[styles.badgeText, { color: STATUS_CONFIG[order.status]?.color || COLORS.textMuted }]}>
                                {STATUS_CONFIG[order.status]?.label || order.status}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardMeta}>
                        <Text style={styles.metaText}>Сумма: {Number(order.total_amount || 0).toLocaleString()} UZS</Text>
                        <Text style={styles.metaText}>Курьер: {order.courier?.full_name || 'не назначен'}</Text>
                    </View>
                    {order.status === 'CREATED' && (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => assignCourier(order.id)}>
                            <MaterialIcons name="person-add" size={16} color={COLORS.white} />
                            <Text style={styles.actionText}>Назначить курьера</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </>
    );

    const renderAssignTab = () => (
        <>
            <Text style={styles.sectionTitle}>Заказы на назначение</Text>
            {newOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="assignment" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : newOrders.map(order => (
                <View key={order.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <MaterialIcons name="receipt" size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>Заказ №{order.id}</Text>
                    </View>
                    <Text style={styles.cardSub}>{order.delivery_address}</Text>
                    <Text style={styles.cardSub}>Сумма: {Number(order.total_amount || 0).toLocaleString()} UZS</Text>
                    <TouchableOpacity style={styles.actionBtn}>
                        <MaterialIcons name="assignment-ind" size={16} color={COLORS.white} />
                        <Text style={styles.actionText}>Назначить курьера</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Dispatcher</Text>
                    <Text style={styles.subtitle}>Управление доставками</Text>
                </View>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Dispatcher</Text>
                    <Text style={styles.subtitle}>Управление доставками</Text>
                </View>

                <View style={styles.tabRow}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <MaterialIcons name={tab.icon} size={16} color={activeTab === tab.key ? COLORS.white : COLORS.textMuted} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'deliveries' ? renderDeliveriesTab() : renderAssignTab()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundLight },
    scrollContent: { paddingBottom: 60 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
    subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.white },
    tabChipActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    tabTextActive: { color: COLORS.white },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
    statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1 },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.slate100 },
    metaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start' },
    actionText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
});
