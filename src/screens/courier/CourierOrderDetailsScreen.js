import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import client from '../../api/client';

const STATUS_CONFIG = {
    READY: { label: 'Ready', color: '#f97360', icon: 'check-circle' },
    PICKED_UP: { label: 'Picked Up', color: '#8b5cf6', icon: 'local-shipping' },
    IN_TRANSIT: { label: 'In Transit', color: '#3b82f6', icon: 'navigation' },
    DELIVERED: { label: 'Delivered', color: '#10b981', icon: 'check-circle' },
};

export default function CourierOrderDetailsScreen({ route, navigation }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await client.get(`/core/orders/${orderId}/`);
                setOrder(res.data);
            } catch {
                Alert.alert('Error', 'Could not load order');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [orderId]);

    const handleAction = async (action, endpoint) => {
        try {
            await client.post(`/core/orders/${orderId}/${endpoint}/`);
            const res = await client.get(`/core/orders/${orderId}/`);
            setOrder(res.data);
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.error || `Failed to ${action}`);
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
        );
    }

    if (!order) return null;

    const statusInfo = STATUS_CONFIG[order.status] || { label: order.status, color: '#64748b', icon: 'help' };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{orderId?.slice(0, 8)}</Text>
                <View style={{ width: 24 }} />
            </View>
            <View style={[styles.statusBanner, { backgroundColor: statusInfo.color + '15' }]}>
                <MaterialIcons name={statusInfo.icon} size={28} color={statusInfo.color} />
                <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    <Text style={styles.statusSub}>Current delivery status</Text>
                </View>
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delivery Info</Text>
                <View style={styles.infoRow}>
                    <MaterialIcons name="table-restaurant" size={18} color="#64748b" />
                    <Text style={styles.infoText}>Table {order.table?.number || '—'} · {order.table?.restaurant_name || 'Restaurant'}</Text>
                </View>
                {order.delivery_address ? (
                    <View style={styles.infoRow}>
                        <MaterialIcons name="location-on" size={18} color="#64748b" />
                        <Text style={styles.infoText}>{order.delivery_address}</Text>
                    </View>
                ) : null}
                {order.delivery_phone ? (
                    <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={18} color="#64748b" />
                        <Text style={styles.infoText}>{order.delivery_phone}</Text>
                    </View>
                ) : null}
                {order.created_at ? (
                    <View style={styles.infoRow}>
                        <MaterialIcons name="access-time" size={18} color="#64748b" />
                        <Text style={styles.infoText}>{new Date(order.created_at).toLocaleString()}</Text>
                    </View>
                ) : null}
            </View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {(order.items || []).map((item, i) => (
                    <View key={item.id || i} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.quantity || 1}x {item.dish?.name || item.name || '?'}</Text>
                        <Text style={styles.itemPrice}>{Number(item.price || 0).toLocaleString()} UZS</Text>
                    </View>
                ))}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{Number(order.total_amount || 0).toLocaleString()} UZS</Text>
                </View>
            </View>
            {order.status === 'READY' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAction('pickup', 'pickup')}>
                    <MaterialIcons name="local-shipping" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Mark as Picked Up</Text>
                </TouchableOpacity>
            )}
            {(order.status === 'PICKED_UP' || order.status === 'IN_TRANSIT') && (
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10b981' }]} onPress={() => handleAction('deliver', 'deliver')}>
                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Mark as Delivered</Text>
                </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
    statusBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 20 },
    statusLabel: { fontSize: 18, fontWeight: '800' },
    statusSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
    section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    infoText: { fontSize: 14, color: '#334155', flex: 1 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    itemName: { fontSize: 14, color: '#0f172a', flex: 1 },
    itemPrice: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8 },
    totalLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
    totalValue: { fontSize: 15, fontWeight: '800', color: '#f97360' },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 20, backgroundColor: '#8b5cf6', padding: 18, borderRadius: 20 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
