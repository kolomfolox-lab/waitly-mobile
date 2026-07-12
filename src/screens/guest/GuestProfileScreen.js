import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Linking, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { getSavingsGoal } from '../../api/apiService';

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
    warning: '#f59e0b',
};

const STATUS_COLORS = {
    CREATED: COLORS.warning,
    ACCEPTED: COLORS.primary,
    COOKING: COLORS.primary,
    READY: COLORS.success,
    DELIVERED: COLORS.success,
    CANCELLED: COLORS.danger,
};

const STATUS_LABELS = {
    CREATED: 'Создан',
    ACCEPTED: 'Принят',
    COOKING: 'Готовится',
    READY: 'Готов',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён',
};

export default function GuestProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [savingsGoal, setSavingsGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            const [ordersRes, savingsRes] = await Promise.all([
                api.get('/api/v1/guest/orders/active/'),
                getSavingsGoal().catch(() => null),
            ]);
            setOrders(ordersRes.data?.results || ordersRes.data || []);
            if (savingsRes) setSavingsGoal(savingsRes);
        } catch (err) {
            console.log('Failed to load orders:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const handleCallRestaurant = () => {
        const phone = user?.restaurant_phone || user?.restaurant?.phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert('Номер не найден', 'Контактный номер ресторана недоступен');
        }
    };

    const handleLogout = () => {
        Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
            { text: 'Нет', style: 'cancel' },
            { text: 'Да', style: 'destructive', onPress: logout },
        ]);
    };

    const handleWriteReview = () => {
        Alert.alert('Оставить отзыв', 'Как вы оцениваете наш сервис?', [
            { text: 'Отлично', onPress: () => Alert.alert('Спасибо!', 'Благодарим за вашу оценку!') },
            { text: 'Хорошо', onPress: () => Alert.alert('Спасибо!', 'Благодарим за ваш отзыв!') },
            { text: 'Плохо', onPress: () => Alert.alert('Жаль слышать', 'Мы постараемся стать лучше!') },
            { text: 'Отмена', style: 'cancel' },
        ]);
    };

    const getStatusBadgeStyle = (status) => ({
        backgroundColor: (STATUS_COLORS[status] || COLORS.textMuted) + '20',
    });

    const getStatusTextStyle = (status) => ({
        color: STATUS_COLORS[status] || COLORS.textMuted,
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={COLORS.primary} />}
            >
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="person" size={40} color={COLORS.white} />
                    </View>
                    <Text style={styles.phoneNumber}>{user?.phone_number || 'Гость'}</Text>
                    <Text style={styles.roleLabel}>Гость</Text>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCallRestaurant}>
                        <MaterialIcons name="phone" size={22} color={COLORS.primary} />
                        <Text style={styles.actionText}>Позвонить в ресторан</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleWriteReview}>
                        <MaterialIcons name="rate-review" size={22} color={COLORS.primary} />
                        <Text style={styles.actionText}>Написать отзыв</Text>
                    </TouchableOpacity>
                </View>

                {savingsGoal && (
                    <TouchableOpacity style={styles.savingsCard} activeOpacity={0.8} onPress={() => navigation.navigate('GuestSavingsGoal')}>
                        <View style={styles.savingsHeader}>
                            <MaterialIcons name="savings" size={22} color={COLORS.warning} />
                            <Text style={styles.savingsTitle}>{savingsGoal.name}</Text>
                        </View>
                        <View style={styles.savingsProgressRow}>
                            <View style={styles.savingsTrack}>
                                <View style={[styles.savingsFill, {
                                    width: `${Math.min(100, (savingsGoal.current_amount / savingsGoal.target_amount) * 100)}%`
                                }]} />
                            </View>
                            <Text style={styles.savingsPct}>
                                {Math.round((savingsGoal.current_amount / savingsGoal.target_amount) * 100)}%
                            </Text>
                        </View>
                        <Text style={styles.savingsAmounts}>
                            {savingsGoal.current_amount.toLocaleString()} / {savingsGoal.target_amount.toLocaleString()} UZS
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.ordersSection}>
                    <Text style={styles.sectionTitle}>История заказов</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                    ) : orders.length === 0 ? (
                        <View style={styles.emptyOrders}>
                            <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyOrdersText}>У вас пока нет заказов</Text>
                        </View>
                    ) : (
                        orders.map((order, idx) => (
                            <View key={order.id || idx} style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <Text style={styles.orderDate}>
                                        {order.created_at ? new Date(order.created_at).toLocaleDateString('ru-RU') : '-'}
                                    </Text>
                                    <View style={[styles.statusBadge, getStatusBadgeStyle(order.status)]}>
                                        <Text style={[styles.statusText, getStatusTextStyle(order.status)]}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.orderBody}>
                                    <Text style={styles.orderTotal}>{order.total || order.total_amount} UZS</Text>
                                    <Text style={styles.orderItems}>
                                        {order.items?.length || 0} позиций
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color={COLORS.danger} />
                    <Text style={styles.logoutText}>Выйти</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 20,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    phoneNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    roleLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 14,
        paddingVertical: 14,
        gap: 8,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    ordersSection: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 14,
    },
    emptyOrders: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyOrdersText: {
        marginTop: 12,
        fontSize: 15,
        color: COLORS.textMuted,
    },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderDate: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    orderItems: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 40,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: COLORS.white,
        gap: 8,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.danger,
    },
    savingsCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
        gap: 8,
    },
    savingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    savingsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        flex: 1,
    },
    savingsProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    savingsTrack: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    savingsFill: {
        height: '100%',
        backgroundColor: COLORS.warning,
        borderRadius: 4,
    },
    savingsPct: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.warning,
    },
    savingsAmounts: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
});
