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
    { key: 'orders', label: 'Заказы поставщикам', icon: 'shopping-cart' },
    { key: 'supplies', label: 'Поставки', icon: 'local-shipping' },
];

const ORDER_STATUS = {
    PENDING: { label: 'Ожидает', color: COLORS.warning },
    APPROVED: { label: 'Подтверждён', color: '#3b82f6' },
    SHIPPED: { label: 'Отгружен', color: COLORS.primary },
    RECEIVED: { label: 'Получен', color: COLORS.success },
    CANCELLED: { label: 'Отменён', color: COLORS.danger },
};

export default function SupplierDashboard({ navigation }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('orders');
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [ordersRes, receiptsRes] = await Promise.all([
                client.get('/api/suppliers/orders/').catch(() => null),
                client.get('/api/suppliers/receipts/').catch(() => null),
            ]);
            if (ordersRes?.data) {
                const data = ordersRes.data.results || ordersRes.data || [];
                setPurchaseOrders(Array.isArray(data) ? data : []);
            }
            if (receiptsRes?.data) {
                const data = receiptsRes.data.results || receiptsRes.data || [];
                setReceipts(Array.isArray(data) ? data : []);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const getStatusBadge = (status) => {
        const config = ORDER_STATUS[status] || { label: status, color: COLORS.textMuted };
        return (
            <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
                <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
            </View>
        );
    };

    const renderOrdersTab = () => (
        <>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{purchaseOrders.filter(o => o.status === 'PENDING').length}</Text>
                    <Text style={styles.statLabel}>Ожидают</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{purchaseOrders.filter(o => o.status === 'APPROVED' || o.status === 'SHIPPED').length}</Text>
                    <Text style={styles.statLabel}>В работе</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{purchaseOrders.filter(o => o.status === 'RECEIVED').length}</Text>
                    <Text style={styles.statLabel}>Получено</Text>
                </View>
            </View>
            <Text style={styles.sectionTitle}>Заказы поставщикам</Text>
            {purchaseOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="shopping-cart" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : purchaseOrders.map(order => (
                <View key={order.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <MaterialIcons name="inventory" size={20} color={COLORS.primary} />
                        <View style={{ flex: 1 }}>
                            <View style={styles.cardTitleRow}>
                                <Text style={styles.cardTitle}>Заказ №{order.id}</Text>
                                {getStatusBadge(order.status)}
                            </View>
                            <Text style={styles.cardSub}>Поставщик: {order.supplier?.name || order.supplier_name || '—'}</Text>
                            <Text style={styles.cardSub}>Сумма: {Number(order.total_amount || 0).toLocaleString()} UZS</Text>
                            {order.expected_date && (
                                <Text style={styles.cardSub}>Ожидается: {new Date(order.expected_date).toLocaleDateString()}</Text>
                            )}
                        </View>
                    </View>
                    {order.items && order.items.length > 0 && (
                        <View style={styles.itemsList}>
                            {order.items.slice(0, 3).map((item, i) => (
                                <Text key={i} style={styles.itemText}>
                                    {item.quantity}x {item.name || item.product_name}
                                </Text>
                            ))}
                            {order.items.length > 3 && (
                                <Text style={styles.itemText}>... и ещё {order.items.length - 3}</Text>
                            )}
                        </View>
                    )}
                </View>
            ))}
        </>
    );

    const renderSuppliesTab = () => (
        <>
            <Text style={styles.sectionTitle}>Последние поставки</Text>
            {receipts.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="local-shipping" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : receipts.map(receipt => (
                <View key={receipt.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <MaterialIcons name="assignment-returned" size={20} color={COLORS.success} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Поставка #{receipt.id}</Text>
                            <Text style={styles.cardSub}>Поставщик: {receipt.supplier?.name || receipt.supplier_name || '—'}</Text>
                            <Text style={styles.cardSub}>
                                Дата: {new Date(receipt.received_at || receipt.created_at).toLocaleDateString()}
                            </Text>
                            <Text style={styles.cardSub}>Сумма: {Number(receipt.total_amount || 0).toLocaleString()} UZS</Text>
                        </View>
                        <MaterialIcons name="check-circle" size={20} color={COLORS.success} />
                    </View>
                </View>
            ))}
        </>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Supplier</Text>
                    <Text style={styles.subtitle}>Панель поставщика</Text>
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
                    <Text style={styles.title}>Supplier</Text>
                    <Text style={styles.subtitle}>Панель поставщика</Text>
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

                {activeTab === 'orders' ? renderOrdersTab() : renderSuppliesTab()}
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
    cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1 },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    itemsList: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.slate100 },
    itemText: { fontSize: 12, color: COLORS.textDark, fontWeight: '600', marginBottom: 2 },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
});
