import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import KitchenScaffold from '../../components/kitchen/KitchenScaffold';
import { useAuth } from '../../context/AuthContext';
import { useKitchen } from '../../context/KitchenContext';

const REASONS = [
    'Ingredient issue',
    'Out of stock',
    'Prep issue',
    'Equipment problem',
];

const COLORS = {
    text: '#0f172a',
    muted: '#64748b',
    panel: '#ffffff',
    border: '#e2e8f0',
    accent: '#f97316',
    danger: '#ef4444',
    success: '#10b981',
};

export default function KitchenAvailabilityScreen({ navigation, route }) {
    const { user } = useAuth();
    const {
        dishes,
        pendingActions,
        readOnly,
        setDishAvailability,
        getErrorMessage,
    } = useKitchen();
    const [selectedReason, setSelectedReason] = useState(REASONS[0]);
    const [customReason, setCustomReason] = useState('');

    const highlightedIds = route.params?.dishIds || [];
    const isChef = user?.role === 'CHEF';
    const reason = customReason.trim() || selectedReason;

    const visibleDishes = useMemo(() => {
        const priority = new Set(highlightedIds);
        return [...dishes].sort((left, right) => {
            const leftScore = priority.has(left.id) ? 0 : 1;
            const rightScore = priority.has(right.id) ? 0 : 1;
            if (leftScore !== rightScore) return leftScore - rightScore;
            return String(left.name || '').localeCompare(String(right.name || ''));
        });
    }, [dishes, highlightedIds]);

    const handleUpdate = async (dish, nextAvailable) => {
        try {
            await setDishAvailability(dish.id, {
                is_available: nextAvailable,
                unavailable_reason: nextAvailable ? '' : reason,
            });

            Alert.alert(
                'Dish Availability',
                nextAvailable
                    ? `${dish.name} is available again.`
                    : `${dish.name} has been marked unavailable.`
            );
        } catch (error) {
            Alert.alert(
                'Dish Availability',
                getErrorMessage(
                    error,
                    isChef
                        ? 'Unable to update this dish right now.'
                        : 'You may need chef permission to mark this dish unavailable.'
                )
            );
        }
    };

    return (
        <KitchenScaffold
            title="Dish Availability"
            subtitle={isChef ? 'Chef control' : 'Ingredient issue reporting'}
            readOnly={readOnly}
            onBack={navigation.goBack}
        >
            <FlatList
                data={visibleDishes}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={(
                    <View>
                        <Text style={styles.sectionTitle}>Причина</Text>
                        <View style={styles.reasonRow}>
                            {REASONS.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.reasonChip, selectedReason === item && !customReason && styles.reasonChipActive]}
                                    onPress={() => {
                                        setCustomReason('');
                                        setSelectedReason(item);
                                    }}
                                >
                                    <Text style={[styles.reasonText, selectedReason === item && !customReason && styles.reasonTextActive]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.input}
                            value={customReason}
                            onChangeText={setCustomReason}
                            placeholder="Комментарий к блюду"
                            placeholderTextColor={COLORS.muted}
                        />
                    </View>
                )}
                renderItem={({ item }) => {
                    const isAvailable = item.is_available !== false;
                    const pending = pendingActions[`dish:${item.id}:availability`];

                    return (
                        <View style={styles.dishCard}>
                            <View style={styles.dishHeader}>
                                <View style={styles.dishMeta}>
                                    <Text style={styles.dishName}>{item.name}</Text>
                                    <Text style={styles.dishCategory}>{item.category_name || 'Menu item'}</Text>
                                </View>

                                <View style={[
                                    styles.statusPill,
                                    { backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)' },
                                ]}
                                >
                                    <Text style={[
                                        styles.statusText,
                                        { color: isAvailable ? COLORS.success : COLORS.danger },
                                    ]}
                                    >
                                        {isAvailable ? 'AVAILABLE' : 'BLOCKED'}
                                    </Text>
                                </View>
                            </View>

                            {item.unavailable_reason ? (
                                <Text style={styles.reasonInfo}>Reason: {item.unavailable_reason}</Text>
                            ) : null}

                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        (!isAvailable || readOnly || pending) && styles.disabledButton,
                                    ]}
                                    disabled={!isAvailable || readOnly || pending}
                                    onPress={() => handleUpdate(item, false)}
                                >
                                    <MaterialIcons name="block" size={18} color="#fff7ed" />
                                    <Text style={styles.primaryButtonText}>
                                        {isChef ? 'Mark Unavailable' : 'Report Issue'}
                                    </Text>
                                </TouchableOpacity>

                                {isChef ? (
                                    <TouchableOpacity
                                        style={[
                                            styles.secondaryButton,
                                            (isAvailable || readOnly || pending) && styles.disabledButton,
                                        ]}
                                        disabled={isAvailable || readOnly || pending}
                                        onPress={() => handleUpdate(item, true)}
                                    >
                                        <MaterialIcons name="restart-alt" size={18} color={COLORS.text} />
                                        <Text style={styles.secondaryButtonText}>Restore</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.secondaryHint}>
                                        <Text style={styles.secondaryHintText}>Chef can reopen blocked dishes.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                }}
            />
        </KitchenScaffold>
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        marginBottom: 12,
        color: COLORS.text,
        fontSize: 19,
        fontWeight: '800',
    },
    reasonRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    reasonChip: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.panel,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    reasonChipActive: {
        borderColor: COLORS.accent,
        backgroundColor: '#fff7ed',
    },
    reasonText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '700',
    },
    reasonTextActive: {
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
    dishCard: {
        borderRadius: 24,
        backgroundColor: COLORS.panel,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 12,
    },
    dishHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    dishMeta: {
        flex: 1,
    },
    dishName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '800',
    },
    dishCategory: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    reasonInfo: {
        marginTop: 12,
        color: '#cbd5e1',
        fontSize: 13,
        lineHeight: 19,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
        alignItems: 'center',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flex: 1,
        borderRadius: 16,
        backgroundColor: COLORS.accent,
        paddingVertical: 14,
    },
    primaryButtonText: {
        color: '#fff7ed',
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    secondaryButtonText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    secondaryHint: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    secondaryHintText: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.45,
    },
});
