import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getHostessTables, markTableCleaned, getHostessToday } from '../../api/hostess';

const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#FFFFFF',
    text: '#0f172a',
    muted: '#94a3b8',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    blue: '#3b82f6',
    brown: '#b45309',
};

export default function HostessHallScreen() {
    const [tables, setTables] = useState([]);
    const [bookedIds, setBookedIds] = useState(new Set());
    const [filter, setFilter] = useState('ALL');
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const [t, bookings] = await Promise.all([
                getHostessTables().catch(() => []),
                getHostessToday().catch(() => []),
            ]);
            setTables(t);
            setBookedIds(new Set((bookings || []).filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status)).map((b) => b.table)));
        } finally {
            setRefreshing(false);
        }
    }, []);
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const cleaned = async (table) => {
        try {
            await markTableCleaned(table.id);
            load();
        } catch {
            await alertDialog('Ошибка', 'Не удалось отметить уборку');
        }
    };

    const stateOf = (t) => {
        if (t.needs_cleaning || t.table_state === 'NEEDS_CLEANING') return 'CLEANING';
        if (t.is_occupied || t.table_state === 'OCCUPIED') return 'OCCUPIED';
        if (t.table_state === 'WAITING_WAITER') return 'WAITING';
        if (bookedIds.has(t.id)) return 'RESERVED';
        return 'FREE';
    };

    const META = {
        FREE: { label: 'Свободен', color: COLORS.success, icon: 'check-circle' },
        OCCUPIED: { label: 'Занят', color: COLORS.danger, icon: 'people' },
        WAITING: { label: 'Ждёт официанта', color: COLORS.warning, icon: 'room-service' },
        RESERVED: { label: 'Бронь', color: COLORS.blue, icon: 'event' },
        CLEANING: { label: 'Нужна уборка', color: COLORS.brown, icon: 'cleaning-services' },
    };

    const filtered = tables.filter((t) => {
        const s = stateOf(t);
        if (filter === 'ALL') return true;
        if (filter === 'FREE') return s === 'FREE';
        if (filter === 'CLEANING') return s === 'CLEANING';
        if (filter === 'BUSY') return s === 'OCCUPIED' || s === 'WAITING' || s === 'RESERVED';
        return true;
    });
    const dirtyCount = tables.filter((t) => stateOf(t) === 'CLEANING').length;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.title}>Зал</Text>
                {dirtyCount > 0 && <Text style={styles.dirty}>🧹 на уборке: {dirtyCount}</Text>}
            </View>
            <View style={styles.filters}>
                {['ALL', 'FREE', 'CLEANING', 'BUSY'].map((f) => (
                    <TouchableOpacity key={f} style={[styles.f, filter === f && styles.fActive]} onPress={() => setFilter(f)}>
                        <Text style={[styles.fText, filter === f && styles.fTextActive]}>
                            {f === 'ALL' ? 'Все' : f === 'FREE' ? 'Свободные' : f === 'CLEANING' ? 'Уборка' : 'Занятые'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
            >
                <View style={styles.grid}>
                    {filtered.map((t) => {
                        const s = stateOf(t);
                        const m = META[s];
                        return (
                            <View key={t.id} style={[styles.tile, { borderColor: m.color }]}>
                                <Text style={styles.number}>{t.number}</Text>
                                <MaterialIcons name={m.icon} size={20} color={m.color} />
                                <Text style={[styles.state, { color: m.color }]}>{m.label}</Text>
                                {t.capacity ? <Text style={styles.cap}>{t.capacity} мест</Text> : null}
                                {s === 'CLEANING' && (
                                    <TouchableOpacity style={styles.cleanBtn} onPress={() => cleaned(t)}>
                                        <Text style={styles.cleanBtnText}>Убрано ✓</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>
                {!filtered.length && <Text style={styles.empty}>Столов нет</Text>}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
    dirty: { fontSize: 13, fontWeight: '700', color: COLORS.brown },
    filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    f: { backgroundColor: COLORS.white, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    fActive: { backgroundColor: COLORS.primary },
    fText: { fontWeight: '700', fontSize: 13, color: COLORS.muted },
    fTextActive: { color: COLORS.white },
    list: { flex: 1, paddingHorizontal: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
    tile: { width: '31%', backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 2, padding: 10, alignItems: 'center', gap: 2 },
    number: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    state: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
    cap: { fontSize: 11, color: COLORS.muted },
    cleanBtn: { backgroundColor: COLORS.success, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6 },
    cleanBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    empty: { textAlign: 'center', color: COLORS.muted, marginTop: 32 },
});
