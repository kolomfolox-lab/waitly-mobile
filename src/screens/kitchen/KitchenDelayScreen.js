import React, { useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import KitchenScaffold from '../../components/kitchen/KitchenScaffold';
import { useKitchen } from '../../context/KitchenContext';
import { formatMinutes, getOrderEtaMinutes } from '../../utils/kitchen';

const PRESETS = [5, 10, 15];
const REASONS = [
    'High kitchen load',
    'Missing prep',
    'Ingredient issue',
    'Complex dish',
];

const COLORS = {
    text: '#0f172a',
    muted: '#64748b',
    panel: '#ffffff',
    border: '#e2e8f0',
    accent: '#f97316',
};

export default function KitchenDelayScreen({ navigation, route }) {
    const { orderId } = route.params;
    const {
        activeOrders,
        detailsCache,
        delayOrder,
        getErrorMessage,
        pendingActions,
        readOnly,
    } = useKitchen();
    const [selectedMinutes, setSelectedMinutes] = useState(10);
    const [customMinutes, setCustomMinutes] = useState('');
    const [selectedReason, setSelectedReason] = useState(REASONS[0]);
    const [customReason, setCustomReason] = useState('');

    const order = detailsCache[orderId] || activeOrders.find((item) => item.id === orderId);

    const nextEta = useMemo(() => {
        const delayValue = customMinutes ? Number(customMinutes) : selectedMinutes;
        return getOrderEtaMinutes(order) + (Number.isNaN(delayValue) ? 0 : delayValue);
    }, [customMinutes, order, selectedMinutes]);

    const submitDelay = async () => {
        const minutes = customMinutes ? Number(customMinutes) : selectedMinutes;
        const reason = customReason.trim() || selectedReason;

        if (!minutes || Number.isNaN(minutes) || minutes < 1) {
            Alert.alert('Delay', 'Enter a valid delay in minutes.');
            return;
        }

        try {
            const response = await delayOrder(orderId, {
                extra_time: minutes,
                reason,
            });

            const message = response?.delay_message
                ? `${response.delay_message}\n\nUpdated ETA: ${formatMinutes(nextEta)}`
                : `Updated ETA: ${formatMinutes(nextEta)}`;

            Alert.alert('Delay Added', message, [
                {
                    text: 'Done',
                    onPress: navigation.goBack,
                },
            ]);
        } catch (error) {
            Alert.alert('Delay', getErrorMessage(error, 'Unable to add delay.'));
        }
    };

    return (
        <KitchenScaffold
            title="Add Delay"
            subtitle={`Order ${orderId}`}
            readOnly={readOnly}
            onBack={navigation.goBack}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Minutes</Text>
                <View style={styles.rowWrap}>
                    {PRESETS.map((preset) => (
                        <TouchableOpacity
                            key={preset}
                            style={[styles.choiceChip, selectedMinutes === preset && !customMinutes && styles.choiceChipActive]}
                            onPress={() => {
                                setCustomMinutes('');
                                setSelectedMinutes(preset);
                            }}
                        >
                            <Text style={[styles.choiceText, selectedMinutes === preset && !customMinutes && styles.choiceTextActive]}>
                                +{preset} min
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder="Custom minutes"
                    placeholderTextColor={COLORS.muted}
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                />

                <Text style={styles.sectionTitle}>Reason</Text>
                <View style={styles.rowWrap}>
                    {REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason}
                            style={[styles.choiceChip, selectedReason === reason && !customReason && styles.choiceChipActive]}
                            onPress={() => {
                                setCustomReason('');
                                setSelectedReason(reason);
                            }}
                        >
                            <Text style={[styles.choiceText, selectedReason === reason && !customReason && styles.choiceTextActive]}>
                                {reason}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    multiline
                    numberOfLines={4}
                    placeholder="Custom reason"
                    placeholderTextColor={COLORS.muted}
                    value={customReason}
                    onChangeText={setCustomReason}
                />

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Current ETA</Text>
                    <Text style={styles.summaryValue}>{formatMinutes(getOrderEtaMinutes(order))}</Text>
                    <Text style={styles.summaryLabel}>After delay</Text>
                    <Text style={styles.summaryValue}>{formatMinutes(nextEta)}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, (readOnly || pendingActions[`order:${orderId}:delay`]) && styles.disabledButton]}
                    disabled={readOnly || pendingActions[`order:${orderId}:delay`]}
                    onPress={submitDelay}
                >
                    <Text style={styles.submitText}>Add Delay</Text>
                </TouchableOpacity>
            </ScrollView>
        </KitchenScaffold>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        marginBottom: 12,
        color: COLORS.text,
        fontSize: 19,
        fontWeight: '800',
    },
    rowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    choiceChip: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.panel,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    choiceChipActive: {
        borderColor: COLORS.accent,
        backgroundColor: '#fff7ed',
    },
    choiceText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '700',
    },
    choiceTextActive: {
        color: '#9a3412',
    },
    input: {
        marginBottom: 20,
        borderRadius: 18,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 14,
    },
    multilineInput: {
        minHeight: 110,
        textAlignVertical: 'top',
    },
    summaryCard: {
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.panel,
        padding: 18,
        marginBottom: 20,
    },
    summaryLabel: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    summaryValue: {
        marginTop: 6,
        marginBottom: 14,
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '800',
    },
    submitButton: {
        borderRadius: 18,
        backgroundColor: COLORS.accent,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.45,
    },
    submitText: {
        color: '#fff7ed',
        fontSize: 15,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});
