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
    backgroundLight: '#f8f5f5',
    backgroundDark: '#230f0f',
    success: '#52D681',
    danger: '#EE5A6F',
    warning: '#F7B731',
    info: '#4EA8DE',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate800: '#1e293b',
    slate700: '#334155',
    slate100: '#f1f5f9',
};

const { width } = Dimensions.get('window');

export default function OwnerDashboard({ navigation }) {
    const { user, logout } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    // Abstracting stats for now. Would connect to true API later.
    const [stats, setStats] = useState({
        revenueToday: 124500,
        ordersCount: 84,
        activeTables: 12,
        staffOnShift: 6,
    });

    // Mock Recent Activity
    const [activities, setActivities] = useState([
        { id: 1, type: 'payment', title: 'Оплата картой', amount: '+ 4,500 ₽', time: '14:23', icon: 'credit-card', color: COLORS.success },
        { id: 2, type: 'order', title: 'Новый заказ (Стол 5)', amount: '1,200 ₽', time: '14:15', icon: 'receipt-long', color: COLORS.info },
        { id: 3, type: 'shift', title: 'Азиз Алиев начал смену', amount: '', time: '14:00', icon: 'person-add', color: COLORS.primary },
        { id: 4, type: 'payment', title: 'Оплата наличными', amount: '+ 2,800 ₽', time: '13:45', icon: 'payments', color: COLORS.success },
    ]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;

    // Staggered items
    const [statAnims, setStatAnims] = useState([]);
    const [activityAnims, setActivityAnims] = useState([]);

    useEffect(() => {
        // Setup stat animations
        const sAnims = Array(4).fill(0).map(() => ({
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.8)
        }));
        setStatAnims(sAnims);

        // Setup activity animations
        const aAnims = activities.map(() => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20)
        }));
        setActivityAnims(aAnims);

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

            // Stagger stats
            ...sAnims.map((anim, i) => Animated.parallel([
                Animated.timing(anim.opacity, {
                    toValue: 1,
                    duration: 400,
                    delay: 200 + (i * 100),
                    useNativeDriver: true,
                }),
                Animated.spring(anim.scale, {
                    toValue: 1,
                    friction: 8,
                    tension: 50,
                    delay: 200 + (i * 100),
                    useNativeDriver: true,
                })
            ])),

            // Stagger activities
            ...aAnims.map((anim, i) => Animated.parallel([
                Animated.timing(anim.opacity, {
                    toValue: 1,
                    duration: 400,
                    delay: 400 + (i * 100),
                    useNativeDriver: true,
                }),
                Animated.timing(anim.translateY, {
                    toValue: 0,
                    duration: 400,
                    delay: 400 + (i * 100),
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            ]))
        ]).start();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Simulate data fetch
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    }, []);

    const formatCurrency = (val) => {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: translateY }] }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.profileBtn} onPress={logout}>
                        <Text style={styles.profileInitials}>{user?.full_name?.charAt(0) || 'O'}</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.greeting}>С возвращением,</Text>
                        <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Владелец'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.iconBtn}>
                    <View style={styles.notificationDot} />
                    <MaterialIcons name="notifications-none" size={26} color={COLORS.textDark} />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Revenue Card */}
                <Animated.View style={[styles.revenueWrapper, { opacity: fadeAnim, transform: [{ translateY: translateY }] }]}>
                    <LinearGradient
                        colors={[COLORS.primary, '#ff8a8a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.revenueCard}
                    >
                        <View style={styles.revenueHeader}>
                            <Text style={styles.revenueLabel}>Выручка за сегодня</Text>
                            <TouchableOpacity style={styles.revenueActionBtn}>
                                <Text style={styles.revenueActionText}>Отчет</Text>
                                <MaterialIcons name="chevron-right" size={16} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.revenueValue}>{formatCurrency(stats.revenueToday)}</Text>
                        <View style={styles.revenueGrowth}>
                            <MaterialIcons name="trending-up" size={16} color={COLORS.white} />
                            <Text style={styles.revenueGrowthText}>+12.5% по сравнению с вчера</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Grid Stats */}
                <View style={styles.statsGrid}>
                    {/* Orders */}
                    {statAnims[0] && (
                        <Animated.View style={[styles.statBoxWrapper, { opacity: statAnims[0].opacity, transform: [{ scale: statAnims[0].scale }] }]}>
                            <View style={styles.statBox}>
                                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(78, 168, 222, 0.1)' }]}>
                                    <MaterialIcons name="receipt-long" size={24} color={COLORS.info} />
                                </View>
                                <Text style={styles.statBoxValue}>{stats.ordersCount}</Text>
                                <Text style={styles.statBoxLabel}>Заказов</Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Tables */}
                    {statAnims[1] && (
                        <Animated.View style={[styles.statBoxWrapper, { opacity: statAnims[1].opacity, transform: [{ scale: statAnims[1].scale }] }]}>
                            <TouchableOpacity style={styles.statBox} activeOpacity={0.8} onPress={() => navigation.navigate('Tables')}>
                                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                                    <MaterialIcons name="table-restaurant" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.statBoxValue}>{stats.activeTables}</Text>
                                <Text style={styles.statBoxLabel}>Занятых столов</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Staff */}
                    {statAnims[2] && (
                        <Animated.View style={[styles.statBoxWrapper, { opacity: statAnims[2].opacity, transform: [{ scale: statAnims[2].scale }] }]}>
                            <TouchableOpacity style={styles.statBox} activeOpacity={0.8} onPress={() => navigation.navigate('StaffManagement')}>
                                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(82, 214, 129, 0.1)' }]}>
                                    <MaterialIcons name="group" size={24} color={COLORS.success} />
                                </View>
                                <Text style={styles.statBoxValue}>{stats.staffOnShift}</Text>
                                <Text style={styles.statBoxLabel}>На смене</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Menu/Popular - Placeholder */}
                    {statAnims[3] && (
                        <Animated.View style={[styles.statBoxWrapper, { opacity: statAnims[3].opacity, transform: [{ scale: statAnims[3].scale }] }]}>
                            <View style={styles.statBox}>
                                <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(247, 183, 49, 0.1)' }]}>
                                    <MaterialIcons name="restaurant-menu" size={24} color={COLORS.warning} />
                                </View>
                                <Text style={styles.statBoxValue}>24</Text>
                                <Text style={styles.statBoxLabel}>Блюда в СТОПе</Text>
                            </View>
                        </Animated.View>
                    )}
                </View>

                {/* Recent Activity List */}
                <Animated.View style={[styles.sectionHeader, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>Последние действия</Text>
                    <TouchableOpacity>
                        <Text style={styles.sectionLink}>Все</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.activityList}>
                    {activities.map((activity, index) => {
                        const anims = activityAnims[index] || { opacity: 1, translateY: 0 };
                        return (
                            <Animated.View
                                key={activity.id}
                                style={[
                                    styles.activityItemWrapper,
                                    {
                                        opacity: anims.opacity,
                                        transform: [{ translateY: anims.translateY }]
                                    }
                                ]}
                            >
                                <View style={styles.activityItem}>
                                    <View style={[styles.activityIconWrapper, { backgroundColor: `${activity.color}15` }]}>
                                        <MaterialIcons name={activity.icon} size={20} color={activity.color} />
                                    </View>
                                    <View style={styles.activityInfo}>
                                        <Text style={styles.activityTitle}>{activity.title}</Text>
                                        <Text style={styles.activityTime}>{activity.time}</Text>
                                    </View>
                                    {activity.amount ? (
                                        <Text style={[styles.activityAmount, { color: activity.amount.includes('+') ? COLORS.success : COLORS.textDark }]}>
                                            {activity.amount}
                                        </Text>
                                    ) : null}
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>

            </ScrollView>

            {/* Premium Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="dashboard" size={26} color={COLORS.primary} />
                    <Text style={styles.navLabelActive}>Главная</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Tables')}>
                    <MaterialIcons name="table-restaurant" size={26} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Столы</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('StaffManagement')}>
                    <MaterialIcons name="group" size={26} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Персонал</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="settings" size={26} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Настройки</Text>
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
        gap: 12,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    profileInitials: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    greeting: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        borderWidth: 1.5,
        borderColor: COLORS.white,
        zIndex: 1,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 110, // Avoid bottom nav overlap
    },
    revenueWrapper: {
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    revenueCard: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
    },
    revenueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    revenueLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 15,
        fontWeight: '500',
    },
    revenueActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    revenueActionText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    revenueValue: {
        fontSize: 38,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 12,
        letterSpacing: -1,
    },
    revenueGrowth: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    revenueGrowthText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    statBoxWrapper: {
        width: (width - 40 - 12) / 2, // 2 cols minus padding and gap
    },
    statBox: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statBoxValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    statBoxLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    sectionLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    activityList: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    activityItemWrapper: {
        marginBottom: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIconWrapper: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    activityAmount: {
        fontSize: 15,
        fontWeight: 'bold',
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
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 28, // Safe area
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    navLabelActive: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.primary,
    }
});
