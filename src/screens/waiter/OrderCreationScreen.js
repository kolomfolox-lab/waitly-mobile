import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing,
    TextInput,
    Image,
    Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

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

const CATEGORIES = ['Популярное', 'Горячее', 'Салаты', 'Напитки', 'Десерты'];

const MENU_ITEMS = [
    { id: 1, name: 'Стейк Рибай', desc: 'С овощами гриль и соусом пеппер', price: 2400, category: 'Горячее', image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3RlYWt8ZW58MHx8MHx8fDA%3D' },
    { id: 2, name: 'Паста Карбонара', desc: 'Классическая итальянская паста с беконом', price: 850, category: 'Горячее', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FyYm9uYXJhfGVufDB8fDB8fHww' },
    { id: 3, name: 'Салат Цезарь', desc: 'С куриным филе и перепелиными яйцами', price: 650, category: 'Салаты', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2Flc2FyJTIwc2FsYWR8ZW58MHx8MHx8fDA%3D' },
    { id: 4, name: 'Клубничный мохито', desc: 'Освежающий лимонад со свежей клубникой', price: 450, category: 'Напитки', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZHJpbmt8ZW58MHx8MHx8fDA%3D' },
    { id: 5, name: 'Тирамису', desc: 'Итальянский многослойный десерт', price: 550, category: 'Десерты', image: 'https://images.unsplash.com/photo-1571115177098-24de415b3a4f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGlyYW1pc3V8ZW58MHx8MHx8fDA%3D' },
];

export default function OrderCreationScreen({ navigation, route }) {
    // Expected to receive { tableNumber: 5 }
    const tableNumber = route?.params?.tableNumber || 5;

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Популярное');
    const [cart, setCart] = useState([]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    // Bottom cart panel animation
    const cartTranslateY = useRef(new Animated.Value(100)).current;

    const [itemAnims, setItemAnims] = useState([]);

    useEffect(() => {
        // Main Mount Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const filteredItems = MENU_ITEMS.filter(item => {
        const matchesCategory = activeCategory === 'Популярное' ? true : item.category === activeCategory;
        const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
    });

    useEffect(() => {
        // List mount animation triggers when items change
        const anims = filteredItems.map(() => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20)
        }));
        setItemAnims(anims);

        if (filteredItems.length > 0) {
            const animations = anims.map((anim, index) => {
                return Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 1,
                        duration: 350,
                        delay: index * 50,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.ease),
                    }),
                    Animated.spring(anim.translateY, {
                        toValue: 0,
                        friction: 8,
                        tension: 50,
                        delay: index * 50,
                        useNativeDriver: true,
                    })
                ]);
            });
            Animated.parallel(animations).start();
        }
    }, [activeCategory, searchQuery]);

    // Cart Panel Animation Effect
    useEffect(() => {
        if (cart.length > 0) {
            Animated.spring(cartTranslateY, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(cartTranslateY, {
                toValue: 150,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [cart.length]);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const formatCurrency = (val) => {
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Новый заказ</Text>
                        <Text style={styles.tableSubtitle}>Стол {tableNumber}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.iconBtn}>
                    <MaterialIcons name="qr-code-scanner" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
            </Animated.View>

            {/* Search Bar */}
            <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={22} color={COLORS.slate400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Найти блюдо..."
                        placeholderTextColor={COLORS.slate400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={20} color={COLORS.slate400} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <MaterialIcons name="tune" size={22} color={COLORS.white} />
                </TouchableOpacity>
            </Animated.View>

            {/* Categories */}
            <Animated.View style={[styles.categoriesWrapper, { opacity: fadeAnim }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {CATEGORIES.map((cat, index) => {
                        const isActive = activeCategory === cat;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => setActiveCategory(cat)}
                                style={[
                                    styles.categoryPill,
                                    isActive ? styles.categoryPillActive : styles.categoryPillInactive
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    isActive ? styles.categoryTextActive : styles.categoryTextInactive
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            {/* Menu List */}
            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={[styles.mainScrollContent, { paddingBottom: cart.length > 0 ? 120 : 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {filteredItems.map((item, index) => {
                    const anim = itemAnims[index] || { opacity: 1, translateY: 0 };
                    const cartItem = cart.find(c => c.id === item.id);
                    const qty = cartItem ? cartItem.qty : 0;

                    return (
                        <Animated.View
                            key={item.id}
                            style={[
                                styles.menuItemWrapper,
                                {
                                    opacity: anim.opacity,
                                    transform: [{ translateY: anim.translateY }]
                                }
                            ]}
                        >
                            <TouchableOpacity
                                style={[styles.menuCard, qty > 0 && styles.menuCardActive]}
                                activeOpacity={0.8}
                                onPress={() => addToCart(item)}
                            >
                                <Image source={{ uri: item.image }} style={styles.menuItemImage} />

                                <View style={styles.menuItemInfo}>
                                    <View>
                                        <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.menuItemDesc} numberOfLines={2}>{item.desc}</Text>
                                    </View>

                                    <View style={styles.menuItemFooter}>
                                        <Text style={styles.menuItemPrice}>{formatCurrency(item.price)}</Text>

                                        {qty > 0 ? (
                                            <View style={styles.qtyBadge}>
                                                <Text style={styles.qtyText}>{qty} шт</Text>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.addBtn}
                                                onPress={() => addToCart(item)}
                                            >
                                                <MaterialIcons name="add" size={20} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="search-off" size={48} color={COLORS.slate300} />
                        <Text style={styles.emptyText}>Ничего не найдено</Text>
                    </View>
                )}
            </ScrollView>

            {/* Floating Cart Panel */}
            <Animated.View
                style={[
                    styles.cartPanel,
                    { transform: [{ translateY: cartTranslateY }] }
                ]}
            >
                <View style={styles.cartInfo}>
                    <View style={styles.cartCountBadge}>
                        <Text style={styles.cartCountText}>{cartCount}</Text>
                    </View>
                    <View>
                        <Text style={styles.cartLabel}>Сумма заказа</Text>
                        <Text style={styles.cartTotal}>{formatCurrency(cartTotal)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => {
                        // In reality, this would submit the order API request
                        navigation.navigate('OrderConfirmation', {
                            orderData: { table: tableNumber, items: cart, total: cartTotal }
                        });
                    }}
                >
                    <Text style={styles.checkoutText}>Оформить</Text>
                    <MaterialIcons name="arrow-forward" size={18} color={COLORS.white} />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(248, 245, 245, 0.9)',
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    tableSubtitle: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        gap: 10,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: 8,
        fontSize: 15,
        color: COLORS.textDark,
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    categoriesWrapper: {
        marginBottom: 8,
    },
    categoriesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
    },
    categoryPill: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryPillActive: {
        backgroundColor: COLORS.textDark,
    },
    categoryPillInactive: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.slate100,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: COLORS.white,
    },
    categoryTextInactive: {
        color: COLORS.slate500,
    },
    mainScroll: {
        flex: 1,
    },
    mainScrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    menuItemWrapper: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    menuCardActive: {
        borderColor: COLORS.primaryLight,
        backgroundColor: '#fffdfd',
    },
    menuItemImage: {
        width: 86,
        height: 86,
        borderRadius: 12,
        backgroundColor: COLORS.slate100,
    },
    menuItemInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 4,
    },
    menuItemDesc: {
        fontSize: 12,
        color: COLORS.slate500,
        lineHeight: 16,
    },
    menuItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    menuItemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    addBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    qtyText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.slate400,
        fontWeight: '500',
    },
    cartPanel: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: COLORS.textDark,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
        zIndex: 50,
    },
    cartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cartCountBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartCountText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    cartLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 2,
    },
    cartTotal: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkoutBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
    },
    checkoutText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: 'bold',
    }
});
