import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getOrders, getTables, getTodayBookings, getWaiterTipStats } from '../../api/apiService';
import UserAvatar from '../../components/common/UserAvatar';
import { loadStoredAvatarPreset } from '../../utils/avatar';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.15)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    info: '#4EA8DE',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate800: '#1e293b',
    slate700: '#334155',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
};

const { width } = Dimensions.get('window');

export default function WaiterDashboard({ navigation }) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [avatarPresetId, setAvatarPresetId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    const [stats, setStats] = useState({
        tables: { total: 0, available: 0 },
        orders: { active: 0, readyToDeliver: 0 },
        bookings: { today: 0 },
        todaySummary: { count: 0, amount: 0 }
    });

    const [recentActions, setRecentActions] = useState([]);
    const [tipStats, setTipStats] = useState({ total: '0', count: 0 });

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const cardScale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(cardScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Shimmer loop
        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            ]),
        );
        shimmerLoop.start();
        return () => shimmerLoop.stop();
    }, []);

    const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const fetchDashboardData = useCallback(async (isRetry) => {
        if (!isRetry) setLoading(true);
        setLoadError(null);
        try {
            // Fetch everything we need for the dashboard
            const [ordersData, tablesData, bookingsData, tipsData] = await Promise.all([
                getOrders().catch(() => ({ results: [] })),
                getTables().catch(() => ({ results: [] })),
                getTodayBookings().catch(() => []),
                getWaiterTipStats().catch(() => ({ total: '0', count: 0 })),
            ]);
            setTipStats(tipsData);

            const orders = ordersData.results || ordersData || [];
            const tables = tablesData.results || tablesData || [];
            const bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.results || []);

            // Process Orders
            const activeOrders = orders.filter(o =>
                ['CREATED', 'ACCEPTED', 'COOKING', 'READY'].includes(o.status)
            );
            const readyOrders = orders.filter(o => o.status === 'READY');

            // Calculate Today's Summary (Using all orders returned, which are usually latest)
            const todayOrders = orders.filter(o => {
                if (!o.created_at) return false;
                const date = new Date(o.created_at);
                const today = new Date();
                return date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
            });

            const sum = todayOrders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);

            // Process Tables
            const bookedTableIds = new Set(bookings.map(b => b.table));
            const availableTables = tables.filter(t => !t.is_occupied && !bookedTableIds.has(t.id));

            setStats({
                tables: { total: tables.length, available: availableTables.length },
                orders: { active: activeOrders.length, readyToDeliver: readyOrders.length },
                bookings: { today: bookings.length },
                todaySummary: { count: todayOrders.length, amount: sum }
            });

            // Build recent actions
            const recent = orders.slice(0, 4).map(o => ({
                id: o.id,
                icon: o.status === 'READY' ? 'check-circle' :
                    o.status === 'DELIVERED' ? 'delivery-dining' : 'restaurant',
                text: `Стол #${o.table_number} – ${getStatusText(o.status)}`,
                time: getTimeAgo(o.created_at),
                amount: parseFloat(o.total_amount) || 0,
            }));
            setRecentActions(recent);

        } catch (e) {
            console.log('Dashboard fetch failed:', e.message);
            setLoadError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
            loadStoredAvatarPreset().then(setAvatarPresetId).catch(() => {});
        }, [fetchDashboardData])
    );

    const getStatusText = (status) => {
        const map = {
            CREATED: 'Новый заказ',
            ACCEPTED: 'Принят',
            COOKING: 'Готовится',
            READY: 'Заказ готов',
            DELIVERED: 'Доставлено',
            CANCELLED: 'Отменён',
        };
        return map[status] || status;
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (diff < 1) return 'Только что';
        if (diff < 60) return `${diff} мин назад`;
        return `${Math.floor(diff / 60)} ч назад`;
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData(true);
        setRefreshing(false);
    }, [fetchDashboardData]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Доброе утро';
        if (hour < 18) return 'Добрый день';
        return 'Добрый вечер';
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    };

    const formatCurrency = (val) => {
        return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    if (loadError && !loading && stats.tables.total === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="wifi-off" size={64} color={COLORS.textMuted} />
                    <Text style={styles.errorTitle}>Нет подключения</Text>
                    <Text style={styles.errorSub}>Не удаётся связаться с сервером</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardData}>
                        <MaterialIcons name="refresh" size={20} color={COLORS.white} />
                        <Text style={styles.retryBtnText}>Повторить</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.skeletonWrap}>
                        {[1, 2, 3].map(i => (
                            <Animated.View key={i} style={[styles.skeletonCard, { opacity: shimmerOpacity }]}>
                                <View style={styles.skeletonRow}>
                                    <View style={styles.skeletonCircle} />
                                    <View style={styles.skeletonCol}>
                                        <View style={styles.skeletonLineWide} />
                                        <View style={styles.skeletonLineShort} />
                                    </View>
                                </View>
                                <View style={styles.skeletonLineMedium} />
                                <View style={styles.skeletonLineShort} />
                            </Animated.View>
                        ))}
                    </View>
                ) : (<>
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Официант'}!</Text>
                        <Text style={styles.timeText}>{getCurrentTime()}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.avatarBtn}
                        onPress={() => navigation.navigate('ProfileTab')}
                    >
                        <UserAvatar
                            fullName={user?.full_name}
                            photoUrl={user?.photo_url}
                            avatarPresetId={avatarPresetId}
                            size={44}
                            fallbackBackgroundColor={COLORS.primary}
                            fallbackTextColor={COLORS.white}
                        />
                    </TouchableOpacity>
                </Animated.View>

                {/* Today Summary Card */}
                <Animated.View style={{ transform: [{ scale: cardScale }], opacity: fadeAnim }}>
                    <LinearGradient
                        colors={[COLORS.primary, '#ff8a8a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.summaryCard}
                    >
                        <View style={styles.summaryCardContent}>
                            <View style={styles.summaryCardLeft}>
                                <Text style={styles.summaryCardTitle}>Сводка за сегодня</Text>
                                <Text style={styles.summaryCardSubtitle}>Оформлено заказов: {stats.todaySummary.count}</Text>
                            </View>
                            <View style={styles.summaryCardIcon}>
                                <MaterialIcons name="trending-up" size={32} color="rgba(255,255,255,0.3)" />
                            </View>
                        </View>

                        <View style={styles.summaryTotalsRow}>
                            <Text style={styles.summaryTotalLabel}>Сумма заказов</Text>
                            <Text style={styles.summaryTotalValue}>{formatCurrency(stats.todaySummary.amount)}</Text>
                        </View>
                        <View style={styles.shiftProgress}>
                            <View style={styles.shiftProgressTrack}>
                                <View style={[styles.shiftProgressFill, { width: `${Math.min((stats.orders.active / 20) * 100, 100)}%` }]} />
                            </View>
                            <Text style={styles.shiftProgressText}>{stats.orders.active} заказов за смену</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Tips Card */}
                {parseFloat(tipStats.total) > 0 && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <View style={styles.tipsCard}>
                            <View style={styles.tipsCardLeft}>
                                <MaterialIcons name="volunteer-activism" size={28} color={COLORS.success} />
                                <View>
                                    <Text style={styles.tipsLabel}>Чаевые получено</Text>
                                    <Text style={styles.tipsAmount}>{parseFloat(tipStats.total).toLocaleString()} сум</Text>
                                </View>
                            </View>
                            <Text style={styles.tipsCount}>{tipStats.count} чаевых</Text>
                        </View>
                    </Animated.View>
                )}

                {/* Stats Grid */}
                <Animated.View style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <TouchableOpacity style={styles.statCard} activeOpacity={0.7}
                        onPress={() => navigation.navigate('TablesTab')}>
                        <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                            <MaterialIcons name="table-restaurant" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.statLabel}>Столики</Text>
                        <Text style={styles.statValue}>{stats.tables.total}</Text>
                        <Text style={styles.statSub}>{stats.tables.available} свободных</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statCard} activeOpacity={0.7}
                        onPress={() => navigation.navigate('OrdersTab')}>
                        <View style={[styles.statIconCircle, { backgroundColor: 'rgba(78, 168, 222, 0.1)' }]}>
                            <MaterialIcons name="receipt-long" size={24} color={COLORS.info} />
                        </View>
                        <Text style={styles.statLabel}>Заказы</Text>
                        <Text style={styles.statValue}>{stats.orders.active}</Text>
                        <Text style={[styles.statSub, stats.orders.readyToDeliver > 0 && { color: COLORS.success }]}>
                            {stats.orders.readyToDeliver} готов к доставке
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Recent Actions */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.sectionTitle}>Последние действия</Text>

                    {recentActions.map((action, index) => (
                        <Animated.View
                            key={action.id}
                            style={[
                                styles.actionCard,
                                {
                                    opacity: fadeAnim,
                                    transform: [{
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20 + index * 10, 0],
                                        })
                                    }],
                                },
                            ]}
                        >
                            <View style={styles.actionIconCircle}>
                                <MaterialIcons name={action.icon} size={22} color={COLORS.textMuted} />
                            </View>
                            <View style={styles.actionInfo}>
                                <Text style={styles.actionText}>{action.text}</Text>
                                <Text style={styles.actionTime}>{action.time}</Text>
                            </View>
                            <Text style={styles.actionAmount}>{formatCurrency(action.amount)}</Text>
                        </Animated.View>
                    ))}

                    {recentActions.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Действий пока нет</Text>
                        </View>
                    )}
                </Animated.View>
                </>)}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    timeText: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '500',
        marginTop: 2,
    },
    avatarBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    summaryCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 8,
    },
    summaryCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    summaryCardLeft: {
        flex: 1,
    },
    summaryCardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 6,
    },
    summaryCardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
    },
    summaryCardIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTotalsRow: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryTotalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
    },
    summaryTotalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.white,
    },
    shiftProgress: {
        marginTop: 12,
        gap: 6,
    },
    shiftProgressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    shiftProgressFill: {
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 3,
    },
    shiftProgressText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        width: (width - 52) / 2,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.textDark,
        letterSpacing: -1,
    },
    statSub: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textDark,
        marginBottom: 16,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    actionIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    actionInfo: {
        flex: 1,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    actionTime: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '400',
    },
    actionAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 24,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
    tipsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    tipsCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tipsLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    tipsAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    tipsCount: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.success,
    },
    skeletonWrap: {
        paddingTop: 20,
    },
    skeletonCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    skeletonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.slate200,
    },
    skeletonCol: {
        flex: 1,
        gap: 8,
    },
    skeletonLineWide: {
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.slate200,
        width: '70%',
    },
    skeletonLineMedium: {
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.slate100,
        width: '50%',
        marginBottom: 8,
    },
    skeletonLineShort: {
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.slate100,
        width: '35%',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textDark,
        marginTop: 20,
        marginBottom: 8,
    },
    errorSub: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
    },
    retryBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
});
