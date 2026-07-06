import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
};

const PAYMENT_METHODS = [
    { id: 'payme', name: 'Payme', icon: 'credit-card', color: '#22c55e' },
    { id: 'click', name: 'Click', icon: 'touch-app', color: '#3b82f6' },
    { id: 'uzum', name: 'Uzum', icon: 'account-balance-wallet', color: '#8b5cf6' },
    { id: 'card', name: 'Карта', icon: 'payment', color: '#f59e0b' },
    { id: 'cash', name: 'Наличные', icon: 'money', color: '#64748b' },
];

const CASH_OPTIONS = [
    { id: 'cash_onsite', name: 'Оплачу на месте', icon: 'store', color: COLORS.text },
];

export default function GuestPaymentScreen({ route, navigation }) {
    const { user } = useAuth();
    const { orderId, total } = route?.params || {};
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePayment = async () => {
        if (!selectedMethod) {
            Alert.alert('Выберите способ', 'Пожалуйста, выберите способ оплаты');
            return;
        }

        if (selectedMethod === 'cash' || selectedMethod === 'cash_onsite') {
            setSuccess(true);
            return;
        }

        setProcessing(true);
        try {
            await api.post('/api/v1/guest/payment/init/', {
                method: selectedMethod,
                amount: total,
                order_id: orderId,
            });
            setSuccess(true);
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось инициировать оплату. Попробуйте снова.');
        } finally {
            setProcessing(false);
        }
    };

    if (success) {
        return (
            <SafeAreaView style={styles.successContainer}>
                <View style={styles.successIcon}>
                    <MaterialIcons name="check-circle" size={80} color={COLORS.success} />
                </View>
                <Text style={styles.successTitle}>Оплата принята</Text>
                <Text style={styles.successSubtitle}>Спасибо за ваш заказ!</Text>
                <TouchableOpacity
                    style={styles.successButton}
                    onPress={() => navigation.navigate('GuestMenu')}
                >
                    <Text style={styles.successButtonText}>Вернуться в меню</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Оплата</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>К оплате</Text>
                    <Text style={styles.totalAmount}>{total} UZS</Text>
                </View>

                <Text style={styles.sectionTitle}>Способ оплаты</Text>

                <View style={styles.methodsGrid}>
                    {PAYMENT_METHODS.map(method => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.methodCard,
                                selectedMethod === method.id && styles.methodCardSelected,
                            ]}
                            onPress={() => setSelectedMethod(method.id)}
                        >
                            <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                                <MaterialIcons name={method.icon} size={28} color={method.color} />
                            </View>
                            <Text style={styles.methodName}>{method.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Другое</Text>

                {CASH_OPTIONS.map(option => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.cashOption,
                            selectedMethod === option.id && styles.cashOptionSelected,
                        ]}
                        onPress={() => setSelectedMethod(option.id)}
                    >
                        <View style={[styles.cashIcon, { backgroundColor: option.color + '20' }]}>
                            <MaterialIcons name={option.icon} size={24} color={option.color} />
                        </View>
                        <Text style={styles.cashOptionName}>{option.name}</Text>
                        {selectedMethod === option.id && (
                            <MaterialIcons name="check-circle" size={22} color={COLORS.success} />
                        )}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={[styles.payButton, !selectedMethod && styles.payButtonDisabled, processing && styles.payButtonProcessing]}
                    onPress={handlePayment}
                    disabled={processing || !selectedMethod}
                >
                    {processing ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.payButtonText}>
                            {selectedMethod === 'cash' || selectedMethod === 'cash_onsite'
                                ? 'Подтвердить'
                                : 'Оплатить'}
                        </Text>
                    )}
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
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 32,
    },
    successIcon: {
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
    },
    successSubtitle: {
        fontSize: 15,
        color: COLORS.textMuted,
        marginTop: 6,
    },
    successButton: {
        marginTop: 32,
        paddingHorizontal: 32,
        paddingVertical: 14,
        backgroundColor: COLORS.primary,
        borderRadius: 14,
    },
    successButtonText: {
        color: COLORS.white,
        fontSize: 16,
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
    totalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    totalLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 6,
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.primary,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 24,
        marginBottom: 14,
    },
    methodsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    methodCard: {
        width: '47%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    methodCardSelected: {
        borderColor: COLORS.primary,
    },
    methodIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    methodName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    cashOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
        marginBottom: 12,
        gap: 12,
    },
    cashOptionSelected: {
        borderColor: COLORS.primary,
    },
    cashIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cashOptionName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    payButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    payButtonDisabled: {
        opacity: 0.5,
    },
    payButtonProcessing: {
        opacity: 0.7,
    },
    payButtonText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
});
