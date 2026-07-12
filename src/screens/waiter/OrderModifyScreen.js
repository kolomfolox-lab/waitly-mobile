import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getOrders } from '../../api/apiService';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
    danger: '#EE5A6F',
};

const STATUS_LABELS = {
    CREATED: 'Новый',
    ACCEPTED: 'Принят',
    COOKING: 'Готовится',
    READY: 'Готов',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён',
};

const STATUS_COLORS = {
    CREATED: COLORS.textMuted,
    ACCEPTED: COLORS.primary,
    COOKING: COLORS.warning,
    READY: COLORS.success,
    DELIVERED: COLORS.textMuted,
    CANCELLED: COLORS.danger,
};

export default function OrderModifyScreen({ route, navigation }) {
    const { tableNumber, tableId } = route.params;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await getOrders({ table: tableId });
            const list = data.results || data || [];
            setOrders(Array.isArray(list) ? list.filter(o =>
                ['CREATED', 'ACCEPTED', 'COOKING', 'READY'].includes(o.status)
            ) : []);
        } catch (e) {
            console.log('Failed to load orders:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tableId]);

    useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
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
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={22} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Стол {tableNumber}</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('OrderCreation', { tableNumber, tableId })}
                >
                    <MaterialIcons name="add" size={22} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : orders.length === 0 ? (
                <View style={styles.center}>
                    <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Нет активных заказов</Text>
                    <TouchableOpacity
                        style={styles.emptyAddBtn}
                        onPress={() => navigation.navigate('OrderCreation', { tableNumber, tableId })}
                    >
                        <Text style={styles.emptyAddBtnText}>Создать заказ</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {orders.map(order => (
                        <View key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.status] || COLORS.textMuted) + '20' }]}>
                                    <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || COLORS.textMuted }]}>
                                        {STATUS_LABELS[order.status] || order.status}
                                    </Text>
                                </View>
                                <Text style={styles.orderTime}>{getTimeAgo(order.created_at)}</Text>
                            </View>

                            {(order.items || []).map((item, idx) => (
                                <View key={item.id || idx} style={styles.itemRow}>
                                    <View style={styles.itemLeft}>
                                        <Text style={styles.itemQty}>{item.quantity}×</Text>
                                        <View>
                                            <Text style={styles.itemName}>{item.dish_name || 'Блюдо'}</Text>
                                            {item.notes ? (
                                                <Text style={styles.itemNotes}>
                                                    <MaterialIcons name="edit-note" size={13} color={COLORS.warning} />
                                                    {' '}{item.notes}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                    <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                                </View>
                            ))}

                            {order.total_amount ? (
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Итого</Text>
                                    <Text style={styles.totalAmount}>{formatCurrency(order.total_amount)}</Text>
                                </View>
                            ) : null}
                        </View>
                    ))}
                </ScrollView>
            )}
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
        paddingVertical: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    emptyAddBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginTop: 8,
    },
    emptyAddBtnText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
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
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate100,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    orderTime: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 8,
    },
    itemLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: 8,
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textMuted,
        minWidth: 24,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    itemNotes: {
        fontSize: 12,
        color: COLORS.warning,
        fontWeight: '500',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.slate100,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary,
    },
});
