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
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getCategories, getDishes, createOrder } from '../../api/apiService';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.1)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
};

const CATEGORY_EMOJIS = {
    'Салаты': '🥗',
    'Супы': '🍜',
    'Горячее': '🥩',
    'Напитки': '🥤',
    'Десерты': '🍰',
    'Пицца': '🍕',
    'Суши': '🍣',
    'Паста': '🍝',
    'Все': '📋',
};

const formatApiError = (error) => {
    const data = error?.response?.data;
    if (!data) {
        return error?.message || 'Неизвестная ошибка';
    }
    if (typeof data === 'string') {
        return data;
    }
    if (data.detail) {
        return data.detail;
    }
    const flatMessages = Object.entries(data).flatMap(([key, value]) => {
        if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`;
        }
        if (value && typeof value === 'object') {
            return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${String(value)}`;
    });
    return flatMessages.join('\n') || error.message || 'Неизвестная ошибка';
};

export default function OrderCreationScreen({ route, navigation }) {
    const { tableNumber, tableId } = route.params;
    const [categories, setCategories] = useState([{ id: 'all', name: 'Все' }]);
    const [dishes, setDishes] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState({});
    const [activeSeat, setActiveSeat] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [menuError, setMenuError] = useState('');

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
        fetchMenu();
    }, []);

    const fetchMenu = useCallback(async () => {
        try {
            setMenuError('');
            const [catData, dishData] = await Promise.all([
                getCategories(),
                getDishes(),
            ]);

            const catList = catData.results || catData || [];
            const dishList = dishData.results || dishData || [];

            if (Array.isArray(catList) && catList.length > 0) {
                setCategories([{ id: 'all', name: 'Все' }, ...catList]);
            }
            setDishes(Array.isArray(dishList) ? dishList : []);
        } catch (e) {
            console.log('Menu fetch failed:', e.message);
            setCategories([{ id: 'all', name: 'Все' }]);
            setDishes([]);
            setMenuError('Не удалось загрузить меню');
        } finally {
            setLoading(false);
        }
    }, []);

    const getFilteredDishes = () => {
        if (activeCategory === 'all') return dishes;
        return dishes.filter(d => d.category === activeCategory);
    };

    const cartKey = (dishId, seatNumber = activeSeat) => `${dishId}::seat-${seatNumber}`;

    const addToCart = (dishId) => {
        const key = cartKey(dishId);
        setCart(prev => ({
            ...prev,
            [key]: {
                dishId,
                quantity: (prev[key]?.quantity || 0) + 1,
                seat_number: activeSeat,
                guest_label: `Guest ${activeSeat}`,
            },
        }));
    };

    const removeFromCart = (dishId) => {
        const key = cartKey(dishId);
        setCart(prev => {
            const current = prev[key]?.quantity || 0;
            if (current <= 1) {
                const newCart = { ...prev };
                delete newCart[key];
                return newCart;
            }
            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    quantity: current - 1,
                },
            };
        });
    };

    const getCartTotal = () => {
        return Object.values(cart).reduce((sum, item) => {
            const dish = dishes.find(d => d.id === item.dishId);
            if (dish) {
                return sum + (parseFloat(dish.price) || 0) * item.quantity;
            }
            return sum;
        }, 0);
    };

    const getCartItemCount = () => {
        return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    };

    const formatCurrency = (val) => {
        return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    const handleSubmitOrder = async () => {
        const itemCount = getCartItemCount();
        if (itemCount === 0) {
            Alert.alert('Пустая корзина', 'Добавьте блюда в заказ');
            return;
        }

        if (menuError || dishes.length === 0) {
            Alert.alert('Меню недоступно', 'Сначала загрузите реальные блюда с сервера.');
            return;
        }

        setSubmitting(true);
        try {
            const items = Object.values(cart).map((item) => ({
                dish: item.dishId,
                quantity: item.quantity,
                seat_number: item.seat_number,
                guest_label: item.guest_label,
            }));

            const orderResponse = await createOrder(tableId, items);

            navigation.replace('OrderConfirmation', {
                tableNumber,
                total: getCartTotal(),
                items: Object.values(cart).map((item) => {
                    const dish = dishes.find(d => d.id === item.dishId);
                    return {
                        name: dish?.name || 'Блюдо',
                        quantity: item.quantity,
                        price: parseFloat(dish?.price || 0),
                        guest_label: item.guest_label,
                    };
                }),
                orderId: orderResponse?.id,
                orderData: orderResponse,
            });
        } catch (e) {
            console.log('Order creation failed:', e.response?.data || e.message);
            Alert.alert(
                'Ошибка',
                'Не удалось создать заказ: ' + formatApiError(e)
            );
        } finally {
            setSubmitting(false);
        }
    };

    const getEmoji = (name) => {
        return CATEGORY_EMOJIS[name] || '🍽';
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Стол {tableNumber}</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            {/* Category Pills */}
            <Animated.View style={[styles.catWrapper, { opacity: fadeAnim }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.seatContainer}
                >
                    {[1, 2, 3, 4].map((seat) => {
                        const isActive = activeSeat === seat;
                        return (
                            <TouchableOpacity
                                key={seat}
                                style={[styles.seatPill, isActive && styles.seatPillActive]}
                                onPress={() => setActiveSeat(seat)}
                            >
                                <MaterialIcons
                                    name="event-seat"
                                    size={16}
                                    color={isActive ? COLORS.white : COLORS.primary}
                                />
                                <Text style={[styles.seatText, isActive && styles.seatTextActive]}>
                                    Guest {seat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catContainer}
                >
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                activeOpacity={0.7}
                                onPress={() => setActiveCategory(cat.id)}
                                style={[
                                    styles.catPill,
                                    isActive ? styles.catPillActive : styles.catPillInactive,
                                ]}
                            >
                                <Text style={styles.catEmoji}>{getEmoji(cat.name)}</Text>
                                <Text style={[
                                    styles.catText,
                                    isActive ? styles.catTextActive : styles.catTextInactive,
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            {/* Dish List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : menuError ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="wifi-off" size={44} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>{menuError}</Text>
                    <Text style={styles.emptySubtitle}>Пока меню не пришло из API, заказ отправлять нельзя.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchMenu}>
                        <Text style={styles.retryBtnText}>Повторить</Text>
                    </TouchableOpacity>
                </View>
            ) : getFilteredDishes().length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="restaurant-menu" size={44} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>Блюда не найдены</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.mainScroll}
                    contentContainerStyle={styles.mainScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {getFilteredDishes().map((dish, index) => {
                        const qty = cart[cartKey(dish.id)]?.quantity || 0;
                        const isUnavailable = dish.is_available === false;

                        return (
                            <Animated.View
                                key={dish.id}
                                style={[
                                    styles.dishCard,
                                    isUnavailable && styles.dishCardUnavailable,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{
                                            translateY: fadeAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [15 + index * 5, 0],
                                            })
                                        }],
                                    },
                                ]}
                            >
                                {dish.image ? (
                                    <Image source={{ uri: dish.image }} style={styles.dishImage} />
                                ) : (
                                    <View style={[styles.dishImage, styles.dishImagePlaceholder]}>
                                        <MaterialIcons name="restaurant" size={28} color={COLORS.textMuted} />
                                    </View>
                                )}

                                <View style={styles.dishInfo}>
                                    <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                                    {dish.description ? (
                                        <Text style={styles.dishDesc} numberOfLines={2}>{dish.description}</Text>
                                    ) : null}
                                    <View style={styles.dishMeta}>
                                        <Text style={styles.dishPrice}>{formatCurrency(parseFloat(dish.price))}</Text>
                                        {dish.cooking_time ? (
                                            <View style={styles.timeTag}>
                                                <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                                                <Text style={styles.timeText}>{dish.cooking_time} мин</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>

                                {isUnavailable ? (
                                    <View style={styles.unavailableBadge}>
                                        <Text style={styles.unavailableText}>{dish.unavailable_reason || 'Нет в наличии'}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.qtyControls}>
                                        {qty > 0 ? (
                                            <>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(dish.id)}>
                                                    <MaterialIcons name="remove" size={18} color={COLORS.primary} />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyText}>{qty}</Text>
                                                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={() => addToCart(dish.id)}>
                                                    <MaterialIcons name="add" size={18} color={COLORS.white} />
                                                </TouchableOpacity>
                                            </>
                                        ) : (
                                            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={() => addToCart(dish.id)}>
                                                <MaterialIcons name="add" size={18} color={COLORS.white} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </Animated.View>
                        );
                    })}
                </ScrollView>
            )}

            {/* Cart Bar */}
            {getCartItemCount() > 0 && (
                <TouchableOpacity
                    activeOpacity={0.9}
                    style={[
                        styles.cartBar,
                        (submitting || menuError || dishes.length === 0) && { opacity: 0.7 },
                    ]}
                    onPress={handleSubmitOrder}
                    disabled={submitting || Boolean(menuError) || dishes.length === 0}
                >
                    <View style={styles.cartBarLeft}>
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{getCartItemCount()}</Text>
                        </View>
                        <Text style={styles.cartBarTitle}>
                            {submitting ? 'Оформление...' : 'Оформить заказ'}
                        </Text>
                    </View>
                    <Text style={styles.cartBarPrice}>{formatCurrency(getCartTotal())}</Text>
                </TouchableOpacity>
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
        backgroundColor: COLORS.backgroundLight,
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
    catWrapper: {
        marginBottom: 4,
    },
    seatContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 8,
        flexDirection: 'row',
    },
    seatPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
    },
    seatPillActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    seatText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    seatTextActive: {
        color: COLORS.white,
    },
    catContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 10,
        flexDirection: 'row',
    },
    catPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 9999,
        gap: 6,
    },
    catPillActive: {
        backgroundColor: COLORS.primary,
    },
    catPillInactive: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    catEmoji: {
        fontSize: 18,
    },
    catText: {
        fontSize: 14,
        fontWeight: '600',
    },
    catTextActive: {
        color: COLORS.white,
    },
    catTextInactive: {
        color: COLORS.textMuted,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    emptySubtitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        color: COLORS.textMuted,
    },
    retryBtn: {
        marginTop: 6,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
    },
    retryBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.white,
    },
    mainScroll: {
        flex: 1,
    },
    mainScrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 140,
    },
    dishCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    dishCardUnavailable: {
        opacity: 0.5,
    },
    dishImage: {
        width: 72,
        height: 72,
        borderRadius: 14,
    },
    dishImagePlaceholder: {
        backgroundColor: COLORS.slate100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dishInfo: {
        flex: 1,
        marginLeft: 14,
    },
    dishName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 2,
    },
    dishDesc: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 6,
        lineHeight: 18,
    },
    dishMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dishPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
    },
    timeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.slate100,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    unavailableBadge: {
        backgroundColor: 'rgba(238, 90, 111, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    unavailableText: {
        fontSize: 12,
        color: '#EE5A6F',
        fontWeight: '600',
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBtnFilled: {
        backgroundColor: COLORS.primary,
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
        minWidth: 20,
        textAlign: 'center',
    },
    cartBar: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
        backgroundColor: COLORS.primary,
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
        elevation: 10,
    },
    cartBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cartBadge: {
        width: 28,
        height: 28,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.white,
    },
    cartBarTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    cartBarPrice: {
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.white,
    },
});
