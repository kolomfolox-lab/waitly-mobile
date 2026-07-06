import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
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
    danger: '#ef4444',
    success: '#22c55e',
};

export default function GuestCartScreen({ navigation }) {
    const { items, updateQuantity, removeItem, getTotal, clearCart } = useCart();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitOrder = async () => {
        if (items.length === 0) return;
        setSubmitting(true);
        try {
            const orderItems = items.map(item => ({
                dish_id: item.id,
                quantity: item.quantity,
                price: item.price,
            }));
            const response = await api.post('/api/v1/mobile/orders/create/', {
                items: orderItems,
                table_number: user?.table_number,
                restaurant_slug: user?.restaurant_slug,
            });
            clearCart();
            navigation.replace('GuestOrderTracking', { orderId: response.data?.id || response.data?.order_id });
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось отправить заказ. Попробуйте снова.');
        } finally {
            setSubmitting(false);
        }
    };

    const total = getTotal();

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <MaterialIcons name="shopping-cart" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Корзина пуста</Text>
                <Text style={styles.emptySubtitle}>Добавьте блюда из меню</Text>
                <TouchableOpacity style={styles.backToMenu} onPress={() => navigation.navigate('GuestMenu')}>
                    <Text style={styles.backToMenuText}>Вернуться в меню</Text>
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
                <Text style={styles.headerTitle}>Корзина</Text>
                <TouchableOpacity onPress={clearCart}>
                    <MaterialIcons name="delete-sweep" size={24} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {items.map(item => (
                    <View key={item.id} style={styles.cartItem}>
                        {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                        ) : (
                            <View style={styles.itemImagePlaceholder}>
                                <MaterialIcons name="fastfood" size={24} color={COLORS.textMuted} />
                            </View>
                        )}
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.itemPrice}>{item.price} UZS</Text>
                            <View style={styles.quantityRow}>
                                <TouchableOpacity
                                    style={styles.qtyButton}
                                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                    <MaterialIcons name="remove" size={18} color={COLORS.text} />
                                </TouchableOpacity>
                                <Text style={styles.qtyValue}>{item.quantity}</Text>
                                <TouchableOpacity
                                    style={styles.qtyButton}
                                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                    <MaterialIcons name="add" size={18} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.itemRight}>
                            <Text style={styles.itemTotal}>{item.price * item.quantity} UZS</Text>
                            <TouchableOpacity onPress={() => removeItem(item.id)}>
                                <MaterialIcons name="delete-outline" size={22} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Итого:</Text>
                    <Text style={styles.totalValue}>{total} UZS</Text>
                </View>
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmitOrder}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitButtonText}>Отправить заказ</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 6,
    },
    backToMenu: {
        marginTop: 24,
        paddingHorizontal: 28,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    },
    backToMenuText: {
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
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 180,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    itemImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: COLORS.border,
    },
    itemImagePlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    itemPrice: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    qtyButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        minWidth: 24,
        textAlign: 'center',
    },
    itemRight: {
        alignItems: 'flex-end',
        marginLeft: 10,
        gap: 8,
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.primary,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
});
