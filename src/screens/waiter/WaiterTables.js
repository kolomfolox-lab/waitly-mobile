import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ScrollView,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getTables, getTodayBookings, getOrders } from '../../api/apiService';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    danger: '#EE5A6F',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
};

const { width } = Dimensions.get('window');

export default function WaiterTables({ navigation }) {
    const { t } = useTranslation();
    const [tables, setTables] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const filters = [
        { key: 'ALL', label: t('filter_all') },
        { key: 'AVAILABLE', label: t('filter_available') },
        { key: 'OCCUPIED', label: t('filter_occupied') },
        { key: 'RESERVED', label: t('filter_reserved') },
    ];

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const [cardAnims, setCardAnims] = useState([]);

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
            }),
        ]).start();
    }, []);

    const fetchTables = useCallback(async () => {
        try {
            setError(false);
            const [tablesData, bookingsData, ordersData] = await Promise.all([
                getTables(),
                getTodayBookings().catch(() => []),
                getOrders().catch(() => ({ results: [] })),
            ]);

            const tablesList = tablesData.results || tablesData || [];
            const bookingsList = Array.isArray(bookingsData) ? bookingsData :
                (bookingsData?.results || []);
            const ordersList = ordersData.results || ordersData || [];

            // Build a map of booked table IDs
            const bookedTableIds = new Set(bookingsList.map(b => b.table));

            // Build a set of tables that have active orders (not delivered/cancelled)
            const tablesWithActiveOrders = new Set();
            const tableOrderInfo = {};
            if (Array.isArray(ordersList)) {
                ordersList.forEach(o => {
                    if (['CREATED', 'ACCEPTED', 'COOKING', 'READY'].includes(o.status)) {
                        // Use table UUID if available, or match by table_number
                        if (o.table) tablesWithActiveOrders.add(o.table);
                        tableOrderInfo[o.table] = o;
                    }
                });
            }

            // Map API tables to our display format
            const mapped = tablesList.map((table) => {
                let status = 'AVAILABLE';
                let label = t('table_ready_to_accept');
                let subLabel = null;

                if (table.is_occupied || tablesWithActiveOrders.has(table.id)) {
                    const activeOrder = tableOrderInfo[table.id];
                    if (activeOrder) {
                        status = activeOrder.status === 'READY' ? 'READY' : 'OCCUPIED';
                        const statusText = {
                            CREATED: t('table_order_new'),
                            ACCEPTED: t('table_order_accepted'),
                            COOKING: t('table_order_cooking'),
                            READY: t('table_order_ready'),
                        }[activeOrder.status] || t('table_busy');
                        label = statusText;
                        subLabel = activeOrder.waiter_name || table.current_waiter_name || '';
                    } else {
                        status = 'OCCUPIED';
                        label = table.current_waiter_name || t('table_busy');
                        subLabel = '';
                    }
                } else if (bookedTableIds.has(table.id)) {
                    status = 'RESERVED';
                    const booking = bookingsList.find((entry) => entry.table === table.id);
                    label = booking?.guest_count
                        ? t('booking_guests', { count: booking.guest_count })
                        : t('table_booking');
                    subLabel = booking?.booking_time
                        ? t('booking_at_time', { time: booking.booking_time.slice(0, 5) })
                        : '';
                }

                return {
                    id: table.id,
                    number: table.number,
                    status,
                    capacity: 0,
                    label,
                    subLabel,
                    is_occupied: table.is_occupied || tablesWithActiveOrders.has(table.id),
                };
            });

            setTables(mapped);
        } catch (e) {
            console.log('Tables fetch failed:', e.message);
            setTables([]);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            fetchTables();
        }, [fetchTables])
    );

    useEffect(() => {
        const filtered = getFilteredTables();
        const anims = filtered.map(() => ({
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(30),
            scale: new Animated.Value(0.9),
        }));
        setCardAnims(anims);

        if (filtered.length > 0) {
            const animations = anims.map((anim, index) =>
                Animated.parallel([
                    Animated.timing(anim.opacity, {
                        toValue: 1,
                        duration: 400,
                        delay: index * 80,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.back(1.5)),
                    }),
                    Animated.timing(anim.translateY, {
                        toValue: 0,
                        duration: 500,
                        delay: index * 80,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.back(1.5)),
                    }),
                    Animated.spring(anim.scale, {
                        toValue: 1,
                        friction: 6,
                        tension: 40,
                        delay: index * 80,
                        useNativeDriver: true,
                    }),
                ])
            );
            Animated.parallel(animations).start();
        }
    }, [tables, activeFilter]);

    const getFilteredTables = () => {
        if (activeFilter === 'ALL') return tables;
        if (activeFilter === 'AVAILABLE') return tables.filter(t => t.status === 'AVAILABLE');
        if (activeFilter === 'OCCUPIED') return tables.filter(t => t.status === 'OCCUPIED' || t.status === 'READY');
        if (activeFilter === 'RESERVED') return tables.filter(t => t.status === 'RESERVED');
        return tables;
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTables();
        setRefreshing(false);
    }, [fetchTables]);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'READY':
                return {
                    borderColor: COLORS.success,
                    borderWidth: 2,
                    circleBg: 'rgba(82, 214, 129, 0.12)',
                    textColor: COLORS.success,
                    dotColor: COLORS.success,
                    text: t('table_ready'),
                };
            case 'OCCUPIED':
                return {
                    borderColor: COLORS.primary,
                    borderWidth: 2,
                    circleBg: 'rgba(255, 107, 107, 0.1)',
                    textColor: COLORS.primary,
                    dotColor: COLORS.danger,
                    text: t('table_busy'),
                };
            case 'RESERVED':
                return {
                    borderColor: COLORS.warning,
                    borderWidth: 2,
                    circleBg: 'rgba(247, 183, 49, 0.1)',
                    textColor: COLORS.warning,
                    dotColor: COLORS.warning,
                    text: t('table_booking'),
                };
            default:
                return {
                    borderColor: 'transparent',
                    borderWidth: 1,
                    circleBg: COLORS.backgroundLight,
                    textColor: COLORS.textDark,
                    dotColor: COLORS.success,
                    text: t('table_free'),
                };
        }
    };

    const handleTablePress = (table) => {
        if (table.status === 'RESERVED') return;
        if (table.is_occupied) {
            navigation.navigate('OrderModify', { tableNumber: table.number, tableId: table.id });
        } else {
            navigation.navigate('OrderCreation', { tableNumber: table.number, tableId: table.id });
        }
    };

    const renderTable = (item, index) => {
        const anims = cardAnims[index] || {
            opacity: new Animated.Value(1),
            translateY: new Animated.Value(0),
            scale: new Animated.Value(1),
        };
        const s = getStatusStyles(item.status);

        return (
            <Animated.View
                key={item.id}
                style={[
                    styles.tableCardWrapper,
                    {
                        opacity: anims.opacity,
                        transform: [
                            { translateY: anims.translateY },
                            { scale: anims.scale },
                        ],
                    },
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleTablePress(item)}
                    style={[styles.tableCard, { borderColor: s.borderColor, borderWidth: s.borderWidth }]}
                >
                    <View style={[styles.tableCircle, { backgroundColor: s.circleBg }]}>
                        <Text style={[styles.tableNumber, { color: s.textColor }]}>{item.number}</Text>
                    </View>

                    <View style={styles.tableInfo}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: s.dotColor }]} />
                            <Text style={[styles.statusText, { color: s.dotColor }]}>
                                {s.text}
                            </Text>
                        </View>

                        {item.status === 'OCCUPIED' || item.status === 'READY' || item.status === 'RESERVED' ? (
                            <Text style={styles.boldLabel}>{item.label}</Text>
                        ) : (
                            <Text style={styles.mutedLabel}>{item.label}</Text>
                        )}

                        {item.subLabel ? (
                            <View style={styles.subLabelRow}>
                                {(item.status === 'OCCUPIED' || item.status === 'READY') && (
                                    <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                                )}
                                <Text style={styles.mutedLabelSmall}>{item.subLabel}</Text>
                            </View>
                        ) : null}

                        {item.status === 'READY' ? (
                            <View style={styles.readyHintPill}>
                                <MaterialIcons name="touch-app" size={13} color={COLORS.success} />
                                <Text style={styles.readyHintText}>{t('table_open_hint')}</Text>
                            </View>
                        ) : null}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>{t('waiter_tables_title')}</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MaterialIcons name="tune" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.filtersWrapper, { opacity: fadeAnim }]}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    {filters.map((filter, index) => {
                        const isActive = activeFilter === filter.key;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => setActiveFilter(filter.key)}
                                style={[
                                    styles.filterPill,
                                    isActive ? styles.filterPillActive : styles.filterPillInactive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        isActive ? styles.filterTextActive : styles.filterTextInactive,
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>

            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.mainScrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.gridContainer}>
                    {getFilteredTables().map((item, index) => renderTable(item, index))}
                </View>

                {loading && (
                    <View style={styles.emptyWrap}>
                        <MaterialIcons name="hourglass-empty" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>{t('tables_loading')}</Text>
                    </View>
                )}

                {!loading && error ? (
                    <TouchableOpacity style={styles.emptyWrap} activeOpacity={0.8} onPress={fetchTables}>
                        <MaterialIcons name="wifi-off" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>{t('tables_load_failed')}</Text>
                        <Text style={styles.emptySubTitle}>{t('tap_to_retry')}</Text>
                    </TouchableOpacity>
                ) : null}

                {!loading && !error && getFilteredTables().length === 0 && (
                    <View style={styles.emptyWrap}>
                        <MaterialIcons name="table-restaurant" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>{t('no_tables_found')}</Text>
                    </View>
                )}
            </ScrollView>
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
        backgroundColor: 'rgba(248, 245, 245, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 107, 107, 0.08)',
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    filtersWrapper: {
        marginBottom: 4,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 10,
        flexDirection: 'row',
    },
    filterPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterPillActive: {
        backgroundColor: COLORS.primary,
    },
    filterPillInactive: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    filterTextActive: {
        color: COLORS.white,
    },
    filterTextInactive: {
        color: COLORS.textMuted,
    },
    mainScroll: {
        flex: 1,
    },
    mainScrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
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
    tableCard: {
        backgroundColor: COLORS.white,
        borderRadius: 18,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
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
        fontSize: 28,
        fontWeight: '800',
    },
    tableInfo: {
        alignItems: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
        fontWeight: '600',
    },
    boldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textDark,
        marginTop: 2,
    },
    mutedLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
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
    readyHintPill: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(82, 214, 129, 0.12)',
    },
    readyHintText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.success,
    },
    emptyWrap: {
        paddingVertical: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    emptySubTitle: {
        marginTop: 4,
        fontSize: 13,
        color: COLORS.textMuted,
    },
});
