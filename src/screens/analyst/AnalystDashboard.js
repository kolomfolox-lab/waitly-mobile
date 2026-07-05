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
    chartLine: '#FFA4A4',
};

function StatsCard({ icon, label, value, trend, color }) {
    return (
        <View style={styles.statsCard}>
            <View style={[styles.statsIconWrap, { backgroundColor: (color || COLORS.primary) + '15' }]}>
                <MaterialIcons name={icon} size={22} color={color || COLORS.primary} />
            </View>
            <Text style={styles.statsLabel}>{label}</Text>
            <Text style={styles.statsValue}>{value}</Text>
            {trend !== undefined && (
                <View style={styles.trendRow}>
                    <MaterialIcons
                        name={trend >= 0 ? 'trending-up' : 'trending-down'}
                        size={14}
                        color={trend >= 0 ? COLORS.success : COLORS.danger}
                    />
                    <Text style={[styles.trendText, { color: trend >= 0 ? COLORS.success : COLORS.danger }]}>
                        {Math.abs(trend)}%
                    </Text>
                </View>
            )}
        </View>
    );
}

export default function AnalystDashboard({ navigation }) {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await client.get('/api/analytics/').catch(() => null);
            if (res?.data) setAnalytics(res.data);
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

    const revenue = analytics?.daily_revenue || analytics?.total_revenue || 0;
    const ordersCount = analytics?.orders_count || analytics?.total_orders || 0;
    const avgCheck = analytics?.average_check || 0;
    const popularDishes = analytics?.popular_dishes || [];
    const staffPerformance = analytics?.staff_performance || [];

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' UZS';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Analyst</Text>
                    <Text style={styles.subtitle}>Аналитическая панель</Text>
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
                    <Text style={styles.title}>Analyst</Text>
                    <Text style={styles.subtitle}>Аналитическая панель</Text>
                </View>

                <View style={styles.statsGrid}>
                    <StatsCard icon="trending-up" label="Выручка" value={formatCurrency(revenue)} trend={12} color={COLORS.success} />
                    <StatsCard icon="receipt-long" label="Заказов" value={String(ordersCount)} trend={8} color={COLORS.primary} />
                    <StatsCard icon="account-balance-wallet" label="Средний чек" value={formatCurrency(avgCheck)} trend={-3} color={COLORS.warning} />
                    <StatsCard icon="people" label="Сотрудников" value={String(staffPerformance.length || 0)} color="#8b5cf6" />
                </View>

                <Text style={styles.sectionTitle}>Популярные блюда</Text>
                {popularDishes.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="restaurant" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>нет данных</Text>
                    </View>
                ) : popularDishes.map((dish, i) => (
                    <View key={dish.id || i} style={styles.listCard}>
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>{i + 1}</Text>
                        </View>
                        <View style={styles.listCardContent}>
                            <Text style={styles.dishName}>{dish.name}</Text>
                            <View style={styles.dishStats}>
                                <Text style={styles.dishStat}>{dish.orders_count || 0} заказов</Text>
                                <Text style={styles.dishStat}>{formatCurrency(dish.revenue || 0)}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Эффективность персонала</Text>
                {staffPerformance.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="people" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>нет данных</Text>
                    </View>
                ) : staffPerformance.map((person, i) => (
                    <View key={person.id || i} style={styles.listCard}>
                        <View style={[styles.avatarSmall, { backgroundColor: COLORS.primary + '20' }]}>
                            <MaterialIcons name="person" size={18} color={COLORS.primary} />
                        </View>
                        <View style={styles.listCardContent}>
                            <Text style={styles.dishName}>{person.full_name || person.username}</Text>
                            <View style={styles.dishStats}>
                                <Text style={styles.dishStat}>{person.orders_count || 0} заказов</Text>
                                <Text style={styles.dishStat}>{formatCurrency(person.revenue || 0)}</Text>
                            </View>
                        </View>
                        {person.rating && (
                            <View style={styles.ratingBadge}>
                                <MaterialIcons name="star" size={12} color={COLORS.warning} />
                                <Text style={styles.ratingText}>{person.rating}</Text>
                            </View>
                        )}
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
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
    statsCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statsIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statsLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    statsValue: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginTop: 4 },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    trendText: { fontSize: 12, fontWeight: '700' },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
    listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
    avatarSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    listCardContent: { flex: 1 },
    dishName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
    dishStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
    dishStat: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 12, fontWeight: '800', color: COLORS.warning },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
});
