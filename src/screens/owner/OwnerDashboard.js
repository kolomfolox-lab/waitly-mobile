import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    RefreshControl,
    Dimensions,
    Image
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats, getOwnerTodayOrders, getDishes, getOwnerStaff } from '../../api/apiService';

const COLORS = {
    primary: '#FF6B6B',
    backgroundLight: '#F8F9FA',
    success: '#52D681',
    successLight: '#E6F8ED',
    warning: '#F7B731',
    warningLight: '#FEF5E6',
    danger: '#FF4757',
    dangerLight: '#FFE8EA',
    white: '#FFFFFF',
    textDark: '#0B1527',
    textMuted: '#8F9BB3',
    slate100: '#F1F5F9',
    chartLine: '#FFA4A4'
};

const { width } = Dimensions.get('window');

export default function OwnerDashboard({ navigation }) {
    const { user, subscriptionLock } = useAuth();
    const [stats, setStats] = useState(null);
    const [todayOrders, setTodayOrders] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [staff, setStaff] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [statsData, ordersData, dishesData, staffData] = await Promise.all([
                getOwnerStats().catch(() => null),
                getOwnerTodayOrders().catch(() => []),
                getDishes().catch(() => []),
                getOwnerStaff().catch(() => [])
            ]);

            if (statsData) setStats(statsData);
            setTodayOrders(Array.isArray(ordersData) ? ordersData : (ordersData?.results || []));
            setDishes(Array.isArray(dishesData) ? dishesData : (dishesData?.results || []));
            setStaff(Array.isArray(staffData) ? staffData : (staffData?.results || []));
        } catch (e) {
            console.log('Owner stats failed:', e.message);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' СУМ';
    };

    const totalRevenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const avgCheck = todayOrders.length > 0 ? (totalRevenue / todayOrders.length) : 0;

    const topDishes: any[] = [];
    const topWaiters: any[] = [];

    const restaurantName = user?.restaurant_name || 'Ресторан Sezam';
    const networkName = user?.network_name || 'Сеть Sezam';

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <View style={styles.logoIcon}>
                                <MaterialIcons name="restaurant" size={20} color={COLORS.white} />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>{restaurantName}</Text>
                                <Text style={styles.headerSub}>{networkName}</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            {subscriptionLock.blocked ? (
                                <View style={styles.subscriptionWarning}>
                                    <MaterialIcons name="warning" size={14} color="#fff" />
                                    <Text style={styles.subscriptionWarningText}>Нет подписки</Text>
                                </View>
                            ) : subscriptionLock.subscriptionExpiresAt ? (
                                <Text style={styles.subscriptionActive}>Активна до {new Date(subscriptionLock.subscriptionExpiresAt).toLocaleDateString('ru-RU')}</Text>
                            ) : null}
                            <TouchableOpacity style={styles.calendarBtn}>
                                <MaterialIcons name="date-range" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Overview Header */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>ОБЗОР</Text>
                        <TouchableOpacity style={styles.dropdownBtn}>
                            <Text style={styles.dropdownText}>Неделя</Text>
                            <MaterialIcons name="keyboard-arrow-down" size={18} color={COLORS.textDark} />
                        </TouchableOpacity>
                    </View>

                    {/* Metric Cards (Orders, Revenue, Avg check matching image copy 5) */}
                    <View style={styles.metricsContainer}>
                        {/* Orders */}
                        <View style={styles.metricCard}>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Заказы</Text>
                                <View style={[styles.badgePill, { backgroundColor: COLORS.successLight }]}>
                                    <Text style={[styles.badgeText, { color: COLORS.success }]}>+12%</Text>
                                </View>
                            </View>
                            <Text style={styles.metricValue}>{todayOrders.length > 0 ? todayOrders.length : 0}</Text>
                        </View>

                        {/* Revenue */}
                        <View style={styles.metricCard}>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Выручка</Text>
                                <View style={[styles.badgePill, { backgroundColor: COLORS.successLight }]}>
                                    <Text style={[styles.badgeText, { color: COLORS.success }]}>+8%</Text>
                                </View>
                            </View>
                            <View style={styles.valueRow}>
                                <Text style={styles.metricValue}>{totalRevenue > 0 ? formatCurrency(totalRevenue).split(' ')[0] : '0'}</Text>
                                <Text style={styles.metricCurrency}>СУМ</Text>
                            </View>
                        </View>

                        {/* Avg Check */}
                        <View style={styles.metricCard}>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Средний чек</Text>
                                <View style={[styles.badgePill, { backgroundColor: COLORS.dangerLight }]}>
                                    <Text style={[styles.badgeText, { color: COLORS.danger }]}>-3%</Text>
                                </View>
                            </View>
                            <View style={styles.valueRow}>
                                <Text style={styles.metricValue}>{avgCheck > 0 ? formatCurrency(avgCheck).split(' ')[0] : '0'}</Text>
                                <Text style={styles.metricCurrency}>СУМ</Text>
                            </View>
                        </View>
                    </View>

                    {/* Orders by Time (Mock Chart) */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitleDark}>Заказы по времени</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        {/* A purely css-based mock curved line using SVG would be best, but we'll use a stylized container for now to avoid breaking without react-native-svg */}
                        <View style={styles.mockChartArea}>
                            {/* Decorative curved shape using borders to simulate a line chart peak */}
                            <View style={styles.mockChartCurveLine} />

                            <View style={styles.chartXAxis}>
                                <Text style={styles.chartXLabel}>08:00</Text>
                                <Text style={styles.chartXLabel}>12:00</Text>
                                <Text style={styles.chartXLabel}>16:00</Text>
                                <Text style={styles.chartXLabel}>20:00</Text>
                                <Text style={styles.chartXLabel}>00:00</Text>
                            </View>
                        </View>
                    </View>

                    {/* Most Popular Dishes */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitleDark}>Популярные блюда</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('OwnerMenuTab')}>
                            <Text style={styles.viewAllText}>Все</Text>
                        </TouchableOpacity>
                    </View>

                    {topDishes.map((dish, i) => (
                        <View key={dish.id || i} style={styles.listCard}>
                            <Image
                                source={{ uri: dish.image || 'https://via.placeholder.com/80' }}
                                style={styles.dishAvatar}
                            />
                            <View style={styles.listCardContent}>
                                <View style={styles.listCardTopRow}>
                                    <Text style={styles.itemName} numberOfLines={1}>{dish.name || 'Пицца Маргарита'}</Text>
                                    <View style={styles.valueRow}>
                                        <Text style={styles.itemRevenue}>{formatCurrency(dish.revenue || 2025000).split(' ')[0]}</Text>
                                        <Text style={styles.itemCurrencyMini}>СУМ</Text>
                                    </View>
                                </View>
                                <View style={styles.listCardBottomRow}>
                                    <Text style={styles.itemSubText}>{dish.ordersCount} заказов</Text>
                                    {/* Progress Bar Mock */}
                                    <View style={styles.progressBarBG}>
                                        <View style={[styles.progressBarFill, { width: `${Math.max(20, Math.min(100, dish.ordersCount * 2))}%` }]} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Top Waiters */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitleDark}>Лучшие официанты</Text>
                    </View>

                    {topWaiters.map((waiter, i) => (
                        <View key={waiter.id || i} style={styles.listCard}>
                            <View style={styles.waiterAvatarBG}>
                                <Image
                                    source={{ uri: `https://i.pravatar.cc/150?u=${waiter.id || i}` }}
                                    style={styles.waiterAvatar}
                                />
                            </View>
                            <View style={styles.listCardContent}>
                                <View style={styles.listCardTopRow}>
                                    <Text style={styles.itemName} numberOfLines={1}>{waiter.full_name || waiter.username || 'Азиз Алиев'}</Text>
                                    <View style={styles.ratingBadge}>
                                        <MaterialIcons name="star" size={12} color={COLORS.warning} />
                                        <Text style={styles.ratingText}>{waiter.rating}</Text>
                                    </View>
                                </View>
                                <View style={styles.listCardBottomRow2}>
                                    <Text style={styles.itemSubTextDark}>{waiter.ordersCount} <Text style={styles.itemSubText}>заказов</Text></Text>
                                    <Text style={styles.itemSubTextDark}>{formatCurrency(waiter.revenue).split(' ')[0]} <Text style={styles.itemSubText}>сум</Text></Text>
                                </View>
                            </View>
                        </View>
                    ))}

                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundLight },
    scrollContent: { paddingBottom: 60 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    subscriptionWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.danger,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    subscriptionWarningText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    subscriptionActive: { fontSize: 11, fontWeight: '600', color: COLORS.success },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoIcon: {
        width: 36, height: 36, backgroundColor: COLORS.primary, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark },
    headerSub: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
    calendarBtn: { padding: 4 },

    sectionHeaderRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingBottom: 16, marginTop: 8
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
    sectionTitleDark: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
    dropdownBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: COLORS.slate100
    },
    dropdownText: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
    viewAllText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

    metricsContainer: { paddingHorizontal: 24, gap: 16, marginBottom: 24 },
    metricCard: {
        backgroundColor: COLORS.white, borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2,
    },
    metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    metricLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
    badgePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '800' },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    metricValue: { fontSize: 32, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
    metricCurrency: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },

    chartContainer: { paddingHorizontal: 24, marginBottom: 32 },
    mockChartArea: {
        height: 180, backgroundColor: COLORS.white, borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2,
        justifyContent: 'flex-end', overflow: 'hidden'
    },
    mockChartCurveLine: {
        position: 'absolute', bottom: -100, left: -50, width: '150%', height: 250,
        borderTopWidth: 2, borderTopColor: COLORS.primary, borderTopLeftRadius: 200, borderTopRightRadius: 200,
        backgroundColor: COLORS.primaryLight + '20'
    },
    chartXAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, zIndex: 10 },
    chartXLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

    listCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: 24, padding: 16, marginHorizontal: 24, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2,
    },
    dishAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.slate100 },
    listCardContent: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    listCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    itemName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, flex: 1 },
    itemRevenue: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
    itemCurrencyMini: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
    listCardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemSubText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
    itemSubTextDark: { fontSize: 13, color: COLORS.textDark, fontWeight: '700' },
    listCardBottomRow2: { flexDirection: 'row', gap: 16 },
    progressBarBG: { flex: 1, height: 6, backgroundColor: COLORS.slate100, borderRadius: 3 },
    progressBarFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },

    waiterAvatarBG: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.warningLight, overflow: 'hidden' },
    waiterAvatar: { width: '100%', height: '100%' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warningLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 12, fontWeight: '800', color: COLORS.warning },
});
