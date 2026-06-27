import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const STATUS_CONFIG = {
    READY: { label: 'Ready', icon: 'check-circle', color: '#f97360' },
    PICKED_UP: { label: 'Picked Up', icon: 'local-shipping', color: '#8b5cf6' },
    IN_TRANSIT: { label: 'In Transit', icon: 'navigation', color: '#3b82f6' },
    DELIVERED: { label: 'Delivered', icon: 'check-circle', color: '#10b981' },
};

const FILTERS = [
    { key: 'READY', label: 'New' },
    { key: 'PICKED_UP', label: 'Picked Up' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'DELIVERED', label: 'Delivered' },
];

export default function CourierDashboard({ navigation }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('READY');

    const fetchOrders = useCallback(async () => {
        try {
            const res = await client.get('/mobile/orders/', {
                params: { courier_id: user?.id, status: 'READY,PICKED_UP,IN_TRANSIT' },
            });
            const data = res.data?.results || res.data || [];
            setOrders(Array.isArray(data) ? data : []);
        } catch {
            // silently fail on network error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = useMemo(() => {
        if (activeFilter === 'READY') return orders.filter(o => o.status === 'READY');
        if (activeFilter === 'PICKED_UP') return orders.filter(o => o.status === 'PICKED_UP');
        if (activeFilter === 'IN_TRANSIT') return orders.filter(o => o.status === 'IN_TRANSIT');
        if (activeFilter === 'DELIVERED') return orders.filter(o => o.status === 'DELIVERED');
        return orders;
    }, [orders, activeFilter]);

    const counts = useMemo(() => {
        const c = {};
        FILTERS.forEach(f => {
            c[f.key] = orders.filter(o => {
                if (f.key === 'READY') return o.status === 'READY';
                if (f.key === 'PICKED_UP') return o.status === 'PICKED_UP';
                if (f.key === 'IN_TRANSIT') return o.status === 'IN_TRANSIT';
                if (f.key === 'DELIVERED') return o.status === 'DELIVERED';
                return false;
            }).length;
        });
        return c;
    }, [orders]);

    const handlePickup = async (orderId) => {
        try {
            await client.post(`/core/orders/${orderId}/pickup/`);
            fetchOrders();
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.error || 'Failed to mark pickup');
        }
    };

    const handleDeliver = async (orderId) => {
        try {
            await client.post(`/core/orders/${orderId}/deliver/`);
            fetchOrders();
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.error || 'Failed to mark delivered');
        }
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CourierOrderDetails', { orderId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.tableNumber}>Table {item.table?.number || '—'}</Text>
                    {item.delivery_address ? (
                        <Text style={styles.address} numberOfLines={1}>{item.delivery_address}</Text>
                    ) : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[item.status]?.color + '20' || '#f1f5f9' }]}>
                    <MaterialIcons name={STATUS_CONFIG[item.status]?.icon || 'help'} size={14} color={STATUS_CONFIG[item.status]?.color || '#64748b'} />
                    <Text style={[styles.statusText, { color: STATUS_CONFIG[item.status]?.color || '#64748b' }]}>
                        {STATUS_CONFIG[item.status]?.label || item.status}
                    </Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.itemsText} numberOfLines={2}>
                    {(item.items || []).map(i => `${i.quantity || 1}x ${i.dish?.name || i.name || '?'}`).join(', ')}
                </Text>
                <Text style={styles.totalText}>{Number(item.total_amount || 0).toLocaleString()} UZS</Text>
            </View>
            <View style={styles.cardActions}>
                {item.status === 'READY' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handlePickup(item.id)}>
                        <MaterialIcons name="local-shipping" size={16} color="#fff" />
                        <Text style={styles.actionText}>Pick Up</Text>
                    </TouchableOpacity>
                )}
                {(item.status === 'PICKED_UP' || item.status === 'IN_TRANSIT') && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleDeliver(item.id)}>
                        <MaterialIcons name="check-circle" size={16} color="#fff" />
                        <Text style={styles.actionText}>Deliver</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Courier</Text>
                    <Text style={styles.subtitle}>Delivery dashboard</Text>
                </View>
                <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 60 }} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Courier</Text>
                <Text style={styles.subtitle}>Your deliveries · {orders.length} total</Text>
            </View>
            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                        onPress={() => setActiveFilter(f.key)}
                    >
                        <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                            {f.label} ({counts[f.key] || 0})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <FlatList
                data={filteredOrders}
                keyExtractor={item => String(item.id)}
                renderItem={renderOrder}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialIcons name="motorcycle" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No deliveries here</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9' },
    filterChipActive: { backgroundColor: '#8b5cf6' },
    filterText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
    filterTextActive: { color: '#fff' },
    list: { padding: 16, paddingBottom: 32 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderInfo: { flex: 1 },
    tableNumber: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
    address: { fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '700' },
    cardBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    itemsText: { fontSize: 13, color: '#334155', lineHeight: 18 },
    totalText: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 6 },
    cardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#8b5cf6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
    actionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 15, color: '#94a3b8', marginTop: 12 },
});
