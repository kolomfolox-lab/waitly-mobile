import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getOrders, acceptOrder, startCooking, markReady, deliverOrder } from '../../api/apiService';
import apiClient from '../../api/apiClient';

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

function BillModal({ visible, onClose, order, serviceChargePercent }) {
    if (!order) return null;

    const subtotal = (order.items || []).reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
    const serviceChargeAmount = Math.round(subtotal * serviceChargePercent / 100);
    const grandTotal = subtotal + serviceChargeAmount;

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Счёт</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.billScroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.billTableInfo}>Стол {order.table_number}</Text>

                        <View style={styles.billDivider} />

                        {(order.items || []).map((item, idx) => (
                            <View key={item.id || idx} style={styles.billItemRow}>
                                <View style={styles.billItemLeft}>
                                    <Text style={styles.billItemQty}>{item.quantity}×</Text>
                                    <View style={styles.billItemInfo}>
                                        <Text style={styles.billItemName}>{item.dish_name || 'Блюдо'}</Text>
                                        {item.notes ? (
                                            <Text style={styles.billItemNotes}>{item.notes}</Text>
                                        ) : null}
                                    </View>
                                </View>
                                <Text style={styles.billItemPrice}>{formatCurrency((parseFloat(item.price) || 0) * (item.quantity || 1))}</Text>
                            </View>
                        ))}

                        <View style={styles.billDivider} />

                        <View style={styles.billTotalRow}>
                            <Text style={styles.billTotalLabel}>Подытог</Text>
                            <Text style={styles.billTotalValue}>{formatCurrency(subtotal)}</Text>
                        </View>

                        {serviceChargePercent > 0 && (
                            <View style={styles.billTotalRow}>
                                <Text style={styles.billTotalLabel}>Сервисный сбор ({serviceChargePercent}%)</Text>
                                <Text style={styles.billTotalValue}>{formatCurrency(serviceChargeAmount)}</Text>
                            </View>
                        )}

                        <View style={styles.billGrandRow}>
                            <Text style={styles.billGrandLabel}>Итого</Text>
                            <Text style={styles.billGrandValue}>{formatCurrency(grandTotal)}</Text>
                        </View>

                        <TouchableOpacity style={styles.billCloseBtn} onPress={onClose}>
                            <Text style={styles.billCloseBtnText}>Закрыть</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

export default function OrderModifyScreen({ route, navigation }) {
    const { tableNumber, tableId } = route.params;
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [serviceChargePercent, setServiceChargePercent] = useState(10);
    const [billOrder, setBillOrder] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [ordersData, homeData] = await Promise.all([
                getOrders({ table: tableId }),
                apiClient.get('/api/v1/mobile/home/').catch(() => null),
            ]);
            const list = ordersData.results || ordersData || [];
            setOrders(Array.isArray(list) ? list.filter(o =>
                ['CREATED', 'ACCEPTED', 'COOKING', 'READY', 'DELIVERED'].includes(o.status)
            ) : []);

            if (homeData?.data?.restaurant?.service_charge_percent) {
                setServiceChargePercent(parseFloat(homeData.data.restaurant.service_charge_percent));
            }
        } catch (e) {
            console.log('Failed to load data:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tableId]);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

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

    const updateOrderStatus = async (orderId, action) => {
        try {
            if (action === 'accept') await acceptOrder(orderId);
            else if (action === 'cooking') await startCooking(orderId);
            else if (action === 'ready') await markReady(orderId);
            else if (action === 'deliver') await deliverOrder(orderId);
            await fetchData();
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось обновить статус');
        }
    };

    const statusActions = (status) => {
        switch (status) {
            case 'CREATED':
                return [{ key: 'accept', label: 'Принять', icon: 'check', color: COLORS.primary }];
            case 'ACCEPTED':
                return [{ key: 'cooking', label: 'Готовится', icon: 'restaurant', color: COLORS.warning }];
            case 'COOKING':
                return [{ key: 'ready', label: 'Готов', icon: 'done', color: COLORS.success }];
            case 'READY':
                return [{ key: 'deliver', label: 'Доставлено', icon: 'local-shipping', color: COLORS.primary }];
            default:
                return [];
        }
    };

    const canShowBill = (status) => ['READY', 'DELIVERED'].includes(status);

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
                    <Text style={styles.emptyText}>Нет заказов</Text>
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
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />
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

                            <View style={styles.actionRow}>
                                {statusActions(order.status).map((action) => (
                                    <TouchableOpacity
                                        key={action.key}
                                        style={[styles.actionBtn, { backgroundColor: action.color }]}
                                        onPress={() => updateOrderStatus(order.id, action.key)}
                                    >
                                        <MaterialIcons name={action.icon} size={18} color={COLORS.white} />
                                        <Text style={styles.actionBtnText}>{action.label}</Text>
                                    </TouchableOpacity>
                                ))}
                                {canShowBill(order.status) && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: COLORS.textDark }]}
                                        onPress={() => setBillOrder(order)}
                                    >
                                        <MaterialIcons name="receipt" size={18} color={COLORS.white} />
                                        <Text style={styles.actionBtnText}>Счёт</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            )}

            <BillModal
                visible={!!billOrder}
                onClose={() => setBillOrder(null)}
                order={billOrder}
                serviceChargePercent={serviceChargePercent}
            />
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
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.slate100,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionBtnText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.backgroundLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingTop: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate100,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    billScroll: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    billTableInfo: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    billDivider: {
        height: 1,
        backgroundColor: COLORS.slate100,
        marginVertical: 12,
    },
    billItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 6,
    },
    billItemLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: 8,
    },
    billItemQty: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textMuted,
        minWidth: 24,
    },
    billItemInfo: {
        flex: 1,
    },
    billItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    billItemNotes: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontStyle: 'italic',
        marginTop: 2,
    },
    billItemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    billTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    billTotalLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    billTotalValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    billGrandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 4,
        borderTopWidth: 2,
        borderTopColor: COLORS.textDark,
    },
    billGrandLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    billGrandValue: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.primary,
    },
    billCloseBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginVertical: 20,
    },
    billCloseBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
});