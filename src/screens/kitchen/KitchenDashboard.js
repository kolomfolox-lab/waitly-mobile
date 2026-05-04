import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useKitchen } from '../../context/KitchenContext';
import KitchenOrderCard from '../../components/kitchen/KitchenOrderCard';
import KitchenScaffold from '../../components/kitchen/KitchenScaffold';
import { filterKitchenOrders } from '../../utils/kitchen';
import { getDeviceLayout, getGridItemWidth } from '../../utils/responsive';

const COLORS = {
    panel: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#f97316',
    accentSoft: '#fff7ed',
    live: '#10b981',
};

export default function KitchenDashboard({ navigation }) {
    const { user } = useAuth();
    const { width } = useWindowDimensions();
    const deviceLayout = useMemo(() => getDeviceLayout(width), [width]);
    const cardWidth = useMemo(
        () => getGridItemWidth(width, deviceLayout.columns, deviceLayout.gutter, 40),
        [width, deviceLayout.columns, deviceLayout.gutter]
    );
    const {
        activeOrders,
        connectionLabel,
        connectionMode,
        counts,
        currentTime,
        filters,
        kitchenModeLabel,
        loading,
        pendingActions,
        readOnly,
        refresh,
        refreshing,
        roleLabel,
        takeOrder,
        startOrder,
        readyOrder,
        unreadUpdatesCount,
        getErrorMessage,
    } = useKitchen();
    const [activeFilter, setActiveFilter] = useState('NEW');

    const filteredOrders = useMemo(
        () => filterKitchenOrders(activeOrders, activeFilter, user?.id, currentTime),
        [activeFilter, activeOrders, currentTime, user?.id]
    );

    const handleAction = async (runner, fallbackMessage) => {
        try {
            await runner();
        } catch (error) {
            const message = getErrorMessage(error, fallbackMessage);
            Alert.alert('Kitchen Action', message);
        }
    };

    const buildQuickActions = (order) => {
        const actions = [];
        const acceptPending = pendingActions[`order:${order.id}:accept`];
        const cookingPending = pendingActions[`order:${order.id}:cooking`];
        const readyPending = pendingActions[`order:${order.id}:ready`];

        if (order.status === 'CREATED' && !order.cook) {
            actions.push({
                key: 'take',
                label: 'Take',
                tone: 'primary',
                disabled: acceptPending || readOnly,
                onPress: () => handleAction(
                    () => takeOrder(order.id),
                    'Unable to take this order. Another cook may have already claimed it.'
                ),
            });
        }

        if (['CREATED', 'ACCEPTED'].includes(order.status) && (order.cook === user?.id || !order.cook)) {
            actions.push({
                key: 'start',
                label: 'Start',
                tone: actions.length === 0 ? 'primary' : 'secondary',
                disabled: cookingPending || readOnly,
                onPress: () => handleAction(
                    async () => {
                        if (!order.cook) {
                            await takeOrder(order.id);
                        }
                        await startOrder(order.id);
                    },
                    'Unable to move this order into cooking.'
                ),
            });
        }

        if (order.status === 'COOKING' && order.cook === user?.id) {
            actions.push({
                key: 'ready',
                label: 'Ready',
                tone: 'primary',
                disabled: readyPending || readOnly,
                onPress: () => handleAction(
                    () => readyOrder(order.id),
                    'Unable to mark this order ready.'
                ),
            });
        }

        if (actions.length === 0) {
            actions.push({
                key: 'view',
                label: 'Details',
                tone: 'secondary',
                onPress: () => navigation.navigate('KitchenOrderDetails', { orderId: order.id }),
            });
        }

        return actions;
    };

    const restaurantName = user?.restaurant_name || user?.restaurant?.name || 'Kitchen';

    return (
        <KitchenScaffold
            title="Kitchen Queue"
            subtitle={`${restaurantName} • ${roleLabel}`}
            readOnly={readOnly}
            headerRight={(
                <TouchableOpacity
                    style={styles.updatesButton}
                    onPress={() => navigation.navigate('KitchenUpdates')}
                >
                    <MaterialIcons name="notifications-none" size={20} color={COLORS.text} />
                    {unreadUpdatesCount > 0 ? (
                        <View style={styles.updatesBadge}>
                            <Text style={styles.updatesBadgeText}>{Math.min(unreadUpdatesCount, 9)}</Text>
                        </View>
                    ) : null}
                </TouchableOpacity>
            )}
        >
            <FlatList
                key={deviceLayout.columns}
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                numColumns={deviceLayout.columns}
                columnWrapperStyle={deviceLayout.columns > 1 ? { gap: deviceLayout.gutter } : undefined}
                refreshControl={(
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={COLORS.accent}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={(
                    <View>
                        <View style={styles.heroCard}>
                            <View>
                                <Text style={styles.heroLabel}>Kitchen Mode</Text>
                                <Text style={styles.heroValue}>{kitchenModeLabel}</Text>
                            </View>

                            <View style={styles.livePill}>
                                <View style={[
                                    styles.liveDot,
                                    { backgroundColor: connectionMode === 'live' ? COLORS.live : COLORS.accent },
                                ]}
                                />
                                <Text style={styles.liveText}>{connectionLabel}</Text>
                            </View>
                        </View>

                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={filters}
                            keyExtractor={(item) => item.key}
                            contentContainerStyle={styles.filtersRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.filterChip,
                                        activeFilter === item.key && styles.filterChipActive,
                                    ]}
                                    onPress={() => setActiveFilter(item.key)}
                                >
                                    <Text
                                        style={[
                                            styles.filterLabel,
                                            activeFilter === item.key && styles.filterLabelActive,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    <View
                                        style={[
                                            styles.filterCount,
                                            activeFilter === item.key && styles.filterCountActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.filterCountText,
                                                activeFilter === item.key && styles.filterCountTextActive,
                                            ]}
                                        >
                                            {counts[item.key] || 0}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />

                        <View style={styles.sectionRow}>
                            <Text style={styles.sectionTitle}>Live Queue</Text>
                            <TouchableOpacity
                                style={styles.sectionButton}
                                onPress={() => navigation.navigate('KitchenAvailability')}
                            >
                                <MaterialIcons name="restaurant-menu" size={16} color={COLORS.text} />
                                <Text style={styles.sectionButtonText}>Dish Availability</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                renderItem={({ item }) => (
                    <View style={[styles.orderGridItem, { width: cardWidth }]}>
                        <KitchenOrderCard
                            order={item}
                            currentTime={currentTime}
                            onPress={() => navigation.navigate('KitchenOrderDetails', { orderId: item.id })}
                            quickActions={buildQuickActions(item)}
                            disabled={loading}
                        />
                    </View>
                )}
                ListEmptyComponent={(
                    <View style={styles.emptyState}>
                        <MaterialIcons name="room-service" size={42} color={COLORS.muted} />
                        <Text style={styles.emptyTitle}>Queue is clear</Text>
                        <Text style={styles.emptyText}>
                            No orders match this filter right now.
                        </Text>
                    </View>
                )}
            />
        </KitchenScaffold>
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    orderGridItem: {
        marginBottom: 16,
    },
    heroCard: {
        backgroundColor: COLORS.panel,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroLabel: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    heroValue: {
        color: COLORS.text,
        fontSize: 21,
        fontWeight: '800',
        marginTop: 6,
    },
    livePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    liveDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    liveText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    filtersRow: {
        paddingVertical: 18,
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.panel,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    filterChipActive: {
        backgroundColor: COLORS.accentSoft,
        borderColor: COLORS.accent,
    },
    filterLabel: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '700',
    },
    filterLabelActive: {
        color: '#fff7ed',
    },
    filterCount: {
        marginLeft: 8,
        borderRadius: 999,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    filterCountActive: {
        backgroundColor: COLORS.accent,
    },
    filterCountText: {
        color: COLORS.text,
        fontSize: 11,
        fontWeight: '800',
    },
    filterCountTextActive: {
        color: '#ffffff',
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    sectionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.panel,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    sectionButtonText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '700',
    },
    updatesButton: {
        width: 48,
        height: 48,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    updatesBadge: {
        position: 'absolute',
        top: 7,
        right: 8,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    updatesBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
    },
    emptyState: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        backgroundColor: COLORS.panel,
    },
    emptyTitle: {
        marginTop: 14,
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '800',
    },
    emptyText: {
        marginTop: 8,
        color: COLORS.muted,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
});
