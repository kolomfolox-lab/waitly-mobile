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
    Alert,
    Dimensions,
    Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getOrders, getDishes, acceptOrder, markOrderReady, toggleDishAvailability } from '../../api/apiService';
import { Switch } from 'react-native-gesture-handler';

const COLORS = {
    primary: '#FF6B6B',
    primaryLight: '#FFA4A4',
    backgroundLight: '#F8F9FA',
    success: '#52D681',
    warning: '#F7B731',
    info: '#4EA8DE',
    orange: '#FF9F43',
    white: '#FFFFFF',
    textDark: '#0B1527',
    textMuted: '#8F9BB3',
    slate100: '#F1F5F9',
    soldOut: '#E2E8F0',
};

const { width } = Dimensions.get('window');

const STATUS_CONFIG = {
    CREATED: { color: COLORS.info, label: 'НОВЫЙ', action: 'НАЧАТЬ ГОТОВИТЬ', nextAction: 'accept' },
    ACCEPTED: { color: COLORS.orange, label: 'ГОТОВИТСЯ', action: 'ГОТОВО', nextAction: 'ready' },
    COOKING: { color: COLORS.orange, label: 'ГОТОВИТСЯ', action: 'ГОТОВО', nextAction: 'ready' },
    READY: { color: COLORS.success, label: 'ГОТОВ', action: null, nextAction: null },
    DELIVERED: { color: COLORS.textMuted, label: 'ВЫДАН', action: null, nextAction: null },
};

