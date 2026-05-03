import React from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import KitchenOrderCard from '../../components/kitchen/KitchenOrderCard';
import KitchenScaffold from '../../components/kitchen/KitchenScaffold';
import { useKitchen } from '../../context/KitchenContext';

const COLORS = {
    text: '#0f172a',
    muted: '#64748b',
    panel: '#ffffff',
    border: '#e2e8f0',
    accent: '#f97316',
};

export default function AvailableOrdersScreen({ navigation }) {
    const {
        availableOrders,
        currentTime,
        pendingActions,
        readOnly,
        refresh,
        refreshing,
        takeOrder,
        getErrorMessage,
        kitchenModeLabel,
    } = useKitchen();

    const handleTakeOrder = async (orderId) => {
        try {
            await takeOrder(orderId);
        } catch (error) {
            Alert.alert(
                'Take Order',
                getErrorMessage(error, 'Another cook may have taken this order first.')
            );
        }
    };

    return (
        <KitchenScaffold
            title="Available"
            subtitle={kitchenModeLabel}
            readOnly={readOnly}
        >
            <FlatList
                data={availableOrders}
                keyExtractor={(item) => item.id}
                refreshControl={(
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={COLORS.accent}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={(
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Self-pick queue</Text>
                        <Text style={styles.summaryValue}>{availableOrders.length}</Text>
                        <Text style={styles.summaryText}>
                            One tap claims the order. If another cook gets there first, you will see immediate feedback.
                        </Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <KitchenOrderCard
                        order={item}
                        currentTime={currentTime}
                        onPress={() => navigation.navigate('KitchenOrderDetails', { orderId: item.id })}
                        quickActions={[
                            {
                                key: 'take',
                                label: 'Take Order',
                                tone: 'primary',
                                disabled: pendingActions[`order:${item.id}:accept`] || readOnly,
                                onPress: () => handleTakeOrder(item.id),
                            },
                        ]}
                    />
                )}
                ListEmptyComponent={(
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="done-all" size={42} color={COLORS.muted} />
                        <Text style={styles.emptyTitle}>No unclaimed orders</Text>
                        <Text style={styles.emptyText}>
                            When self-pick is active, new unassigned tickets will appear here.
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
    summaryCard: {
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
    },
    summaryLabel: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    summaryValue: {
        color: COLORS.text,
        fontSize: 34,
        fontWeight: '800',
        marginTop: 6,
    },
    summaryText: {
        marginTop: 8,
        color: COLORS.muted,
        fontSize: 13,
        lineHeight: 19,
    },
    emptyCard: {
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 24,
        padding: 26,
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: 12,
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
