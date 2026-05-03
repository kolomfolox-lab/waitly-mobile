import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
    formatKitchenTime,
    formatMinutes,
    getDelayMinutes,
    getElapsedMinutes,
    getOrderDishCount,
    getOrderEtaMinutes,
    getOrderNotes,
    getOrderShortCode,
    getOrderTableLabel,
    getUrgencyLevel,
} from '../../utils/kitchen';

const URGENCY_STYLES = {
    critical: { border: '#fb7185', badge: '#fb7185', label: 'Late' },
    high: { border: '#f97316', badge: '#f97316', label: 'Hot' },
    watch: { border: '#facc15', badge: '#facc15', label: 'Watch' },
    normal: { border: '#cbd5e1', badge: '#cbd5e1', label: 'Normal' },
    ready: { border: '#10b981', badge: '#10b981', label: 'Ready' },
};

const STATUS_COLORS = {
    CREATED: '#38bdf8',
    ACCEPTED: '#f59e0b',
    COOKING: '#f97316',
    READY: '#10b981',
    DELIVERED: '#64748b',
    CLOSED: '#64748b',
    CANCELLED: '#ef4444',
};

export default function KitchenOrderCard({
    order,
    currentTime,
    onPress,
    quickActions = [],
    disabled = false,
}) {
    const urgency = getUrgencyLevel(order, currentTime);
    const urgencyStyle = URGENCY_STYLES[urgency] || URGENCY_STYLES.normal;
    const notes = getOrderNotes(order).slice(0, 3);
    const elapsed = getElapsedMinutes(order, currentTime);
    const eta = getOrderEtaMinutes(order);
    const delay = getDelayMinutes(order);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.card, { borderColor: urgencyStyle.border }, disabled && styles.disabledCard]}
            onPress={onPress}
        >
            <View style={styles.topRow}>
                <View>
                    <Text style={styles.orderCode}>#{getOrderShortCode(order)}</Text>
                    <Text style={styles.tableLabel}>Table {getOrderTableLabel(order)}</Text>
                </View>

                <View style={styles.rightMeta}>
                    <View style={[styles.urgencyBadge, { backgroundColor: urgencyStyle.badge }]}>
                        <Text style={styles.urgencyText}>{urgencyStyle.label}</Text>
                    </View>
                    <Text style={styles.createdAt}>{formatKitchenTime(order?.created_at)}</Text>
                </View>
            </View>

            <View style={styles.metricsRow}>
                <Metric label="Elapsed" value={formatMinutes(elapsed)} icon="timer" />
                <Metric label="ETA" value={formatMinutes(eta)} icon="schedule" />
                <Metric label="Dishes" value={String(getOrderDishCount(order))} icon="restaurant" />
            </View>

            <View style={styles.detailRow}>
                <Text style={styles.detailText}>Waiter: {order?.waiter_name || 'Unknown'}</Text>
                <Text style={[styles.statusText, { color: STATUS_COLORS[order?.status] || '#e2e8f0' }]}>
                    {order?.status || 'Unknown'}
                </Text>
            </View>

            {delay > 0 ? (
                <View style={styles.delayRow}>
                    <MaterialIcons name="warning-amber" size={16} color="#fbbf24" />
                    <Text style={styles.delayText}>Delay +{formatMinutes(delay)}</Text>
                </View>
            ) : null}

            {notes.length > 0 ? (
                <View style={styles.notesWrap}>
                    {notes.map((note) => (
                        <View key={note} style={styles.noteChip}>
                            <Text style={styles.noteText}>{note}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {order?.cook_name || order?.cook ? (
                <Text style={styles.assignmentText}>
                    Assigned to: {order?.cook_name || 'Kitchen staff'}
                </Text>
            ) : null}

            {quickActions.length > 0 ? (
                <View style={styles.actionsRow}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.key}
                            style={[
                                styles.actionButton,
                                action.tone === 'primary' ? styles.primaryAction : styles.secondaryAction,
                                (action.disabled || disabled) && styles.disabledAction,
                            ]}
                            disabled={action.disabled || disabled}
                            onPress={action.onPress}
                        >
                            <Text
                                style={[
                                    styles.actionText,
                                    action.tone === 'primary' ? styles.primaryActionText : styles.secondaryActionText,
                                ]}
                            >
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : null}
        </TouchableOpacity>
    );
}

function Metric({ icon, label, value }) {
    return (
        <View style={styles.metricCard}>
            <MaterialIcons name={icon} size={16} color="#f97316" />
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        borderWidth: 1,
        padding: 18,
        marginBottom: 14,
    },
    disabledCard: {
        opacity: 0.78,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderCode: {
        color: '#0f172a',
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    tableLabel: {
        marginTop: 6,
        color: '#64748b',
        fontSize: 13,
        fontWeight: '600',
    },
    rightMeta: {
        alignItems: 'flex-end',
    },
    urgencyBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    urgencyText: {
        color: '#020617',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    createdAt: {
        marginTop: 8,
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
    metricsRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 10,
    },
    metricCard: {
        flex: 1,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#f8fafc',
    },
    metricValue: {
        color: '#0f172a',
        fontSize: 16,
        fontWeight: '800',
        marginTop: 8,
    },
    metricLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 3,
        textTransform: 'uppercase',
    },
    detailRow: {
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    detailText: {
        flex: 1,
        color: '#475569',
        fontSize: 13,
        fontWeight: '600',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    delayRow: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    delayText: {
        marginLeft: 6,
        color: '#fbbf24',
        fontSize: 13,
        fontWeight: '700',
    },
    notesWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 14,
    },
    noteChip: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#eff6ff',
    },
    noteText: {
        color: '#1d4ed8',
        fontSize: 12,
        fontWeight: '700',
    },
    assignmentText: {
        marginTop: 14,
        color: '#64748b',
        fontSize: 12,
        fontWeight: '700',
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 16,
    },
    actionButton: {
        minHeight: 44,
        borderRadius: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryAction: {
        backgroundColor: '#f97316',
    },
    secondaryAction: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    disabledAction: {
        opacity: 0.45,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    primaryActionText: {
        color: '#fff7ed',
    },
    secondaryActionText: {
        color: '#0f172a',
    },
});
