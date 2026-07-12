import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../api/apiClient';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    success: '#52D681',
    slate100: '#f1f5f9',
    warning: '#F7B731',
};

export default function WaiterTipsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tipStats, setTipStats] = useState(null);
    const [goal, setGoal] = useState(null);
    const [goalName, setGoalName] = useState('');
    const [goalTarget, setGoalTarget] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, goalRes] = await Promise.all([
                apiClient.get('/api/v1/mobile/tips/stats/'),
                apiClient.get('/api/v1/mobile/tips/goal/'),
            ]);
            setTipStats(statsRes.data);
            const g = goalRes.data?.goal;
            setGoal(g);
            if (g) {
                setGoalName(g.name);
                setGoalTarget(g.target_amount);
            }
        } catch (e) {
            console.log('Failed to load tips:', e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    const saveGoal = async () => {
        if (!goalName.trim()) {
            Alert.alert('Ошибка', 'Введите название цели');
            return;
        }
        if (!goalTarget || parseFloat(goalTarget) <= 0) {
            Alert.alert('Ошибка', 'Введите сумму цели');
            return;
        }

        setSaving(true);
        try {
            const res = await apiClient.put('/api/v1/mobile/tips/goal/', {
                name: goalName.trim(),
                target_amount: parseFloat(goalTarget),
            });
            setGoal(res.data.goal);
            Alert.alert('Готово', 'Цель сохранена');
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось сохранить цель');
        } finally {
            setSaving(false);
        }
    };

    const progressPct = goal && parseFloat(goal.target_amount) > 0
        ? Math.min(100, Math.round((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100))
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Чаевые и цели</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{tipStats ? formatCurrency(tipStats.today) : '0 сум'}</Text>
                            <Text style={styles.statLabel}>Сегодня</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{tipStats ? formatCurrency(tipStats.total) : '0 сум'}</Text>
                            <Text style={styles.statLabel}>Всего</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{tipStats ? tipStats.count : '0'}</Text>
                            <Text style={styles.statLabel}>Чаевых</Text>
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Моя цель</Text>

                        {goal && (
                            <View style={styles.goalProgress}>
                                <View style={styles.goalProgressBar}>
                                    <View style={[styles.goalProgressFill, { width: `${progressPct}%` }]} />
                                </View>
                                <Text style={styles.goalProgressText}>
                                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)} ({progressPct}%)
                                </Text>
                            </View>
                        )}

                        <View style={styles.goalForm}>
                            <TextInput
                                style={styles.input}
                                placeholder="Название цели"
                                placeholderTextColor={COLORS.textMuted}
                                value={goalName}
                                onChangeText={setGoalName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Сумма (сум)"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric"
                                value={goalTarget}
                                onChangeText={setGoalTarget}
                            />
                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={saveGoal}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Сохранение...' : (goal ? 'Обновить' : 'Создать')}</Text>
                            </TouchableOpacity>
                        </View>

                        {goal && (
                            <Text style={styles.goalHint}>
                                Гости видят вашу цель на странице оплаты и могут оставить чаевые на неё
                            </Text>
                        )}
                    </View>

                    {tipStats?.recent?.length > 0 && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Последние чаевые</Text>
                            {tipStats.recent.map((tip) => (
                                <View key={tip.id} style={styles.tipRow}>
                                    <View>
                                        <Text style={styles.tipGuest}>{tip.guest_name || 'Гость'}</Text>
                                        <Text style={styles.tipDate}>
                                            {new Date(tip.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.tipAmount}>+{formatCurrency(tip.amount)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 14,
    },
    goalProgress: {
        marginBottom: 16,
    },
    goalProgressBar: {
        height: 12,
        borderRadius: 99,
        backgroundColor: COLORS.slate100,
        overflow: 'hidden',
    },
    goalProgressFill: {
        height: '100%',
        borderRadius: 99,
        backgroundColor: COLORS.primary,
    },
    goalProgressText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },
    goalForm: {
        gap: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.slate100,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.textDark,
        backgroundColor: COLORS.backgroundLight,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
    goalHint: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 12,
        lineHeight: 18,
    },
    tipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate100,
    },
    tipGuest: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    tipDate: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    tipAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.success,
    },
});