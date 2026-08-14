import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { getSavingsGoal, updateSavingsGoal } from '../../api/apiService';

const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#FFFFFF',
    text: '#1a1a2e',
    textMuted: '#94a3b8',
    border: '#f0ecec',
    success: '#22c55e',
    warning: '#f59e0b',
};

export default function GuestSavingsGoalScreen({ navigation }) {
    const { user } = useAuth();
    const [goal, setGoal] = useState(null);
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getSavingsGoal(user?.phone_number)
            .then(r => {
                setGoal(r);
                setName(r.name || '');
                setTargetAmount(r.target_amount ? String(r.target_amount) : '');
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!name.trim() || !targetAmount.trim()) {
            Alert.alert('Ошибка', 'Заполните название и цель');
            return;
        }
        setSaving(true);
        try {
            await updateSavingsGoal(user?.phone_number, { name: name.trim(), target_amount: parseFloat(targetAmount) });
            Alert.alert('Готово', 'Копилка сохранена');
            navigation.goBack();
        } catch {
            Alert.alert('Ошибка', 'Не удалось сохранить копилку');
        } finally {
            setSaving(false);
        }
    };

    const progress = goal ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Копилка</Text>
                    <View style={{ width: 24 }} />
                </View>

                {goal && goal.current_amount > 0 && (
                    <View style={styles.progressCard}>
                        <View style={styles.progressRow}>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                            </View>
                            <Text style={styles.progressPct}>{progress}%</Text>
                        </View>
                        <Text style={styles.progressAmounts}>
                            {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()} UZS
                        </Text>
                    </View>
                )}

                <View style={styles.form}>
                    <Text style={styles.label}>Название цели</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Например: Новый телефон"
                        placeholderTextColor={COLORS.textMuted}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Целевая сумма (UZS)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1000000"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                    />

                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, '#ff8a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveBtnGradient}
                        >
                            {saving ? <ActivityIndicator color={COLORS.white} /> : (
                                <Text style={styles.saveBtnText}>Сохранить</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
    progressCard: {
        backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
        gap: 8,
    },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressTrack: { flex: 1, height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.warning, borderRadius: 5 },
    progressPct: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
    progressAmounts: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
    form: { paddingHorizontal: 20, gap: 16 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    input: {
        backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
    },
    saveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnGradient: { paddingVertical: 16, alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
});
