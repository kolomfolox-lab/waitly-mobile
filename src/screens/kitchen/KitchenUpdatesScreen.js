import React from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import KitchenScaffold from '../../components/kitchen/KitchenScaffold';
import { useKitchen } from '../../context/KitchenContext';
import { formatKitchenTime } from '../../utils/kitchen';

const COLORS = {
    text: '#0f172a',
    muted: '#64748b',
    panel: '#ffffff',
    border: '#e2e8f0',
    accent: '#f97316',
};

const ICONS = {
    'order.created': 'playlist-add-circle',
    'order.updated': 'sync',
    'order.ready': 'task-alt',
    'order.delay_added': 'schedule',
    'order.closed': 'inventory-2',
    'kitchen.event': 'notifications-active',
};

export default function KitchenUpdatesScreen({ navigation }) {
    const kitchen = useKitchen();

    useFocusEffect(
        React.useCallback(() => {
            if (kitchen?.markUpdatesViewed) {
                kitchen.markUpdatesViewed();
            }
        }, [kitchen])
    );

    if (!kitchen) {
        return (
            <KitchenScaffold
                title="Kitchen Updates"
                subtitle="Unavailable"
                onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
            >
                <View style={styles.emptyCard}>
                    <MaterialIcons name="info-outline" size={42} color={COLORS.muted} />
                    <Text style={styles.emptyTitle}>Kitchen feed unavailable</Text>
                    <Text style={styles.emptyText}>
                        Kitchen updates are only available inside the kitchen workspace.
                    </Text>
                </View>
            </KitchenScaffold>
        );
    }

    const {
        events,
        readOnly,
        refresh,
        refreshing,
        connectionLabel,
    } = kitchen;

    return (
        <KitchenScaffold
            title="Kitchen Updates"
            subtitle={connectionLabel}
            readOnly={readOnly}
            onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        >
            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                refreshControl={(
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={COLORS.accent}
                    />
                )}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.eventCard}>
                        <View style={styles.eventIcon}>
                            <MaterialIcons name={ICONS[item.type] || 'notifications-none'} size={20} color={COLORS.accent} />
                        </View>
                        <View style={styles.eventBody}>
                            <View style={styles.eventHeader}>
                                <Text style={styles.eventTitle}>{item.title}</Text>
                                {item.createdAt ? (
                                    <Text style={styles.eventTime}>{formatKitchenTime(item.createdAt)}</Text>
                                ) : null}
                            </View>
                            <Text style={styles.eventText}>{item.message}</Text>
                            {item.orderId ? (
                                <Text style={styles.eventMeta}>Order: {item.orderId}</Text>
                            ) : null}
                        </View>
                    </View>
                )}
                ListEmptyComponent={(
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="wifi-tethering" size={42} color={COLORS.muted} />
                        <Text style={styles.emptyTitle}>Waiting for updates</Text>
                        <Text style={styles.emptyText}>
                            Queue changes from polling or websocket delivery will appear here.
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
    eventCard: {
        flexDirection: 'row',
        gap: 14,
        backgroundColor: COLORS.panel,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 12,
    },
    eventIcon: {
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventBody: {
        flex: 1,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
    },
    eventTitle: {
        flex: 1,
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '800',
    },
    eventTime: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
    },
    eventText: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 6,
    },
    eventMeta: {
        marginTop: 10,
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
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
