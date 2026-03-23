import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getOrders } from '../../api/apiService';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.1)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    info: '#4EA8DE',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
};

const STATUS_CONFIG = {
    CREATED: { color: COLORS.info, text: 'Новый', icon: 'fiber-new' },
    ACCEPTED: { color: COLORS.info, text: 'Принят', icon: 'thumb-up' },
    COOKING: { color: COLORS.warning, text: 'Готовится', icon: 'outdoor-grill' },
    READY: { color: COLORS.success, text: 'Готов', icon: 'check-circle' },
    DELIVERED: { color: COLORS.textMuted, text: 'Доставлен', icon: 'delivery-dining' },
    CANCELLED: { color: '#EE5A6F', text: 'Отменён', icon: 'cancel' },
};

const FILTERS = ['Все', 'Новые', 'Готовятся', 'Готовы'];

export default function OrdersListScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [activeFilter, setActiveFilter] = useState('Все');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            setError('');
            const data = await getOrders();
            const ordersList = data.results || data || [];
            setOrders(Array.isArray(ordersList) ? ordersList : []);
        } catch (e) {
            console.log('Orders fetch failed:', e.message);
            setOrders([]);
            setError('Не удалось загрузить заказы');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const getFilteredOrders = () => {
        if (activeFilter === 'Все') return orders;
        if (activeFilter === 'Новые') return orders.filter(o => o.status === 'CREATED' || o.status === 'ACCEPTED');
        if (activeFilter === 'Готовятся') return orders.filter(o => o.status === 'COOKING');
        if (activeFilter === 'Готовы') return orders.filter(o => o.status === 'READY');
        return orders;
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [fetchOrders]);

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (diff < 1) return 'Только что';
        if (diff < 60) return `${diff} мин назад`;
        return `${Math.floor(diff / 60)} ч назад`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Заказы</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MaterialIcons name="filter-list" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.filtersWrapper, { opacity: fadeAnim }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    {FILTERS.map((filter, index) => {
                        const isActive = activeFilter === filter;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => setActiveFilter(filter)}
                                style={[
                                    styles.filterPill,
                                    isActive ? styles.filterPillActive : styles.filterPillInactive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        isActive ? styles.filterTextActive : styles.filterTextInactive,
                                    ]}
                                >
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.mainScrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {getFilteredOrders().map((order, index) => {
                    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.CREATED;

                    return (
                        <Animated.View
                            key={order.id}
                            style={[
                                styles.orderCard,
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
                            <TouchableOpacity activeOpacity={0.8} style={styles.orderCardInner}>
                                <View style={styles.orderHeader}>
                                    <View style={styles.tableBadge}>
                                        <Text style={styles.tableBadgeText}>Стол {order.table_number}</Text>
                                    </View>
                                    <Text style={styles.orderTime}>{getTimeAgo(order.created_at)}</Text>
                                </View>

                                <View style={styles.orderItems}>
                                    {(order.items || []).map((item, i) => (
                                        <Text key={item.id || i} style={styles.orderItemText} numberOfLines={1}>
                                            {item.quantity}× {item.dish_name}
                                        </Text>
                                    ))}
                                </View>

                                <View style={styles.orderFooter}>
                                    <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                                        <MaterialIcons name={config.icon} size={14} color={config.color} />
                                        <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                                    </View>
                                    <Text style={styles.orderTotal}>{formatCurrency(order.total_amount)}</Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                {loading && (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="hourglass-empty" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Загрузка заказов...</Text>
                    </View>
                )}

                {!loading && error ? (
                    <TouchableOpacity style={styles.emptyContainer} activeOpacity={0.8} onPress={fetchOrders}>
                        <MaterialIcons name="wifi-off" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>{error}</Text>
                        <Text style={styles.emptySubText}>Нажмите, чтобы попробовать снова</Text>
                    </TouchableOpacity>
                ) : null}

                {!loading && !error && getFilteredOrders().length === 0 && (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>Нет заказов</Text>
                    </View>
                )}
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'rgba(248, 245, 245, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 107, 107, 0.08)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filtersWrapper: {
        marginBottom: 4,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 10,
        flexDirection: 'row',
    },
    filterPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterPillActive: {
        backgroundColor: COLORS.primary,
    },
    filterPillInactive: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    filterTextActive: {
        color: COLORS.white,
    },
    filterTextInactive: {
        color: COLORS.textMuted,
    },
    mainScroll: {
        flex: 1,
    },
    mainScrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    orderCard: {
        marginBottom: 12,
    },
    orderCardInner: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tableBadge: {
        backgroundColor: COLORS.slate100,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tableBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    orderTime: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    orderItems: {
        marginBottom: 14,
        gap: 4,
    },
    orderItemText: {
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
        paddingTop: 14,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    emptySubText: {
        marginTop: 4,
        fontSize: 13,
        color: COLORS.textMuted,
    },
});
