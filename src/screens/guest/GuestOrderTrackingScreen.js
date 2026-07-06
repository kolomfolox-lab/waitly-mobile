import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#FFFFFF',
    text: '#1a1a2e',
    textMuted: '#94a3b8',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: '#f0ecec',
    success: '#22c55e',
    danger: '#ef4444',
};

const STATUS_FLOW = ['CREATED', 'ACCEPTED', 'COOKING', 'READY', 'DELIVERED'];

const STATUS_LABELS = {
    CREATED: 'Создан',
    ACCEPTED: 'Принят',
    COOKING: 'Готовится',
    READY: 'Готов',
    DELIVERED: 'Доставлен',
};

const getStepStatus = (currentStatus, stepIndex) => {
    const currentIdx = STATUS_FLOW.indexOf(currentStatus);
    if (currentIdx === -1) return 'pending';
    if (stepIndex < currentIdx) return 'completed';
    if (stepIndex === currentIdx) return 'active';
    return 'pending';
};

export default function GuestOrderTrackingScreen({ route, navigation }) {
    const { user } = useAuth();
    const orderId = route?.params?.orderId;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const fetchOrder = useCallback(async () => {
        if (!orderId) return;
        try {
            setError(null);
            const response = await api.get(`/api/v1/mobile/orders/${orderId}/`);
            setOrder(response.data);
        } catch (err) {
            setError('Не удалось загрузить статус заказа');
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useFocusEffect(
        useCallback(() => {
            fetchOrder();
            intervalRef.current = setInterval(fetchOrder, 10000);
            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }, [fetchOrder])
    );

    const handleCallWaiter = async () => {
        try {
            await api.post(`/qr/${user?.restaurant_slug}/${user?.table_number}/call-waiter/`);
            Alert.alert('Успешно', 'Официант вызван!');
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось вызвать официанта');
        }
    };

    const handleCancelOrder = async () => {
        Alert.alert('Отмена заказа', 'Вы уверены, что хотите отменить заказ?', [
            { text: 'Нет', style: 'cancel' },
            {
                text: 'Да, отменить',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.post(`/api/v1/mobile/orders/${orderId}/cancel/`);
                        Alert.alert('Заказ отменён');
                        navigation.goBack();
                    } catch (err) {
                        Alert.alert('Ошибка', 'Не удалось отменить заказ');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchOrder}>
                    <Text style={styles.retryText}>Повторить</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const currentStatus = order?.status || 'CREATED';
    const statusIdx = STATUS_FLOW.indexOf(currentStatus);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Заказ #{orderId}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.timelineCard}>
                    <Text style={styles.timelineTitle}>Статус заказа</Text>
                    <View style={styles.timeline}>
                        {STATUS_FLOW.map((status, index) => {
                            const stepStatus = getStepStatus(currentStatus, index);
                            return (
                                <View key={status} style={styles.timelineStep}>
                                    <View style={styles.stepIndicator}>
                                        <View style={[
                                            styles.stepCircle,
                                            stepStatus === 'completed' && styles.stepCircleCompleted,
                                            stepStatus === 'active' && styles.stepCircleActive,
                                        ]}>
                                            {stepStatus === 'completed' ? (
                                                <MaterialIcons name="check" size={16} color={COLORS.white} />
                                            ) : (
                                                <Text style={[
                                                    styles.stepNumber,
                                                    stepStatus === 'active' && styles.stepNumberActive,
                                                ]}>{index + 1}</Text>
                                            )}
                                        </View>
                                        {index < STATUS_FLOW.length - 1 && (
                                            <View style={[
                                                styles.stepLine,
                                                stepStatus === 'completed' && styles.stepLineCompleted,
                                                stepStatus === 'active' && styles.stepLineActive,
                                            ]} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.stepLabel,
                                        stepStatus === 'active' && styles.stepLabelActive,
                                        stepStatus === 'completed' && styles.stepLabelCompleted,
                                    ]}>{STATUS_LABELS[status]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {order && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.detailsTitle}>Детали заказа</Text>
                        <View style={styles.detailsRow}>
                            <Text style={styles.detailsLabel}>Стол:</Text>
                            <Text style={styles.detailsValue}>№{order.table_number || user?.table_number}</Text>
                        </View>
                        {order.items?.map((item, idx) => (
                            <View key={idx} style={styles.orderItem}>
                                <Text style={styles.orderItemName}>{item.dish_name || item.name}</Text>
                                <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                                <Text style={styles.orderItemPrice}>{item.price * item.quantity} UZS</Text>
                            </View>
                        ))}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Итого:</Text>
                            <Text style={styles.totalValue}>{order.total || order.total_amount} UZS</Text>
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.callWaiterButton} onPress={handleCallWaiter}>
                    <MaterialIcons name="support-agent" size={20} color={COLORS.white} />
                    <Text style={styles.callWaiterText}>Позвать официанта</Text>
                </TouchableOpacity>

                {currentStatus === 'CREATED' && (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
                        <Text style={styles.cancelButtonText}>Отменить заказ</Text>
                    </TouchableOpacity>
                )}

                {statusIdx >= STATUS_FLOW.indexOf('READY') && (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => navigation.navigate('GuestPayment', { orderId, total: order?.total || order?.total_amount })}
                    >
                        <MaterialIcons name="credit-card" size={20} color={COLORS.white} />
                        <Text style={styles.payButtonText}>Оплатить</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 32,
    },
    errorText: {
        marginTop: 12,
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 28,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    },
    retryText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSpacer: {
        width: 24,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    timelineCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginTop: 8,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 20,
    },
    timeline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    timelineStep: {
        alignItems: 'center',
        flex: 1,
    },
    stepIndicator: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepCircleCompleted: {
        backgroundColor: COLORS.success,
    },
    stepCircleActive: {
        backgroundColor: COLORS.primary,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    stepNumberActive: {
        color: COLORS.white,
    },
    stepLine: {
        width: '100%',
        height: 3,
        backgroundColor: COLORS.border,
        marginTop: -18,
        marginBottom: 18,
    },
    stepLineCompleted: {
        backgroundColor: COLORS.success,
    },
    stepLineActive: {
        backgroundColor: COLORS.primary,
    },
    stepLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },
    stepLabelActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    stepLabelCompleted: {
        color: COLORS.success,
        fontWeight: '600',
    },
    detailsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginTop: 14,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailsLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    detailsValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    orderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    orderItemName: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
    },
    orderItemQty: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginHorizontal: 8,
    },
    orderItemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    callWaiterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.text,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 20,
        gap: 8,
    },
    callWaiterText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 8,
    },
    cancelButtonText: {
        color: COLORS.danger,
        fontSize: 15,
        fontWeight: '600',
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 12,
        marginBottom: 32,
        gap: 8,
    },
    payButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
