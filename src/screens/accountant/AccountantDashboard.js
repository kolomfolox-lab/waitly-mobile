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

const TRANSACTION_STATUS = {
    COMPLETED: { label: 'Завершён', color: COLORS.success },
    PENDING: { label: 'Ожидает', color: COLORS.warning },
    FAILED: { label: 'Ошибка', color: COLORS.danger },
    REFUNDED: { label: 'Возврат', color: '#8b5cf6' },
};

export default function AccountantDashboard({ navigation }) {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [analyticsRes, txRes] = await Promise.all([
                client.get('/api/analytics/').catch(() => null),
                client.get('/api/payments/transactions/').catch(() => null),
            ]);
            if (analyticsRes?.data) setAnalytics(analyticsRes.data);
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

    const dailyRevenue = analytics?.daily_revenue || analytics?.total_revenue || 0;
    const paymentMethods = analytics?.payment_methods || {};
    const pendingPayouts = analytics?.pending_payouts || 0;

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' UZS';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Accountant</Text>
                    <Text style={styles.subtitle}>Финансовая панель</Text>
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
                    <Text style={styles.title}>Accountant</Text>
                    <Text style={styles.subtitle}>Финансовая панель</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Дневная выручка</Text>
                        <Text style={styles.statValue}>{formatCurrency(dailyRevenue)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Ожидает выплат</Text>
                        <Text style={styles.statValue}>{formatCurrency(pendingPayouts)}</Text>
                    </View>
                </View>

                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Способы оплаты</Text>
                </View>
                <View style={styles.pmCard}>
                    {Object.keys(paymentMethods).length === 0 ? (
                        <Text style={styles.emptySmallText}>нет данных</Text>
                    ) : Object.entries(paymentMethods).map(([method, amount]) => (
                        <View key={method} style={styles.pmRow}>
                            <Text style={styles.pmLabel}>{method}</Text>
                            <Text style={styles.pmValue}>{formatCurrency(amount)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Последние транзакции</Text>
                </View>
                {transactions.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>нет данных</Text>
                    </View>
                ) : transactions.slice(0, 10).map(tx => (
                    <View key={tx.id} style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialIcons
                                name={tx.status === 'COMPLETED' ? 'check-circle' : tx.status === 'FAILED' ? 'error' : 'schedule'}
                                size={20}
                                color={TRANSACTION_STATUS[tx.status]?.color || COLORS.textMuted}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{tx.provider || 'Онлайн'}</Text>
                                <Text style={styles.cardSub}>{tx.description || `Транзакция #${tx.id}`}</Text>
                            </View>
                            <View style={styles.txRight}>
                                <Text style={styles.cardAmount}>{Number(tx.amount || 0).toLocaleString()} UZS</Text>
                                <View style={[styles.badge, { backgroundColor: (TRANSACTION_STATUS[tx.status]?.color || COLORS.textMuted) + '20' }]}>
                                    <Text style={[styles.badgeText, { color: TRANSACTION_STATUS[tx.status]?.color || COLORS.textMuted }]}>
                                        {TRANSACTION_STATUS[tx.status]?.label || tx.status}
                                    </Text>
                                </View>
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
    statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6 },
    statValue: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
    pmCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    pmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
    pmLabel: { fontSize: 14, color: COLORS.textDark, fontWeight: '600' },
    pmValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '700' },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    cardAmount: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
    txRight: { alignItems: 'flex-end', gap: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
    emptySmallText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', padding: 16 },
});
