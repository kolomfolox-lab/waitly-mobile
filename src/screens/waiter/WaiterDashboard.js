import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.15)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    danger: '#EE5A6F',
    warning: '#F7B731',
    info: '#4EA8DE',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate800: '#1e293b',
    slate700: '#334155',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
};

const { width } = Dimensions.get('window');

export default function WaiterDashboard({ navigation }) {
    const { user, logout } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    // Abstracted stats replicating the `dashboard/screen.png`
    const [stats, setStats] = useState({
        totalRevenue: 24500,
        tips: 1200,
        ordersCompleted: 14,
        activeOrders: 3,
    });

    // Mock Active Orders
    const [activeOrders, setActiveOrders] = useState([
        { id: 1, table: 5, items: 'Паста Карбонара, Цезарь, 2x Кола', time: '12 мин', status: 'preparing' },
        { id: 2, table: 8, items: 'Стейк Рибай, Овощи гриль', time: '25 мин', status: 'ready' },
        { id: 3, table: 12, items: 'Пицца Маргарита, Чай', time: '3 мин', status: 'waiting' },
    ]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    // Staggered list animations for orders
    const [orderAnims, setOrderAnims] = useState([]);

    useEffect(() => {
        // Setup order animations
        const anims = activeOrders.map(() => ({
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.9)
        }));
        setOrderAnims(anims);

        // Run animations
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

            // Stagger orders
            ...anims.map((anim, i) => Animated.parallel([
                Animated.timing(anim.opacity, {
                    toValue: 1,
                    duration: 300,
                    delay: 200 + (i * 100),
                    useNativeDriver: true,
                }),
                Animated.spring(anim.scale, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    delay: 200 + (i * 100),
                    useNativeDriver: true,
                })
            ]))
        ]).start();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1500);
    }, []);

    const formatCurrency = (val) => {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ready': return COLORS.success;
            case 'preparing': return COLORS.warning;
            case 'waiting': default: return COLORS.info;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'ready': return 'Готово';
            case 'preparing': return 'Готовится';
            case 'waiting': default: return 'В ожидании';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                <View style={styles.headerLeft}>
                    <View>
                        <Text style={styles.greeting}>Моя смена,</Text>
                        <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Официант'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.profileBtn} onPress={logout}>
                    <Text style={styles.profileInitials}>{user?.full_name?.charAt(0) || 'А'}</Text>
                    <View style={styles.onlineDot} />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats row 1 */}
                <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <LinearGradient
                        colors={[COLORS.primary, '#ff8a8a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mainStatCard}
                    >
                        <View style={styles.statIconBadge}>
                            <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.statLabelLight}>Сумма заказов</Text>
                        <Text style={styles.statValueLight}>{formatCurrency(stats.totalRevenue)}</Text>
                    </LinearGradient>

                    <View style={styles.secondaryStatCard}>
                        <View style={[styles.statIconBadge, { backgroundColor: COLORS.success + '20' }]}>
                            <MaterialIcons name="volunteer-activism" size={20} color={COLORS.success} />
                        </View>
                        <Text style={styles.statLabelDark}>Чаевые</Text>
                        <Text style={styles.statValueDark}>{formatCurrency(stats.tips)}</Text>
                    </View>
                </Animated.View>

                {/* Stats row 2 */}
                <Animated.View style={[styles.statsRow, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                    <View style={styles.smallStatCard}>
                        <Text style={styles.statValueSmall}>{stats.ordersCompleted}</Text>
                        <Text style={styles.statLabelSmall}>Завершено</Text>
                    </View>
                    <View style={styles.smallStatCard}>
                        <Text style={[styles.statValueSmall, { color: COLORS.primary }]}>{stats.activeOrders}</Text>
                        <Text style={styles.statLabelSmall}>В работе</Text>
                    </View>
                </Animated.View>

                {/* Active Orders Section */}
                <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>Текущие заказы</Text>
                    <TouchableOpacity>
                        <Text style={styles.sectionLink}>Все</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.ordersList}>
                    {activeOrders.map((order, index) => {
                        const anims = orderAnims[index] || { opacity: 1, scale: 1 };
                        return (
                            <Animated.View
                                key={order.id}
                                style={[
                                    styles.orderItemWrapper,
                                    {
                                        opacity: anims.opacity,
                                        transform: [{ scale: anims.scale }]
                                    }
                                ]}
                            >
                                <TouchableOpacity style={styles.orderCard} activeOpacity={0.8}>
                                    <View style={styles.orderHeader}>
                                        <View style={styles.tableBadge}>
                                            <Text style={styles.tableBadgeText}>Стол {order.table}</Text>
                                        </View>
                                        <Text style={styles.orderTime}>{order.time}</Text>
                                    </View>

                                    <View style={styles.orderBody}>
                                        <Text style={styles.orderItems} numberOfLines={2}>{order.items}</Text>
                                    </View>

                                    <View style={styles.orderFooter}>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{getStatusText(order.status)}</Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        );
                    })}
                </View>

            </ScrollView>

            {/* Bottom Nav matches Waiter tables view */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="dashboard" size={24} color={COLORS.primary} />
                    <Text style={styles.navLabelActive}>Дашборд</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('WaiterTables')}>
                    <MaterialIcons name="table-restaurant" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Столы</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="content-copy" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Заказы</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="restaurant-menu" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Меню</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.2)',
    },
    profileInitials: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.backgroundLight,
    },
    greeting: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 110, // Avoid bottom nav overlap
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    mainStatCard: {
        flex: 1.5,
        borderRadius: 20,
        padding: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    secondaryStatCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    smallStatCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    statIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statLabelLight: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    statValueLight: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        letterSpacing: -0.5,
    },
    statLabelDark: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    statValueDark: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    statValueSmall: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    statLabelSmall: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    sectionLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    ordersList: {
        gap: 12,
    },
    orderItemWrapper: {
        width: '100%',
    },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tableBadge: {
        backgroundColor: COLORS.slate100,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tableBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.slate700,
    },
    orderTime: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    orderBody: {
        marginBottom: 14,
    },
    orderItems: {
        fontSize: 14,
        color: COLORS.textDark,
        lineHeight: 20,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.slate100,
        paddingTop: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24, // Safe area for iPhone
        zIndex: 20,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    navLabelActive: {
        fontSize: 10,
        fontWeight: '500',
        color: COLORS.primary,
    }
});
