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
    Dimensions
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchTables } from '../../api/tables';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    backgroundDark: '#230f0f',
    success: '#52D681',
    danger: '#EE5A6F',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textLight: '#f1f5f9',
    textMuted: '#94a3b8',
    textSlate400: '#94a3b8',
    slate800: '#1e293b',
    slate700: '#334155',
    slate100: '#f1f5f9',
};

const { width } = Dimensions.get('window');

const FILTERS = ['Все', 'Свободные', 'Заняты', 'Забронированные'];

export default function WaiterTables({ navigation }) {
    const { user } = useAuth();
    const [tables, setTables] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('Все');
    const [loading, setLoading] = useState(true);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    // An array of animated values for each table card to create a stagger effect
    const [cardAnims, setCardAnims] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Re-calculate card animations when tables or active filter changes
        const filtered = getFilteredTables();
        const anims = filtered.map(() => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(30),
            scale: new Animated.Value(0.9)
        }));
        setCardAnims(anims);

        if (filtered.length > 0) {
            // Trigger exit animation for old cards (handled implicitly by re-render)
            // Trigger entry staggred animation
            const animations = anims.map((anim, index) => {
                return Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 1,
                        duration: 400,
                        delay: index * 100, // Stagger effect
                        useNativeDriver: true,
                        easing: Easing.out(Easing.back(1.5)),
                    }),
                    Animated.timing(anim.translateY, {
                        toValue: 0,
                        duration: 500,
                        delay: index * 100,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.back(1.5)),
                    }),
                    Animated.spring(anim.scale, {
                        toValue: 1,
                        friction: 6,
                        tension: 40,
                        delay: index * 100,
                        useNativeDriver: true,
                    })
                ]);
            });

            Animated.parallel(animations).start();
        }
    }, [tables, activeFilter]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Simulate fetching tables, but map them to the design's states
            const data = await fetchTables();
            let loadedTables = data.results || data || [];
            if (loadedTables.length === 0) {
                // Mock data if empty to match the design's "sick" look
                loadedTables = [
                    { id: 1, number: 5, status: 'AVAILABLE', label: 'Готов к приему' },
                    { id: 2, number: 3, status: 'OCCUPIED', label: 'Мария И.', subLabel: '25 мин' },
                    { id: 3, number: 12, status: 'RESERVED', label: '4 гостя', subLabel: 'Через 15 мин', time: '18:00' },
                    { id: 4, number: 8, status: 'AVAILABLE', label: 'У окна' },
                ];
            } else {
                // Map API tables to design variables roughly
                loadedTables = loadedTables.map(t => ({
                    ...t,
                    status: t.is_occupied ? 'OCCUPIED' : 'AVAILABLE',
                    label: t.is_occupied ? 'Busy' : 'Free'
                }));
            }
            setTables(loadedTables);
        } catch (error) {
            console.error('Failed to load tables:', error);
            // Fallback to mock data for layout testing
            setTables([
                { id: 1, number: 5, status: 'AVAILABLE', label: 'Готов к приему' },
                { id: 2, number: 3, status: 'OCCUPIED', label: 'Мария И.', subLabel: '25 мин' },
                { id: 3, number: 12, status: 'RESERVED', label: '4 гостя', subLabel: 'Через 15 мин', time: '18:00' },
                { id: 4, number: 8, status: 'AVAILABLE', label: 'У окна' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getFilteredTables = () => {
        if (activeFilter === 'Все') return tables;
        if (activeFilter === 'Свободные') return tables.filter(t => t.status === 'AVAILABLE');
        if (activeFilter === 'Заняты') return tables.filter(t => t.status === 'OCCUPIED');
        if (activeFilter === 'Забронированные') return tables.filter(t => t.status === 'RESERVED');
        return tables;
    };

    const handleFilterPress = (filter) => {
        setActiveFilter(filter);
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'OCCUPIED':
                return {
                    borderColor: COLORS.primary,
                    borderWidth: 2,
                    circleBg: 'rgba(255, 107, 107, 0.1)',
                    textColor: COLORS.primary,
                    dotColor: COLORS.danger,
                    text: 'Занят',
                };
            case 'RESERVED':
                return {
                    borderColor: COLORS.warning,
                    borderWidth: 2,
                    circleBg: 'rgba(247, 183, 49, 0.1)',
                    textColor: COLORS.warning,
                    dotColor: COLORS.warning,
                    text: 'Бронь',
                };
            case 'AVAILABLE':
            default:
                return {
                    borderColor: 'transparent',
                    borderWidth: 1,
                    circleBg: COLORS.backgroundLight,
                    textColor: COLORS.textDark,
                    dotColor: COLORS.success,
                    text: 'Свободен',
                };
        }
    };

    // Render Table Card
    const renderTable = (item, index) => {
        const anims = cardAnims[index] || {
            opacity: new Animated.Value(1),
            translateY: new Animated.Value(0),
            scale: new Animated.Value(1)
        };
        const styles_s = getStatusStyles(item.status);
        const isReserved = item.status === 'RESERVED';
        const isOccupied = item.status === 'OCCUPIED';

        return (
            <Animated.View
                key={item.id}
                style={[
                    styles.tableCardWrapper,
                    {
                        opacity: anims.opacity,
                        transform: [
                            { translateY: anims.translateY },
                            { scale: anims.scale }
                        ]
                    }
                ]}
            >
                <TouchableOpacity activeOpacity={0.8} style={styles.touchableArea}>
                    <View style={[styles.tableCard, { borderColor: styles_s.borderColor, borderWidth: styles_s.borderWidth }]}>
                        {/* Circle */}
                        <View style={[styles.tableCircle, { backgroundColor: styles_s.circleBg }]}>
                            <Text style={[styles.tableNumber, { color: styles_s.textColor }]}>{item.number}</Text>
                        </View>

                        {/* Info Block */}
                        <View style={styles.tableInfo}>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: styles_s.dotColor }]} />
                                <Text style={[styles.statusText, { color: styles_s.dotColor }]}>
                                    {styles_s.text} {item.time ? item.time : ''}
                                </Text>
                            </View>

                            {/* Main Label */}
                            {isOccupied || isReserved ? (
                                <Text style={styles.boldLabel}>{item.label}</Text>
                            ) : (
                                <Text style={styles.mutedLabel}>{item.label}</Text>
                            )}

                            {/* Sub Label */}
                            {item.subLabel && (
                                <View style={styles.subLabelRow}>
                                    {isOccupied && <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />}
                                    <Text style={styles.mutedLabelSmall}>{item.subLabel}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Столики</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MaterialIcons name="tune" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
            </Animated.View>

            {/* Filters */}
            <Animated.View style={[styles.filtersWrapper, { opacity: fadeAnim }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    {FILTERS.map((filter, index) => {
                        const isActive = activeFilter === filter;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => handleFilterPress(filter)}
                                style={[
                                    styles.filterPill,
                                    isActive ? styles.filterPillActive : styles.filterPillInactive
                                ]}
                            >
                                <Text style={[
                                    styles.filterText,
                                    isActive ? styles.filterTextActive : styles.filterTextInactive
                                ]}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            {/* Tables Grid */}
            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.mainScrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.gridContainer}>
                    {getFilteredTables().map((item, index) => renderTable(item, index))}
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.replace('WaiterDashboard')}>
                    <MaterialIcons name="dashboard" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Дашборд</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="table-restaurant" size={24} color={COLORS.primary} />
                    <Text style={styles.navLabelActive}>Столы</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="content-copy" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Заказы</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="restaurant-menu" size={24} color={COLORS.textMuted} />
                    <Text style={styles.navLabel}>Меню</Text>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'rgba(248, 245, 245, 0.9)',
        zIndex: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 107, 107, 0.1)',
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textDark,
        fontFamily: 'System',
    },
    filtersWrapper: {
        marginBottom: 8,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 12,
        flexDirection: 'row',
    },
    filterPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    filterPillActive: {
        backgroundColor: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    filterPillInactive: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.1)',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
    },
    filterTextActive: {
        color: COLORS.white,
    },
    filterTextInactive: {
        color: COLORS.textSlate400,
    },
    mainScroll: {
        flex: 1,
    },
    mainScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // Space for bottom nav
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    tableCardWrapper: {
        width: '48%',
        marginBottom: 16,
    },
    touchableArea: {
        flex: 1,
    },
    tableCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    tableCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    tableNumber: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    tableInfo: {
        alignItems: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    boldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textDark,
        marginTop: 4,
    },
    mutedLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    subLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    mutedLabelSmall: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 107, 107, 0.1)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24, // Safe area for iPhone
        zIndex: 20,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: COLORS.textMuted,
    },
    navLabelActive: {
        fontSize: 10,
        fontWeight: '500',
        color: COLORS.primary,
    }
});
