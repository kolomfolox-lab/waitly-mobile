import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Image,
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
import { getOrders, deliverOrder } from '../../api/apiService';
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

function BillModal({ visible, onClose, tableNumber, billData }) {
    if (!billData) return null;

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : (val || 0);
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    const items = billData.items || [];
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
    const servicePercent = billData.service_charge_percent || 0;
    const serviceAmount = Math.round(subtotal * servicePercent / 100);
    const grandTotal = subtotal + serviceAmount;

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
                        <Text style={styles.billTableInfo}>Стол {tableNumber}</Text>
                        <View style={styles.billDivider} />

                        {items.map((item, idx) => (
                            <View key={idx} style={styles.billItemRow}>
                                <View style={styles.billItemLeft}>
                                    <Text style={styles.billItemQty}>{item.quantity}×</Text>
                                    <View style={styles.billItemInfo}>
                                        <Text style={styles.billItemName}>{item.dish_name || 'Блюдо'}</Text>
                                        {item.notes ? <Text style={styles.billItemNotes}>{item.notes}</Text> : null}
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

                        {servicePercent > 0 && (
                            <View style={styles.billTotalRow}>
                                <Text style={styles.billTotalLabel}>Сервисный сбор ({servicePercent}%)</Text>
                                <Text style={styles.billTotalValue}>{formatCurrency(serviceAmount)}</Text>
                            </View>
                        )}

                        <View style={styles.billGrandRow}>
                            <Text style={styles.billGrandLabel}>Итого</Text>
                            <Text style={styles.billGrandValue}>{formatCurrency(grandTotal)}</Text>
                        </View>

                        {billData.payment_method === 'qr' ? (
                            billData.payment_url ? (
                                <View style={styles.qrSection}>
                                    <Image
                                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(billData.payment_url)}` }}
                                        style={styles.qrImage}
                                    />
                                    <Text style={styles.qrHint}>Гость сканирует QR для оплаты</Text>
                                </View>
                            ) : (
                                <View style={styles.cashSection}>
                                    <MaterialIcons name="error-outline" size={48} color={COLORS.warning} />
                                    <Text style={styles.cashHint}>Платёжная система не настроена</Text>
                                </View>
                            )
                        ) : (
                            <View style={styles.cashSection}>
                                <MaterialIcons name="payments" size={48} color={COLORS.success} />
                                <Text style={styles.cashHint}>Оплачено наличными</Text>
                            </View>
                        )}

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
    const [billModal, setBillModal] = useState({ visible: false, data: null });
    const [showBillOptions, setShowBillOptions] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [ordersData, homeData] = await Promise.all([
                getOrders({ table: tableId }),
                apiClient.get('/api/v1/mobile/home/').catch(() => null),
            ]);
            const list = ordersData.results || ordersData || [];
            setOrders(Array.isArray(list) ? list : []);
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
            if (action === 'deliver') await deliverOrder(orderId);
            await fetchData();
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось обновить статус');
        }
    };

    const hasDeliveredOrders = orders.some(o => o.status === 'DELIVERED');
    const hasActiveOrders = orders.some(o => ['CREATED', 'ACCEPTED', 'COOKING', 'READY'].includes(o.status));

    const allItems = orders.flatMap(o =>
        (o.items || []).map(i => ({
            ...i,
            _orderStatus: o.status,
            _orderId: o.id,
            _orderTime: o.created_at,
        }))
    );

    const subtotal = allItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);

    const issueBill = async (paymentMethod) => {
        setShowBillOptions(false);
        try {
            const response = await apiClient.post(`/api/v1/mobile/tables/${tableId}/issue-bill/`, {
                payment_method: paymentMethod,
            });
            const bill = response.data;
            const homeData = await apiClient.get('/api/v1/mobile/home/').catch(() => null);
            const percent = homeData?.data?.restaurant?.service_charge_percent
                ? parseFloat(homeData.data.restaurant.service_charge_percent) : serviceChargePercent;

            const ordersData = await getOrders({ table: tableId });
            const list = ordersData.results || ordersData || [];
            const newItems = (Array.isArray(list) ? list : []).flatMap(o =>
                (o.items || []).map(i => ({ ...i }))
            );

            setBillModal({
                visible: true,
                data: {
                    items: newItems,
                    payment_method: paymentMethod,
                    payment_url: bill.payment_url || null,
                    service_charge_percent: percent,
                },
            });
            await fetchData();
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось выставить счёт');
        }
    };

    const orderStatus = orders.length > 0 ? orders[0].status : null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={22} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Стол {tableNumber}</Text>
                <View style={styles.headerActions}>
                    {hasDeliveredOrders && (
                        <TouchableOpacity style={styles.billHeaderBtn} onPress={() => setShowBillOptions(true)}>
                            <MaterialIcons name="receipt" size={18} color={COLORS.white} />
                            <Text style={styles.billHeaderBtnText}>Счёт</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('OrderCreation', { tableNumber, tableId })}>
                        <MaterialIcons name="add" size={22} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : orders.length === 0 ? (
                <View style={styles.center}>
                    <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Нет заказов</Text>
                    <TouchableOpacity style={styles.emptyAddBtn} onPress={() => navigation.navigate('OrderCreation', { tableNumber, tableId })}>
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
                    <View style={styles.unifiedCard}>
                        <View style={styles.unifiedHeader}>
                            <Text style={styles.unifiedTitle}>Заказ стола {tableNumber}</Text>
                            {orders.every(o => o.status === 'DELIVERED' || o.status === 'AWAITING_PAYMENT' || o.status === 'PAID') ? null : (
                                <TouchableOpacity
                                    style={[styles.statusBadgeSmall, { backgroundColor: hasActiveOrders ? (COLORS.warning + '20') : (COLORS.success + '20') }]}
                                    onPress={() => {}}
                                >
                                    <Text style={[styles.statusBadgeSmallText, { color: hasActiveOrders ? COLORS.warning : COLORS.success }]}>
                                        {hasActiveOrders ? 'Готовится' : 'Завершён'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {allItems.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
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
                                <Text style={styles.itemPrice}>{formatCurrency((parseFloat(item.price) || 0) * (item.quantity || 1))}</Text>
                            </View>
                        ))}

                        <View style={styles.unifiedTotalRow}>
                            <Text style={styles.unifiedTotalLabel}>Итого по столу</Text>
                            <Text style={styles.unifiedTotalAmount}>{formatCurrency(subtotal)}</Text>
                        </View>

                        {orders.filter(o => o.status === 'READY').length > 0 && (
                            <View style={styles.unifiedActions}>
                                {orders.filter(o => o.status === 'READY').map(o => (
                                    <TouchableOpacity
                                        key={o.id}
                                        style={styles.actionBtnSmall}
                                        onPress={() => updateOrderStatus(o.id, 'deliver')}
                                    >
                                        <MaterialIcons name="local-shipping" size={16} color={COLORS.white} />
                                        <Text style={styles.actionBtnSmallText}>Доставить</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}

            <Modal visible={showBillOptions} animationType="fade" transparent onRequestClose={() => setShowBillOptions(false)}>
                <TouchableOpacity style={styles.optionsOverlay} activeOpacity={1} onPress={() => setShowBillOptions(false)}>
                    <View style={styles.optionsSheet}>
                        <Text style={styles.optionsTitle}>Выставить счёт</Text>
                        <TouchableOpacity style={styles.optionBtn} onPress={() => issueBill('qr')}>
                            <MaterialIcons name="qr-code" size={28} color={COLORS.textDark} />
                            <View style={styles.optionTextCol}>
                                <Text style={styles.optionLabel}>QR-оплата</Text>
                                <Text style={styles.optionDesc}>Гость оплачивает онлайн</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionBtn} onPress={() => issueBill('cash')}>
                            <MaterialIcons name="payments" size={28} color={COLORS.textDark} />
                            <View style={styles.optionTextCol}>
                                <Text style={styles.optionLabel}>Наличные</Text>
                                <Text style={styles.optionDesc}>Оплата на кассе</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionCancel} onPress={() => setShowBillOptions(false)}>
                            <Text style={styles.optionCancelText}>Отмена</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <BillModal
                visible={billModal.visible}
                onClose={() => setBillModal({ visible: false, data: null })}
                tableNumber={tableNumber}
                billData={billModal.data}
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
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    billHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.textDark,
    },
    billHeaderBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '700',
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
    unifiedCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    unifiedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate100,
    },
    unifiedTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    statusBadgeSmall: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeSmallText: {
        fontSize: 12,
        fontWeight: '700',
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
    unifiedTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: COLORS.textDark,
    },
    unifiedTotalLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    unifiedTotalAmount: {
        fontSize: 20,
        fontWeight: '900',
        color: COLORS.primary,
    },
    unifiedActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.slate100,
    },
    actionBtnSmall: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.success,
    },
    actionBtnSmallText: {
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
    qrSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    qrImage: {
        width: 220,
        height: 220,
        borderRadius: 16,
        backgroundColor: COLORS.white,
    },
    qrHint: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 12,
        fontWeight: '500',
    },
    cashSection: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    cashHint: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
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
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionsSheet: {
        backgroundColor: COLORS.backgroundLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        gap: 12,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 8,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 18,
        borderRadius: 16,
        backgroundColor: COLORS.white,
    },
    optionTextCol: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    optionDesc: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    optionCancel: {
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: COLORS.slate100,
        alignItems: 'center',
    },
    optionCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
});