export default function KitchenDashboard({ navigation }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingActions, setLoadingActions] = useState({});

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [ordersData, dishesData] = await Promise.all([
                getOrders(),
                getDishes()
            ]);

            const oList = ordersData.results || ordersData || [];
            if (Array.isArray(oList)) {
                // Kitchen sees non-delivered orders
                const active = oList.filter(o => ['CREATED', 'ACCEPTED', 'COOKING'].includes(o.status));
                setOrders(active);
            }

            const dList = dishesData.results || dishesData || [];
            if (Array.isArray(dList)) {
                setDishes(dList);
            }
        } catch (e) {
            console.log('Kitchen fetch failed:', e.message);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
            const interval = setInterval(fetchData, 15000);
            return () => clearInterval(interval);
        }, [fetchData])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const handleOrderAction = async (orderId, action) => {
        setLoadingActions(prev => ({ ...prev, [orderId]: true }));
        try {
            if (action === 'accept') await acceptOrder(orderId);
            else if (action === 'ready') await markOrderReady(orderId);
            await fetchData();
        } catch (e) {
            Alert.alert('Ошибка', e.response?.data?.detail || 'Не удалось обновить заказ');
        } finally {
            setLoadingActions(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleToggleDish = async (dishId) => {
        try {
            await toggleDishAvailability(dishId);
            setDishes(prev => prev.map(d => d.id === dishId ? { ...d, is_available: !d.is_available } : d));
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось изменить статус');
        }
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (diff < 1) return 'Только что';
        return `${diff} мин назад`;
    };

    const isChef = user?.role === 'CHEF';
    const totalMenus = new Set(dishes.map(d => d.category)).size || 0; // rough estimation
    const formatCurrency = (val) => `${(parseFloat(val || 0) / 1000).toFixed(2)}k сум`;

    const restaurantName = user?.restaurant_name || 'Ресторан Sezam';

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
                        <View>
                            <Text style={styles.headerTitle}>Кухня</Text>
                            <Text style={styles.headerSub}>{restaurantName} • {isChef ? 'ШЕФ-ПОВАР' : 'ПОВАР'}</Text>
                        </View>
                        <View style={styles.avatarWrap}>
                            <MaterialIcons name="person" size={28} color={COLORS.primary} />
                            <View style={styles.onlineDot} />
                        </View>
                    </View>

                    {/* Active Orders Horizontal Scroll */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>АКТИВНЫЕ ЗАКАЗЫ</Text>
                        <Text style={styles.liveText}>В эфире ({orders.length})</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.ordersScroll}
                    >
                        {orders.map((order) => {
                            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.CREATED;
                            const isLoading = loadingActions[order.id];

                            return (
                                <View key={order.id} style={styles.orderCard}>
                                    <View style={styles.orderCardHeader}>
                                        <View>
                                            <Text style={styles.orderId}>#{order.id || order.table_number * 102}</Text>
                                            <Text style={styles.orderTime}>{getTimeAgo(order.created_at)}</Text>
                                        </View>
                                        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                                    </View>

                                    <View style={styles.orderCardBottom}>
                                        <View style={[styles.statusPill, { backgroundColor: config.color + '10' }]}>
                                            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                                        </View>
                                        <View style={styles.dishPreviews}>
                                            {(order.items || []).slice(0, 3).map((item, i) => (
                                                <View key={i} style={[styles.miniDish, { left: i * -8, zIndex: 10 - i }]}>
                                                    <Image
                                                        source={{ uri: item.image || 'https://via.placeholder.com/30' }}
                                                        style={styles.miniDishImg}
                                                    />
                                                </View>
                                            ))}
                                            {order.items?.length > 3 && (
                                                <View style={[styles.miniDishMore, { left: 3 * -8 }]}>
                                                    <Text style={styles.miniDishMoreText}>+{order.items.length - 3}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Quick action button overlays horizontally */}
                                    {config.action && (
                                        <TouchableOpacity
                                            style={[styles.orderActionBtn, isLoading && { opacity: 0.5 }]}
                                            onPress={() => handleOrderAction(order.id, config.nextAction)}
                                            disabled={isLoading}
                                        >
                                            <Text style={styles.orderActionBtnText}>{config.action}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}

                        {orders.length === 0 && (
                            <View style={styles.emptyOrderCard}>
                                <MaterialIcons name="done-all" size={32} color={COLORS.textMuted} />
                                <Text style={styles.emptyOrderMsg}>Нет активных заказов</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Sub Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>АКТИВНЫЕ МЕНЮ</Text>
                            <Text style={styles.statValue}>{totalMenus}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>ВСЕГО БЛЮД</Text>
                            <Text style={styles.statValue}>{dishes.length}</Text>
                        </View>
                    </View>

                    {/* Huge Action Button (Chef Only) */}
                    {isChef && (
                        <TouchableOpacity style={styles.hugeAddBtn} onPress={() => navigation.navigate('MenuTab')}>
                            <MaterialIcons name="add" size={28} color={COLORS.white} />
                            <Text style={styles.hugeAddText}>Добавить новое блюдо</Text>
                        </TouchableOpacity>
                    )}

                    {/* Current Dishes List */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>ТЕКУЩИЕ БЛЮДА</Text>
                        <Text style={styles.sortText}>Сортировка: Меню</Text>
                    </View>

                    <View style={styles.dishList}>
                        {dishes.map(dish => {
                            const isAv = dish.is_available !== false;
                            return (
                                <View key={dish.id} style={styles.dishListCard}>
                                    <Image
                                        source={{ uri: dish.image || 'https://via.placeholder.com/80' }}
                                        style={[styles.fullDishImg, !isAv && { opacity: 0.4, grayscale: 1 }]}
                                    />
                                    <View style={styles.fullDishInfo}>
                                        <Text style={styles.fullDishName} numberOfLines={1}>{dish.name}</Text>
                                        <Text style={styles.fullDishPrice}>{formatCurrency(dish.price)}</Text>
                                    </View>
                                    <View style={styles.dishRightData}>
                                        <Text style={[styles.dishStatusTxt, { color: isAv ? COLORS.success : COLORS.textMuted }]}>
                                            {isAv ? 'ДОСТУПНО' : 'ЗАКОНЧИЛОСЬ'}
                                        </Text>
                                        <Switch
                                            value={isAv}
                                            onValueChange={() => handleToggleDish(dish.id)}
                                            trackColor={{ false: COLORS.soldOut, true: COLORS.success + '40' }}
                                            thumbColor={isAv ? COLORS.success : COLORS.white}
                                            disabled={!isChef}
                                            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
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
    headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
    headerSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' },
    avatarWrap: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight + '30',
        justifyContent: 'center', alignItems: 'center', position: 'relative'
    },
    onlineDot: {
        position: 'absolute', bottom: 2, right: 2, width: 12, height: 12,
        backgroundColor: COLORS.success, borderRadius: 6, borderWidth: 2, borderColor: COLORS.backgroundLight
    },
    sectionHeaderRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingBottom: 16, marginTop: 8
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
    liveText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
    sortText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },

    ordersScroll: { paddingHorizontal: 24, paddingBottom: 16, gap: 16 },
    orderCard: {
        width: width * 0.65, backgroundColor: COLORS.white, borderRadius: 24,
        padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 3,
    },
    emptyOrderCard: {
        width: width * 0.65, backgroundColor: COLORS.white, borderRadius: 24,
        padding: 30, justifyContent: 'center', alignItems: 'center',
        borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.soldOut
    },
    emptyOrderMsg: { color: COLORS.textMuted, fontWeight: '600', marginTop: 10 },
    orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
    orderTime: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    orderCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    dishPreviews: { flexDirection: 'row', paddingRight: -16 },
    miniDish: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.white, overflow: 'hidden' },
    miniDishImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    miniDishMore: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.slate100, borderWidth: 2, borderColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
    miniDishMoreText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
    orderActionBtn: {
        marginTop: 12, backgroundColor: COLORS.slate100, borderRadius: 12, paddingVertical: 10, alignItems: 'center'
    },
    orderActionBtnText: { fontSize: 11, fontWeight: '800', color: COLORS.textDark, letterSpacing: 0.5 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginTop: 16 },
    statBox: {
        flex: 1, backgroundColor: COLORS.white, borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 1
    },
    statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
    statValue: { fontSize: 28, fontWeight: '800', color: COLORS.textDark, marginTop: 12 },

    hugeAddBtn: {
        marginHorizontal: 24, marginTop: 24, marginBottom: 32,
        backgroundColor: '#F05A28', // Rich orange/red matching original
        borderRadius: 20, paddingVertical: 18,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
        shadowColor: '#F05A28', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6
    },
    hugeAddText: { fontSize: 18, fontWeight: '700', color: COLORS.white },

    dishList: { paddingHorizontal: 24, gap: 12 },
    dishListCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: 22, padding: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1
    },
    fullDishImg: { width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.slate100 },
    fullDishInfo: { flex: 1, marginLeft: 16 },
    fullDishName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
    fullDishPrice: { fontSize: 14, fontWeight: '700', color: '#F05A28', marginTop: 4 },
    dishRightData: { alignItems: 'flex-end', justifyContent: 'center' },
    dishStatusTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
});
