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

export default function AssignedOrdersScreen({ navigation }) {
    const {
        assignedOrders,
        currentTime,
        pendingActions,
        readOnly,
        refresh,
        refreshing,
        startOrder,
        readyOrder,
        getErrorMessage,
    } = useKitchen();

    const handleAction = async (runner, fallback) => {
        try {
            await runner();
        } catch (error) {
            Alert.alert('Kitchen Action', getErrorMessage(error, fallback));
        }
    };

    return (
        <KitchenScaffold
            title="Assigned"
            subtitle="Your current workload"
            readOnly={readOnly}
        >
            <FlatList
                data={assignedOrders}
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
                        <Text style={styles.summaryLabel}>Orders on your station</Text>
                        <Text style={styles.summaryValue}>{assignedOrders.length}</Text>
                        <Text style={styles.summaryText}>
                            Sorted by urgency and oldest first for fast scanning.
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
                                key: 'start',
                                label: 'Start',
                                tone: 'secondary',
                                disabled: !['CREATED', 'ACCEPTED'].includes(item.status) || pendingActions[`order:${item.id}:cooking`] || readOnly,
                                onPress: () => handleAction(
                                    () => startOrder(item.id),
                                    'Unable to start cooking for this order.'
                                ),
                            },
                            {
                                key: 'delay',
                                label: 'Delay',
                                tone: 'secondary',
                                disabled: pendingActions[`order:${item.id}:delay`] || readOnly,
                                onPress: () => navigation.navigate('KitchenDelayAction', { orderId: item.id }),
                            },
                            {
                                key: 'ready',
                                label: 'Ready',
                                tone: 'primary',
                                disabled: item.status !== 'COOKING' || pendingActions[`order:${item.id}:ready`] || readOnly,
                                onPress: () => handleAction(
                                    () => readyOrder(item.id),
                                    'Unable to mark this order ready.'
                                ),
                            },
                        ]}
                    />
                )}
                ListEmptyComponent={(
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="outdoor-grill" size={42} color={COLORS.muted} />
                        <Text style={styles.emptyTitle}>Nothing assigned</Text>
                        <Text style={styles.emptyText}>
                            Orders you claim or receive from a chef will show up here.
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
