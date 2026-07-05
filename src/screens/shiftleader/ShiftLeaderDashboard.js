import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    RefreshControl, TouchableOpacity, SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    danger: '#FF4757',
    white: '#FFFFFF',
    textDark: '#0B1527',
    textMuted: '#8F9BB3',
    slate100: '#F1F5F9',
};

const TABS = [
    { key: 'shifts', label: 'Сегодняшние смены', icon: 'groups' },
    { key: 'schedule', label: 'График', icon: 'calendar-today' },
];

const STATUS_COLORS = {
    PENDING: COLORS.warning,
    APPROVED: COLORS.success,
    DECLINED: COLORS.danger,
};

export default function ShiftLeaderDashboard({ navigation }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('shifts');
    const [shifts, setShifts] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [shiftsRes, staffRes] = await Promise.all([
                client.get('/api/hr/shifts/').catch(() => null),
                client.get('/api/owner/staff/').catch(() => null),
            ]);
            if (shiftsRes?.data) {
                const data = shiftsRes.data.results || shiftsRes.data || [];
                setShifts(Array.isArray(data) ? data : []);
            }
            if (staffRes?.data) {
                const data = staffRes.data.results || staffRes.data || [];
                setStaff(Array.isArray(data) ? data : []);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const activeShifts = shifts.filter(s => !s.ended_at);
    const pendingChanges = shifts.filter(s => s.status === 'PENDING');
    const staffOnDuty = staff.filter(s => s.is_active);

    const renderShiftsTab = () => (
        <>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{activeShifts.length}</Text>
                    <Text style={styles.statLabel}>Активных смен</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{pendingChanges.length}</Text>
                    <Text style={styles.statLabel}>Ожидает смены</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{staffOnDuty.length}</Text>
                    <Text style={styles.statLabel}>На смене</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Текущие смены</Text>
            {activeShifts.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="night-shift" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : activeShifts.map(shift => (
                <View key={shift.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <MaterialIcons name="person" size={20} color={COLORS.primary} />
                        <Text style={styles.cardTitle}>{shift.user?.full_name || 'Сотрудник'}</Text>
                        <View style={[styles.badge, { backgroundColor: shift.ended_at ? '#e2e8f0' : COLORS.success + '20' }]}>
                            <Text style={[styles.badgeText, { color: shift.ended_at ? COLORS.textMuted : COLORS.success }]}>
                                {shift.ended_at ? 'Завершена' : 'Активна'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.cardSub}>{shift.user?.role || ''} &middot; Начало: {new Date(shift.started_at).toLocaleTimeString()}</Text>
                </View>
            ))}

            <Text style={styles.sectionTitle}>Заявки на замену</Text>
            {pendingChanges.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="swap-horiz" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : pendingChanges.map(shift => (
                <View key={shift.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <Text style={styles.cardTitle}>{shift.user?.full_name || 'Сотрудник'}</Text>
                        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[shift.status] + '20' }]}>
                            <Text style={[styles.badgeText, { color: STATUS_COLORS[shift.status] }]}>
                                {shift.status === 'PENDING' ? 'Ожидает' : shift.status}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.actionBtn}>
                        <MaterialIcons name="check-circle" size={16} color={COLORS.white} />
                        <Text style={styles.actionText}>Одобрить</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </>
    );

    const renderScheduleTab = () => (
        <>
            <Text style={styles.sectionTitle}>Персонал на сегодня</Text>
            {staff.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="people" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : staff.map(person => (
                <View key={person.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <View style={styles.avatar}>
                            <MaterialIcons name="person" size={20} color={COLORS.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{person.full_name || person.username}</Text>
                            <Text style={styles.cardSub}>{person.role}</Text>
                        </View>
                        <View style={[styles.statusDot, { backgroundColor: person.is_active ? COLORS.success : COLORS.textMuted }]} />
                    </View>
                </View>
            ))}
        </>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Shift Leader</Text>
                    <Text style={styles.subtitle}>Панель управления сменами</Text>
                </View>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Shift Leader</Text>
                    <Text style={styles.subtitle}>Панель управления сменами</Text>
                </View>

                <View style={styles.tabRow}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <MaterialIcons name={tab.icon} size={16} color={activeTab === tab.key ? COLORS.white : COLORS.textMuted} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'shifts' ? renderShiftsTab() : renderScheduleTab()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundLight },
    scrollContent: { paddingBottom: 60 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
    subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.white },
    tabChipActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    tabTextActive: { color: COLORS.white },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
    statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1 },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, marginLeft: 30 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start' },
    actionText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
});
