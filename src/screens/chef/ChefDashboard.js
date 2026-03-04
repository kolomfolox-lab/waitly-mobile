import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Animated,
    Easing,
    TextInput,
    Image,
    Switch
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.1)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    danger: '#EE5A6F',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate800: '#1e293b',
    slate700: '#334155',
    slate300: '#cbd5e1',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
};

const CATEGORIES = ['Все', 'Горячее', 'Салаты', 'Напитки', 'Супы'];

export default function ChefDashboard({ navigation }) {
    const { user, logout } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Все');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Menu Items based on design
    const [menuItems, setMenuItems] = useState([
        { id: 1, name: 'Стейк Рибай', desc: 'С овощами гриль и соусом', price: 2400, category: 'Горячее', isAvailable: true, inStock: 12, image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=500&auto=format&fit=crop&q=60' },
        { id: 2, name: 'Паста Карбонара', desc: 'Классическая итальянская', price: 850, category: 'Горячее', isAvailable: true, inStock: 45, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=60' },
        { id: 3, name: 'Том Ям', desc: 'Острый тайский суп с морепродуктами', price: 950, category: 'Супы', isAvailable: false, inStock: 0, image: 'https://images.unsplash.com/photo-1548943487-a2e4b43b485d?w=500&auto=format&fit=crop&q=60' },
        { id: 4, name: 'Салат Цезарь', desc: 'С куриным филе', price: 650, category: 'Салаты', isAvailable: true, inStock: 20, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=60' },
    ]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    // Staggered list animations for items
    const [itemAnims, setItemAnims] = useState([]);

    useEffect(() => {
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

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'Все' ? true : item.category === activeCategory;
        const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
    });

    useEffect(() => {
        // Trigger exit/enter animations for list when filter changes
        const anims = filteredItems.map(() => ({
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.95)
        }));
        setItemAnims(anims);

        if (filteredItems.length > 0) {
            const animations = anims.map((anim, index) => {
                return Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 1,
                        duration: 300,
                        delay: index * 50,
                        useNativeDriver: true,
                    }),
                    Animated.spring(anim.scale, {
                        toValue: 1,
                        friction: 7,
                        tension: 40,
                        delay: index * 50,
                        useNativeDriver: true,
                    })
                ]);
            });
            Animated.parallel(animations).start();
        }
    }, [activeCategory, searchQuery]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1200);
    }, []);

    const toggleAvailability = (id) => {
        setMenuItems(prev => prev.map(item => {
            if (item.id === id) {
                // Return new object with toggled availability
                return { ...item, isAvailable: !item.isAvailable };
            }
            return item;
        }));
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.profileBtn} onPress={logout}>
                        <Text style={styles.profileInitials}>{user?.full_name?.charAt(0) || 'Ш'}</Text>
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.greeting}>Управление меню,</Text>
                        <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Шеф'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.iconBtn}>
                    <MaterialIcons name="notifications-none" size={26} color={COLORS.textDark} />
                </TouchableOpacity>
            </Animated.View>

            {/* Stop List Summary Card */}
            <Animated.View style={[styles.summaryCardWrapper, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                <View style={[styles.summaryCard, { backgroundColor: COLORS.textDark }]}>
                    <View style={styles.summaryLeft}>
                        <Text style={styles.summaryTitle}>Блюда в СТОПе</Text>
                        <Text style={styles.summaryValue}>{menuItems.filter(i => !i.isAvailable).length}</Text>
                        <TouchableOpacity style={styles.summaryActionBtn}>
                            <Text style={styles.summaryActionText}>Посмотреть все</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.summaryRight}>
                        <View style={styles.summaryIconBox}>
                            <MaterialIcons name="block" size={32} color={COLORS.danger} />
                        </View>
                    </View>
                </View>
            </Animated.View>

            {/* Search and Filters */}
            <Animated.View style={[styles.controlsArea, { opacity: fadeAnim }]}>
                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={22} color={COLORS.slate400} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Найти блюдо..."
                        placeholderTextColor={COLORS.slate400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.categoriesWrapper}>
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
                </View>
            </Animated.View>

            {/* Menu List */}
            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.mainScrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {filteredItems.map((item, index) => {
                    const anim = itemAnims[index] || { opacity: 1, scale: 1 };

                    return (
                        <Animated.View
                            key={item.id}
                            style={[
                                styles.menuItemWrapper,
                                {
                                    opacity: anim.opacity,
                                    transform: [{ scale: anim.scale }]
                                }
                            ]}
                        >
                            <View style={[styles.menuCard, !item.isAvailable && styles.menuCardUnavailable]}>
                                <Image
                                    source={{ uri: item.image }}
                                    style={[styles.menuItemImage, !item.isAvailable && styles.imageUnavailable]}
                                />

                                <View style={styles.menuItemInfo}>
                                    <View>
                                        <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.menuItemDesc} numberOfLines={1}>{item.desc}</Text>
                                    </View>

                                    <View style={styles.menuItemFooter}>
                                        <View style={styles.stockInfo}>
                                            <MaterialIcons
                                                name={item.inStock > 0 ? "inventory" : "warning"}
                                                size={14}
                                                color={item.inStock > 0 ? COLORS.slate500 : COLORS.warning}
                                            />
                                            <Text style={[styles.stockText, item.inStock === 0 && styles.stockWarning]}>
                                                {item.inStock} в наличии
                                            </Text>
                                        </View>

                                        <View style={styles.switchWrapper}>
                                            <Switch
                                                trackColor={{ false: COLORS.slate200, true: COLORS.success }}
                                                thumbColor={COLORS.white}
                                                ios_backgroundColor={COLORS.slate200}
                                                onValueChange={() => toggleAvailability(item.id)}
                                                value={item.isAvailable}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            {/* Bottom Nav matches Chef View */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="grid-view" size={24} color={COLORS.primary} />
                    <Text style={styles.navLabelActive}>Меню</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="av-timer" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Заказы</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="insert-chart-outlined" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Статистика</Text>
                </TouchableOpacity>
            </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitials: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    greeting: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.slate100,
    },
    summaryCardWrapper: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    summaryCard: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    summaryLeft: {
        flex: 1,
    },
    summaryTitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    summaryValue: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    summaryActionBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    summaryActionText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
    },
    summaryIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(238, 90, 111, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlsArea: {
        marginBottom: 4,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 1,
        borderWidth: 1,
        borderColor: COLORS.slate100,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: 12,
        fontSize: 15,
        color: COLORS.textDark,
    },
    categoriesContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryPillActive: {
        backgroundColor: COLORS.primary,
    },
    categoryPillInactive: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.slate200,
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
        paddingBottom: 100, // Bottom nav space
    },
    menuItemWrapper: {
        marginBottom: 12,
    },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        gap: 16,
        borderWidth: 1,
        borderColor: COLORS.slate100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2,
    },
    menuCardUnavailable: {
        backgroundColor: '#fafafa',
        borderColor: COLORS.slate200,
    },
    menuItemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: COLORS.slate100,
    },
    imageUnavailable: {
        opacity: 0.5,
        tintColor: 'gray', // Rough visual cue
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
        color: COLORS.slate400,
    },
    menuItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    stockInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stockText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.slate500,
    },
    stockWarning: {
        color: COLORS.warning,
    },
    switchWrapper: {
        transform: [{ scale: 0.9 }],
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 28, // Safe area
        zIndex: 20,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    navLabelActive: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.primary,
    }
});
