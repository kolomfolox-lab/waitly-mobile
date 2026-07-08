import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, SafeAreaView, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../api/client';

const { width } = Dimensions.get('window');
const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#FFFFFF',
    text: '#1a1a2e',
    textMuted: '#94a3b8',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: '#f0ecec',
};

export default function GuestMenuScreen({ navigation }) {
    const { user } = useAuth();
    const { items, addItem, getTotal, getItemCount } = useCart();
    const [menuData, setMenuData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);

    const fetchMenu = useCallback(async () => {
        try {
            setError(null);
            const slug = user?.restaurant_slug;
            const table = user?.table_number;
            const response = await api.get(`/api/v1/guest/bootstrap/${slug}/${table}/`);
            const data = response.data;
            setMenuData(data);
            if (data?.categories?.length > 0 && !activeCategory) {
                setActiveCategory(data.categories[0].id);
            }
        } catch (err) {
            setError('Меню временно недоступно');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchMenu();
        }, [fetchMenu])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMenu();
    }, [fetchMenu]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка меню...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialIcons name="restaurant-menu" size={64} color={COLORS.textMuted} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMenu}>
                    <Text style={styles.retryText}>Попробовать снова</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialIcons name="inbox" size={64} color={COLORS.textMuted} />
                <Text style={styles.errorText}>Меню временно недоступно</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMenu}>
                    <Text style={styles.retryText}>Обновить</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const activeCategoryData = activeCategory
        ? menuData.categories.find(c => c.id === activeCategory)
        : menuData.categories[0];

    const dishes = activeCategoryData?.dishes || [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.restaurantName}>{menuData?.restaurant?.name || 'Меню'}</Text>
                <Text style={styles.tableInfo}>Стол №{user?.table_number}</Text>
            </View>

            <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                    {menuData.categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryTab, activeCategory === cat.id && styles.categoryTabActive]}
                            onPress={() => setActiveCategory(cat.id)}
                        >
                            <Text style={[styles.categoryTabText, activeCategory === cat.id && styles.categoryTabTextActive]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.dishesList}
                contentContainerStyle={styles.dishesContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {dishes.length === 0 ? (
                    <View style={styles.emptyDishes}>
                        <MaterialIcons name="fastfood" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyDishesText}>В этой категории пока нет блюд</Text>
                    </View>
                ) : (
                    dishes.map(dish => (
                        <View key={dish.id} style={styles.dishCard}>
                            {dish.image ? (
                                <Image source={{ uri: dish.image }} style={styles.dishImage} />
                            ) : (
                                <View style={styles.dishImagePlaceholder}>
                                    <MaterialIcons name="fastfood" size={32} color={COLORS.textMuted} />
                                </View>
                            )}
                            <View style={styles.dishInfo}>
                                <View style={styles.dishNameRow}>
                                    <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>
                                    {dish.is_popular || dish.order_count > 50 ? (
                                        <View style={styles.popularBadge}>
                                            <MaterialIcons name="star" size={10} color="#fff" />
                                            <Text style={styles.popularBadgeText}>Популярное</Text>
                                        </View>
                                    ) : null}
                                </View>
                                {dish.description ? (
                                    <Text style={styles.dishDescription} numberOfLines={2}>{dish.description}</Text>
                                ) : null}
                                <Text style={styles.dishPrice}>{Number(dish.price).toLocaleString()} UZS</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => addItem(dish, 1)}
                            >
                                <MaterialIcons name="add" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {items.length > 0 && (
                <TouchableOpacity
                    style={styles.cartBar}
                    onPress={() => navigation.navigate('GuestCart')}
                    activeOpacity={0.9}
                >
                    <View style={styles.cartBarLeft}>
                        <MaterialIcons name="shopping-cart" size={22} color={COLORS.white} />
                        <Text style={styles.cartBarText}>{getItemCount()} товаров</Text>
                    </View>
                    <View style={styles.cartBarRight}>
                        <Text style={styles.cartBarTotal}>{getTotal()} UZS</Text>
                        <MaterialIcons name="chevron-right" size={22} color={COLORS.white} />
                    </View>
                </TouchableOpacity>
            )}
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
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: COLORS.textMuted,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 32,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    restaurantName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
    },
    tableInfo: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    categoriesContainer: {
        paddingVertical: 12,
    },
    categoriesScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    categoryTab: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryTabActive: {
        backgroundColor: COLORS.primary,
    },
    categoryTabText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
    },
    categoryTabTextActive: {
        color: COLORS.white,
    },
    dishesList: {
        flex: 1,
    },
    dishesContent: {
        padding: 20,
        paddingTop: 4,
        paddingBottom: 100,
    },
    emptyDishes: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyDishesText: {
        marginTop: 12,
        fontSize: 15,
        color: COLORS.textMuted,
    },
    dishCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    dishImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: COLORS.border,
    },
    dishImagePlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dishInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    dishNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dishName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        flexShrink: 1,
    },
    popularBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    popularBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
        textTransform: 'uppercase',
    },
    dishDescription: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    dishPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
        marginTop: 4,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.text,
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    cartBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartBarText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '600',
    },
    cartBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cartBarTotal: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
