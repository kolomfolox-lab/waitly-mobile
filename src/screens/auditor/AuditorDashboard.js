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

const ACTION_ICONS = {
    CREATED: 'add-circle',
    UPDATED: 'edit',
    CANCELLED: 'cancel',
    DELETED: 'delete',
    PAYMENT: 'payment',
    REFUND: 'undo',
    LOGIN: 'login',
    LOGOUT: 'logout',
};

export default function AuditorDashboard({ navigation }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [ordersRes, txRes] = await Promise.all([
                client.get('/api/orders/', { params: { limit: 50 } }).catch(() => null),
                client.get('/api/payments/transactions/', { params: { limit: 50 } }).catch(() => null),
            ]);
            if (ordersRes?.data) {
                const data = ordersRes.data.results || ordersRes.data || [];
                setOrders(Array.isArray(data) ? data : []);
            }
            if (txRes?.data) {
                const data = txRes.data.results || txRes.data || [];
                setTransactions(Array.isArray(data) ? data : []);
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

    const auditEntries = [
        ...orders.map(o => ({
            id: `order-${o.id}`,
            type: 'Заказ',
            action: o.status === 'CANCELLED' ? 'CANCELLED' : o.status === 'CREATED' ? 'CREATED' : 'UPDATED',
            description: `Заказ #${o.id} — стол ${o.table?.number || '—'}, ${Number(o.total_amount || 0).toLocaleString()} UZS`,
            user: o.waiter?.full_name || o.waiter_name || 'Система',
            timestamp: o.created_at,
            status: o.status,
        })),
        ...transactions.map(tx => ({
            id: `tx-${tx.id}`,
            type: 'Платёж',
            action: tx.status === 'REFUNDED' ? 'REFUND' : 'PAYMENT',
            description: `Транзакция #${tx.id} — ${tx.provider || 'Онлайн'}, ${Number(tx.amount || 0).toLocaleString()} UZS`,
            user: tx.user?.full_name || 'Система',
            timestamp: tx.created_at,
            status: tx.status,
        })),
    ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATED': return COLORS.success;
            case 'UPDATED': return '#3b82f6';
            case 'CANCELLED':
            case 'DELETED': return COLORS.danger;
            case 'PAYMENT': return COLORS.success;
            case 'REFUND': return COLORS.warning;
            case 'LOGIN': return COLORS.success;
            case 'LOGOUT': return COLORS.textMuted;
            default: return COLORS.textMuted;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Auditor</Text>
                    <Text style={styles.subtitle}>Аудит системы</Text>
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
                    <Text style={styles.title}>Auditor</Text>
                    <Text style={styles.subtitle}>Аудит системы</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{orders.length}</Text>
                        <Text style={styles.statLabel}>Заказов в системе</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{transactions.length}</Text>
                        <Text style={styles.statLabel}>Транзакций</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{auditEntries.length}</Text>
                        <Text style={styles.statLabel}>Событий</Text>
                    </View>
                </View>

                <View style={styles.readonlyBadge}>
                    <MaterialIcons name="visibility" size={16} color={COLORS.textMuted} />
                    <Text style={styles.readonlyText}>Режим только для чтения</Text>
                </View>

                <Text style={styles.sectionTitle}>Лента аудита</Text>
                {auditEntries.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="history" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>нет данных</Text>
                    </View>
                ) : auditEntries.slice(0, 30).map(entry => (
                    <View key={entry.id} style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialIcons
                                name={ACTION_ICONS[entry.action] || 'info'}
                                size={20}
                                color={getActionColor(entry.action)}
                            />
                            <View style={styles.cardContent}>
                                <View style={styles.cardTopRow}>
                                    <Text style={styles.cardTitle}>{entry.type}</Text>
                                    <Text style={styles.cardTime}>{new Date(entry.timestamp).toLocaleString()}</Text>
                                </View>
                                <Text style={styles.cardDesc}>{entry.description}</Text>
                                <Text style={styles.cardUser}>Пользователь: {entry.user}</Text>
                            </View>
                        </View>
                    </View>
                ))}
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
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
    statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
    readonlyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, padding: 10, backgroundColor: COLORS.slate100, borderRadius: 12, marginBottom: 8 },
    readonlyText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardRow: { flexDirection: 'row', gap: 10 },
    cardContent: { flex: 1 },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
    cardTime: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
    cardDesc: { fontSize: 13, color: COLORS.textDark, marginTop: 4 },
    cardUser: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
});
