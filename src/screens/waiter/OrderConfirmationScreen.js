import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.1)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate800: '#1e293b',
    slate700: '#334155',
    slate100: '#f1f5f9',
};

const { height } = Dimensions.get('window');

export default function OrderConfirmationScreen({ navigation, route }) {
    const { user } = useAuth();

    // Using mock params if navigated directly for testing
    const orderData = route?.params?.orderData || {
        table: 5,
        total: 5400,
        items: [
            { id: 1, name: 'Стейк Рибай', price: 2400, qty: 1 },
            { id: 2, name: 'Паста Карбонара', price: 850, qty: 2 },
            { id: 3, name: 'Салат Цезарь', price: 650, qty: 1 },
            { id: 4, name: 'Тирамису', price: 550, qty: 2 },
        ]
    };

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(0.5)).current;
    const contentTranslateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.sequence([
            // 1. Initial fade in of background
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            // 2. Pop checkmark and slide content up together
            Animated.parallel([
                Animated.spring(checkScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 60,
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslateY, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    const formatCurrency = (val) => {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
    };

    const handleDone = () => {
        navigation.replace('WaiterDashboard');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.mainWrap, { opacity: fadeAnim }]}>

                {/* Top Success Area */}
                <View style={styles.successArea}>
                    <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                        <MaterialIcons name="check" size={48} color={COLORS.white} />
                    </Animated.View>

                    <Animated.Text style={[styles.successTitle, { transform: [{ translateY: contentTranslateY }] }]}>
                        Заказ принят!
                    </Animated.Text>

                    <Animated.Text style={[styles.successSubtitle, { transform: [{ translateY: contentTranslateY }] }]}>
                        Заказ отправлен на кухню и уже готовится.
                    </Animated.Text>
                </View>

                {/* Receipt Details */}
                <Animated.View style={[styles.receiptCard, { transform: [{ translateY: contentTranslateY }] }]}>
                    <View style={styles.receiptHeader}>
                        <View style={styles.receiptHeaderRow}>
                            <Text style={styles.receiptLabel}>Стол</Text>
                            <Text style={styles.receiptValue}>{orderData.table}</Text>
                        </View>
                        <View style={styles.receiptHeaderRow}>
                            <Text style={styles.receiptLabel}>Официант</Text>
                            <Text style={styles.receiptValue}>{user?.full_name?.split(' ')[0] || 'Азиз'}</Text>
                        </View>
                        <View style={styles.receiptHeaderRow}>
                            <Text style={styles.receiptLabel}>Время</Text>
                            <Text style={styles.receiptValue}>14:24</Text>
                        </View>
                    </View>

                    <View style={styles.zigzagBorder} />

                    <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
                        {orderData.items.map((item, index) => (
                            <View key={index} style={styles.itemRow}>
                                <View style={styles.itemInfo}>
                                    <View style={styles.qtyBox}>
                                        <Text style={styles.qtyText}>{item.qty}x</Text>
                                    </View>
                                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                </View>
                                <Text style={styles.itemTotal}>{formatCurrency(item.price * item.qty)}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.totalArea}>
                        <Text style={styles.totalLabel}>Итого к оплате</Text>
                        <Text style={styles.totalValue}>{formatCurrency(orderData.total)}</Text>
                    </View>
                </Animated.View>

            </Animated.View>

            {/* Bottom Actions */}
            <Animated.View style={[styles.bottomActions, { opacity: fadeAnim, transform: [{ translateY: contentTranslateY }] }]}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('OrderCreation', { tableNumber: orderData.table })}>
                    <Text style={styles.secondaryBtnText}>Добавить еще</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleDone}>
                    <Text style={styles.primaryBtnText}>На главную</Text>
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    mainWrap: {
        flex: 1,
        paddingHorizontal: 24,
    },
    successArea: {
        alignItems: 'center',
        paddingTop: height * 0.08,
        paddingBottom: 40,
    },
    checkCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    receiptCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        overflow: 'hidden',
    },
    receiptHeader: {
        backgroundColor: COLORS.slate100,
        padding: 24,
        gap: 12,
    },
    receiptHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receiptLabel: {
        color: COLORS.slate500,
        fontSize: 14,
        fontWeight: '500',
    },
    receiptValue: {
        color: COLORS.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
    zigzagBorder: {
        height: 12,
        backgroundColor: COLORS.backgroundLight,
        // Would normally use SVG or image for real zigzag, simulating with border
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate100,
    },
    itemsList: {
        padding: 24,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    qtyBox: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
        flex: 1,
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    totalArea: {
        padding: 24,
        backgroundColor: COLORS.slate800,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    totalLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
    },
    totalValue: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    bottomActions: {
        paddingHorizontal: 24,
        paddingBottom: 32, // Safe area
        gap: 12,
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryBtn: {
        backgroundColor: COLORS.white,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.slate200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    secondaryBtnText: {
        color: COLORS.textDark,
        fontSize: 16,
        fontWeight: 'bold',
    }
});
