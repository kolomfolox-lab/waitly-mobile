import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useKitchen } from '../../context/KitchenContext';
import KitchenScaffold from '../../components/kitchen/KitchenScaffold';
import {
    formatKitchenTime,
    formatMinutes,
    getElapsedMinutes,
    getOrderEtaMinutes,
    getOrderNotes,
    getOrderShortCode,
    getOrderTableLabel,
} from '../../utils/kitchen';

const COLORS = {
    text: '#0f172a',
    muted: '#64748b',
    panel: '#ffffff',
    border: '#e2e8f0',
    accent: '#f97316',
    success: '#10b981',
    danger: '#ef4444',
};

export default function KitchenOrderDetailsScreen({ navigation, route }) {
    const { user } = useAuth();
    const {
        activeOrders,
        currentTime,
        detailsCache,
        getErrorMessage,
        getOrderDetails,
        pendingActions,
        readOnly,
        roleLabel,
        teamMembers,
        takeOrder,
        startOrder,
        readyOrder,
        assignOrder,
        cancelKitchenOrder,
    } = useKitchen();
    const { orderId } = route.params;
    const [loading, setLoading] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const order = detailsCache[orderId] || activeOrders.find((item) => item.id === orderId);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (order) {
                return;
            }

            setLoading(true);
            try {
                await getOrderDetails(orderId);
            } catch (error) {
                if (mounted) {
                    Alert.alert('Order Details', getErrorMessage(error, 'Unable to load this order.'));
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [getErrorMessage, getOrderDetails, order, orderId]);

    const headerSubtitle = useMemo(() => {
        if (!order) {
            return roleLabel;
        }
        return `Table ${getOrderTableLabel(order)} • ${order.status}`;
    }, [order, roleLabel]);

    const actionDisabled = (key) => readOnly || pendingActions[key];

    const handleAction = async (runner, fallback) => {
        try {
            await runner();
            await getOrderDetails(orderId);
        } catch (error) {
            Alert.alert('Kitchen Action', getErrorMessage(error, fallback));
        }
    };

    if (loading || !order) {
        return (
            <KitchenScaffold
                title="Order Details"
                subtitle={headerSubtitle}
                readOnly={readOnly}
                onBack={navigation.goBack}
            >
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            </KitchenScaffold>
        );
    }

    const elapsedMinutes = getElapsedMinutes(order, currentTime);
    const etaMinutes = getOrderEtaMinutes(order);
    const canAssign = user?.role === 'CHEF' && teamMembers.length > 0;
    const canCancel = ['CREATED', 'ACCEPTED'].includes(order.status);
    const notes = getOrderNotes(order);

    return (
        <KitchenScaffold
            title={`#${getOrderShortCode(order)}`}
            subtitle={headerSubtitle}
            readOnly={readOnly}
            onBack={navigation.goBack}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <Text style={styles.heroMeta}>Created {formatKitchenTime(order.created_at)}</Text>
                    <View style={styles.heroStats}>
                        <Stat label="Elapsed" value={formatMinutes(elapsedMinutes)} />
                        <Stat label="ETA" value={formatMinutes(etaMinutes)} />
                        <Stat label="Dishes" value={String(order.items?.length || 0)} />
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>Waiter: {order.waiter_name || 'Unknown'}</Text>
                        <Text style={styles.metaText}>Role: {roleLabel}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>Cook: {order.cook_name || order.cook || 'Unassigned'}</Text>
                        <Text style={styles.metaText}>Session: {order.table_session_id || 'N/A'}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Actions</Text>
                <View style={styles.actionGrid}>
                    <ActionButton
                        label="Accept"
                        icon="assignment-turned-in"
                        disabled={order.status !== 'CREATED' || actionDisabled(`order:${order.id}:accept`)}
                        onPress={() => handleAction(
                            () => takeOrder(order.id),
                            'Unable to accept this order.'
                        )}
                    />
                    <ActionButton
                        label="Start"
                        icon="outdoor-grill"
                        disabled={!['CREATED', 'ACCEPTED'].includes(order.status) || actionDisabled(`order:${order.id}:cooking`)}
                        onPress={() => handleAction(
                            async () => {
                                if (!order.cook) {
                                    await takeOrder(order.id);
                                }
                                await startOrder(order.id);
                            },
                            'Unable to start this order.'
                        )}
                    />
                    <ActionButton
                        label="Ready"
                        icon="task-alt"
                        disabled={order.status !== 'COOKING' || actionDisabled(`order:${order.id}:ready`)}
                        onPress={() => handleAction(
                            () => readyOrder(order.id),
                            'Unable to mark this order ready.'
                        )}
                    />
                    <ActionButton
                        label="Delay"
                        icon="schedule"
                        disabled={readOnly}
                        onPress={() => navigation.navigate('KitchenDelayAction', { orderId: order.id })}
                    />
                    <ActionButton
                        label="Dish Issue"
                        icon="block"
                        disabled={readOnly}
                        onPress={() => navigation.navigate('KitchenAvailability', {
                            dishIds: (order.items || []).map((item) => item.dish),
                        })}
                    />
                    <ActionButton
                        label="Updates"
                        icon="notifications-active"
                        onPress={() => navigation.navigate('KitchenUpdates')}
                    />
                </View>

                {canAssign ? (
                    <>
                        <Text style={styles.sectionTitle}>Reassign</Text>
                        <View style={styles.assignWrap}>
                            {teamMembers.map((member) => {
                                const active = member.id === order.cook;
                                return (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={[styles.memberChip, active && styles.memberChipActive]}
                                        disabled={readOnly || actionDisabled(`order:${order.id}:assign`)}
                                        onPress={() => handleAction(
                                            () => assignOrder(order.id, member.id),
                                            'Unable to reassign this order.'
                                        )}
                                    >
                                        <Text style={[styles.memberName, active && styles.memberNameActive]}>
                                            {member.full_name || member.phone_number || member.id}
                                        </Text>
                                        <Text style={[styles.memberRole, active && styles.memberRoleActive]}>
                                            {member.role}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                ) : null}

                <Text style={styles.sectionTitle}>Items</Text>
                {(order.items || []).map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemName}>{item.quantity} x {item.dish_name}</Text>
                            <Text style={styles.itemPrice}>{item.price || ''}</Text>
                        </View>
                        {item.notes ? (
                            <Text style={styles.itemNotes}>{item.notes}</Text>
                        ) : null}
                    </View>
                ))}

                {notes.length > 0 ? (
                    <>
                        <Text style={styles.sectionTitle}>Kitchen Notes</Text>
                        <View style={styles.notesCard}>
                            {notes.map((note) => (
                                <View key={note} style={styles.noteChip}>
                                    <Text style={styles.noteText}>{note}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                ) : null}

                {(order.extra_time || order.delay_message) ? (
                    <>
                        <Text style={styles.sectionTitle}>Delay Info</Text>
                        <View style={styles.delayCard}>
                            <Text style={styles.delayLabel}>Added Time</Text>
                            <Text style={styles.delayValue}>+{formatMinutes(Number(order.extra_time || 0))}</Text>
                            {order.delay_message ? (
                                <Text style={styles.delayMessage}>{order.delay_message}</Text>
                            ) : null}
                        </View>
                    </>
                ) : null}

                {canCancel ? (
                    <>
                        <Text style={styles.sectionTitle}>Cancel If Backend Allows</Text>
                        <View style={styles.cancelCard}>
                            <Text style={styles.cancelText}>
                                Cancellation stays restricted to early order states and still depends on backend permission.
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={cancelReason}
                                onChangeText={setCancelReason}
                                placeholder="Optional cancellation note"
                                placeholderTextColor={COLORS.muted}
                            />
                            <TouchableOpacity
                                style={[styles.cancelButton, readOnly && styles.disabledButton]}
                                disabled={readOnly || actionDisabled(`order:${order.id}:cancel`)}
                                onPress={() => handleAction(
                                    () => cancelKitchenOrder(order.id, cancelReason ? { reason: cancelReason } : {}),
                                    'Unable to cancel this order.'
                                )}
                            >
                                <MaterialIcons name="cancel" size={18} color="#fff1f2" />
                                <Text style={styles.cancelButtonText}>Cancel Order</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : null}
            </ScrollView>
        </KitchenScaffold>
    );
}

function Stat({ label, value }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function ActionButton({ label, icon, onPress, disabled = false }) {
    return (
        <TouchableOpacity
            style={[styles.actionCard, disabled && styles.disabledButton]}
            onPress={onPress}
            disabled={disabled}
        >
            <MaterialIcons name={icon} size={20} color={disabled ? COLORS.muted : COLORS.accent} />
            <Text style={[styles.actionLabel, disabled && styles.disabledText]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCard: {
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 28,
        padding: 18,
    },
    heroMeta: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    heroStats: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        paddingHorizontal: 10,
    },
    statValue: {
        color: '#0f172a',
        fontSize: 17,
        fontWeight: '800',
    },
    statLabel: {
        color: COLORS.muted,
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 14,
    },
    metaText: {
        flex: 1,
        color: '#475569',
        fontSize: 13,
        fontWeight: '600',
    },
    sectionTitle: {
        marginTop: 24,
        marginBottom: 12,
        color: COLORS.text,
        fontSize: 19,
        fontWeight: '800',
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '31%',
        minWidth: 100,
        borderRadius: 20,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 18,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        marginTop: 10,
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.45,
    },
    disabledText: {
        color: COLORS.muted,
    },
    assignWrap: {
        gap: 10,
    },
    memberChip: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.panel,
        padding: 14,
    },
    memberChipActive: {
        borderColor: COLORS.accent,
        backgroundColor: '#fff7ed',
    },
    memberName: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
    },
    memberNameActive: {
        color: '#9a3412',
    },
    memberRole: {
        marginTop: 4,
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
    },
    memberRoleActive: {
        color: '#c2410c',
    },
    itemCard: {
        borderRadius: 22,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 10,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    itemName: {
        flex: 1,
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '700',
    },
    itemPrice: {
        color: COLORS.muted,
        fontSize: 13,
        fontWeight: '700',
    },
    itemNotes: {
        marginTop: 8,
        color: '#475569',
        fontSize: 13,
        lineHeight: 19,
    },
    notesCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    noteChip: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    noteText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '700',
    },
    delayCard: {
        borderRadius: 22,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
    },
    delayLabel: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    delayValue: {
        marginTop: 8,
        color: COLORS.success,
        fontSize: 22,
        fontWeight: '800',
    },
    delayMessage: {
        marginTop: 12,
        color: '#475569',
        fontSize: 13,
        lineHeight: 19,
    },
    cancelCard: {
        borderRadius: 22,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 18,
    },
    cancelText: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 19,
    },
    input: {
        marginTop: 14,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
    },
    cancelButton: {
        marginTop: 14,
        borderRadius: 16,
        backgroundColor: COLORS.danger,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    cancelButtonText: {
        color: '#fff1f2',
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});
