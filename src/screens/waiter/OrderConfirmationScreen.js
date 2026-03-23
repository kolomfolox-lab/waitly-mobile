import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
};

export default function OrderConfirmationScreen({ route, navigation }) {
    const { tableNumber, total, items, orderId, orderData } = route.params;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const checkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(checkAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Animation */}
                <View style={styles.successContainer}>
                    <Animated.View style={[
                        styles.successCircle,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}>
                        <Animated.View style={{ opacity: checkAnim }}>
                            <MaterialIcons name="check" size={52} color={COLORS.white} />
                        </Animated.View>
                    </Animated.View>

                    <Animated.Text style={[styles.successTitle, { opacity: checkAnim }]}>
                        Заказ оформлен!
                    </Animated.Text>
                    <Animated.Text style={[styles.successSubtitle, { opacity: checkAnim }]}>
                        Стол {tableNumber}
                    </Animated.Text>
                </View>

                {/* Receipt Card */}
                <Animated.View style={[styles.receiptCard, { opacity: fadeAnim }]}>
                    <View style={styles.receiptHeader}>
                        <MaterialIcons name="receipt" size={20} color={COLORS.textMuted} />
                        <Text style={styles.receiptHeaderText}>Детали заказа</Text>
                        {orderId && (
                            <Text style={styles.orderId}>#{orderId.slice(0, 8)}</Text>
                        )}
                    </View>

                    <View style={styles.receiptDivider} />

                    {items.map((item, i) => (
                        <View key={i} style={styles.receiptRow}>
                            <View style={styles.receiptItemLeft}>
                                <Text style={styles.receiptQty}>{item.quantity}×</Text>
                                <Text style={styles.receiptItemName}>{item.name}</Text>
                            </View>
                            <Text style={styles.receiptItemPrice}>
                                {formatCurrency(item.price * item.quantity)}
                            </Text>
                        </View>
                    ))}

                    <View style={styles.receiptDivider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Итого</Text>
                        <Text style={styles.totalAmount}>
                            {formatCurrency(orderData?.total_amount || total)}
                        </Text>
                    </View>
                </Animated.View>

                {/* Actions */}
                <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        activeOpacity={0.8}
                        onPress={() => navigation.popToTop()}
                    >
                        <MaterialIcons name="home" size={20} color={COLORS.white} />
                        <Text style={styles.primaryBtnText}>На главную</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        activeOpacity={0.7}
                        onPress={() => navigation.replace('OrderCreation', { tableNumber, tableId: route.params.tableId || '' })}
                    >
                        <MaterialIcons name="add" size={20} color={COLORS.primary} />
                        <Text style={styles.secondaryBtnText}>Новый заказ</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    successContainer: {
        alignItems: 'center',
        marginBottom: 36,
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textDark,
        marginTop: 24,
    },
    successSubtitle: {
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '500',
        marginTop: 8,
    },
    receiptCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    receiptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    receiptHeaderText: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textDark,
        flex: 1,
    },
    orderId: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    receiptDivider: {
        height: 1,
        backgroundColor: COLORS.slate100,
        marginVertical: 14,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    receiptItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    receiptQty: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        minWidth: 28,
    },
    receiptItemName: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.textDark,
        flex: 1,
    },
    receiptItemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.primary,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    secondaryBtnText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '700',
    },
});
