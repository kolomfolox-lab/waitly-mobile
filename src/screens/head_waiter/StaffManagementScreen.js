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
    Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.1)',
    primaryBorder: 'rgba(255, 107, 107, 0.05)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    danger: '#EE5A6F',
    warning: '#F7B731',
    info: '#4EA8DE',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate800: '#1e293b',
    slate700: '#334155',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate300: '#cbd5e1',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
};

const FILTERS = ['Все', 'Официанты', 'Повара', 'Шеф-повара'];

export default function StaffManagementScreen({ navigation }) {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('Все');

    const [staff, setStaff] = useState([]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    // Staggered list animations
    const [itemAnims, setItemAnims] = useState([]);

    useEffect(() => {
        setupAnimations(staff);
    }, [activeFilter, staff]);

    const setupAnimations = (items) => {
        const anims = items.map(() => ({
            opacity: new Animated.Value(0),
            translateX: new Animated.Value(30) // Slide in from right
        }));
        setItemAnims(anims);

        if (items.length > 0) {
            const animations = anims.map((anim, index) => {
                return Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 1,
                        duration: 350,
                        delay: index * 100,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.ease),
                    }),
                    Animated.spring(anim.translateX, {
                        toValue: 0,
                        friction: 7,
                        tension: 40,
                        delay: index * 100,
                        useNativeDriver: true,
                    })
                ]);
            });
            Animated.parallel(animations).start();
        }
    };

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

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await apiClient.get('/api/owner/staff/');
            const data = res.data;
            setStaff(data);
        } catch {
            setStaff([]);
        }
        setRefreshing(false);
    }, []);

    const getFilteredStaff = () => {
        if (activeFilter === 'Все') return staff;
        // Map filter names to internal roles roughly
        const roleMap = {
            'Официанты': 'Официант',
            'Повара': 'Повар',
            'Шеф-повара': 'Шеф-повар'
        };
        const targetRole = roleMap[activeFilter];
        return staff.filter(s => s.role === targetRole);
    };

    const targetStaff = getFilteredStaff();
    const onlineStaff = targetStaff.filter(s => s.status === 'online');
    const offlineStaff = targetStaff.filter(s => s.status === 'offline');

    const renderStaffCard = (item, index, globalIndex) => {
        const anim = itemAnims[globalIndex] || { opacity: 1, translateX: 0 };
        const isOnline = item.status === 'online';

        return (
            <Animated.View
                key={item.id}
                style={[
                    styles.staffCardWrapper,
                    {
                        opacity: anim.opacity,
                        transform: [{ translateX: anim.translateX }]
                    },
                    !isOnline && styles.offlineOpacity
                ]}
            >
                <View style={styles.staffCard}>
                    {/* Left: Avatar & Info */}
                    <View style={styles.staffCardLeft}>
                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            <View style={[
                                styles.avatarImageWrapper,
                                !isOnline && styles.avatarImageWrapperOffline
                            ]}>
                                {item.avatar ? (
                                    <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                                ) : (
                                    <MaterialIcons name="person" size={28} color={isOnline ? COLORS.primary : COLORS.slate400} />
                                )}
                            </View>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: isOnline ? COLORS.success : COLORS.slate400 }
                            ]} />
                        </View>

                        {/* Info */}
                        <View style={styles.staffInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.staffName} numberOfLines={1}>{item.name}</Text>
                                <View style={[styles.roleTag, !isOnline && styles.roleTagOffline]}>
                                    <Text style={[styles.roleTagText, !isOnline && styles.roleTagTextOffline]}>
                                        {item.role.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.staffPhone}>{item.phone}</Text>

                            {/* Stats */}
                            {item.stats && (
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <MaterialIcons name="receipt-long" size={14} color={isOnline ? COLORS.primary : COLORS.slate400} />
                                        <Text style={[styles.statValue, !isOnline && styles.statValueOffline]}>
                                            {item.stats.orders} заказов
                                        </Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <MaterialIcons name="star" size={14} color={isOnline ? COLORS.warning : COLORS.slate400} />
                                        <Text style={[styles.statValue, !isOnline && styles.statValueOffline]}>
                                            {item.stats.rating}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Right: Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.actionBtn}>
                            <MaterialIcons name="edit" size={20} color={COLORS.slate400} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <MaterialIcons name="delete" size={20} color={COLORS.slate400} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                <View style={styles.headerTitleRow}>
                    <MaterialIcons name="group" size={24} color={COLORS.primary} />
                    <Text style={styles.headerTitle}>Персонал</Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                    <MaterialIcons name="add" size={18} color={COLORS.white} />
                    <Text style={styles.addBtnText}>Добавить</Text>
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
                                onPress={() => setActiveFilter(filter)}
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

            {/* Staff List */}
            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.mainScrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Online section */}
                {onlineStaff.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionDot} />
                            <Text style={styles.sectionTitle}>На смене</Text>
                        </View>
                        {onlineStaff.map((staff, idx) => renderStaffCard(staff, idx, idx))}
                    </View>
                )}

                {/* Offline section */}
                {offlineStaff.length > 0 && (
                    <View style={[styles.sectionContainer, { marginTop: onlineStaff.length > 0 ? 16 : 0 }]}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDot, styles.sectionDotOffline]} />
                            <Text style={styles.sectionTitle}>Не на смене</Text>
                        </View>
                        {offlineStaff.map((staff, idx) => renderStaffCard(staff, idx, onlineStaff.length + idx))}
                    </View>
                )}
            </ScrollView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="dashboard" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Дашборд</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="table-restaurant" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Столы</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="receipt" size={24} color={COLORS.slate400} />
                    <Text style={styles.navLabel}>Заказы</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <MaterialIcons name="manage-accounts" size={24} color={COLORS.primary} />
                    <Text style={styles.navLabelActive}>Персонал</Text>
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
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(248, 245, 245, 0.9)',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.primaryBorder,
        zIndex: 10,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        letterSpacing: -0.5,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addBtnText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 14,
    },
    filtersWrapper: {
        marginBottom: 8,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterPillActive: {
        backgroundColor: COLORS.primary,
    },
    filterPillInactive: {
        backgroundColor: COLORS.primaryLight,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
    },
    filterTextActive: {
        color: COLORS.white,
    },
    filterTextInactive: {
        color: COLORS.slate700,
    },
    mainScroll: {
        flex: 1,
    },
    mainScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // Bottom nav space
    },
    sectionContainer: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        marginBottom: 8,
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
    },
    sectionDotOffline: {
        backgroundColor: COLORS.slate300,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: COLORS.slate500,
    },
    staffCardWrapper: {
        marginBottom: 12,
    },
    offlineOpacity: {
        opacity: 0.7,
    },
    staffCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    staffCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarImageWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.primaryBorder,
    },
    avatarImageWrapperOffline: {
        backgroundColor: COLORS.slate200,
        borderColor: COLORS.slate100,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    staffInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    staffName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.textDark,
        flexShrink: 1, // To truncate if long
    },
    roleTag: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    roleTagOffline: {
        backgroundColor: COLORS.slate100,
    },
    roleTagText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    roleTagTextOffline: {
        color: COLORS.slate500,
    },
    staffPhone: {
        fontSize: 12,
        color: COLORS.slate500,
        marginBottom: 6,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.slate500,
    },
    statValueOffline: {
        color: COLORS.slate400,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    actionBtn: {
        padding: 8,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.primaryBorder,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 24, // Safe Area
        zIndex: 20,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.slate400,
    },
    navLabelActive: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.primary,
    }
});
