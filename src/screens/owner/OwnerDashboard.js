import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator, RefreshControl, SafeAreaView,
    ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
    getOwnerDashboardSummary, getOwnerStaffPerformance,
    getOwnerDashboardAnalytics, getMobileInventorySummary,
} from '../../api/apiService';

const C = {
    primary: '#ff6b6b', primarySoft: 'rgba(255,107,107,0.12)',
    bg: '#f8f5f5', card: '#ffffff', border: '#e2e8f0',
    text: '#0f172a', muted: '#94a3b8', success: '#52D681',
    warning: '#F7B731', accent: '#667eea',
};

function fmt(n) {
    if (n == null) return '0';
    return Number(n).toLocaleString('ru-RU');
}

export default function OwnerDashboard({ navigation }) {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [staff, setStaff] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [s, st, a, inv] = await Promise.all([
                getOwnerDashboardSummary(),
                getOwnerStaffPerformance(),
                getOwnerDashboardAnalytics(),
                getMobileInventorySummary(),
            ]);
            setSummary(s);
            setStaff(st?.staff_performance || []);
            setAnalytics(a);
            setInventory(inv?.results || inv || []);
        } catch { /* silent */ }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const netProfit = useMemo(() => {
        const rev = Number(analytics?.summary?.revenue_30_days || summary?.revenue_30_days || 0);
        const cost = Number(analytics?.summary?.cost_30_days || 0);
        return rev - cost;
    }, [analytics, summary]);

    const topWaiters = useMemo(() =>
        [...staff].filter(s => s.role === 'WAITER').sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        [staff],
    );

    const topDishes = useMemo(() => {
        const raw = analytics?.top_dishes || analytics?.popular_dishes || [];
        return [...raw].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0)).slice(0, 5);
    }, [analytics]);

    const lowStock = useMemo(() =>
        (inventory || []).filter(i => i.is_low || i.is_empty).slice(0, 5),
        [inventory],
    );

    const maxOrders = useMemo(() => {
        const hourly = analytics?.hourly_breakdown || [];
        return Math.max(...hourly.map(h => Number(h.order_count || 0)), 1);
    }, [analytics]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={{ color: C.muted, marginTop: 12, fontWeight: '700' }}>Дашборд...</Text>
            </View>
        );
    }

    const Metric = ({ label, value, icon, color }) => (
        <View style={styles.metric}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.metricL}>{label}</Text>
                <MaterialIcons name={icon} size={18} color={color || C.muted} />
            </View>
            <Text style={[styles.metricV, color ? { color } : {}]}>{fmt(value)}</Text>
        </View>
    );

    const Section = ({ title, icon, count, link, children }) => (
        <View style={styles.section}>
            <View style={styles.sh}>
                <MaterialIcons name={icon} size={18} color={C.text} />
                <Text style={styles.st}>{title}</Text>
                {count != null && <Text style={styles.sc}>{count}</Text>}
                {link && <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => navigation?.navigate(link)}><Text style={styles.link}>{'Весь'}</Text></TouchableOpacity>}
            </View>
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} />}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.kicker}>Owner</Text>
                        <Text style={styles.title}>Кабинет</Text>
                        <Text style={styles.sub}>{user?.full_name || ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.hBtn}><MaterialIcons name="more-horiz" size={22} color={C.text} /></TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }} contentContainerStyle={{ gap: 10, paddingRight: 16, paddingTop: 12 }}>
                    <Metric label="Выручка 30д" value={summary?.revenue_30_days || 0} icon="trending-up" color={C.success} />
                    <Metric label="Прибыль" value={netProfit} icon="account-balance" color={C.accent} />
                    <Metric label="Сегодня" value={summary?.revenue_today || 0} icon="today" color={C.primary} />
                    <Metric label="Заказы" value={summary?.orders_today || 0} icon="receipt" />
                    <Metric label="Активные" value={summary?.active_orders || 0} icon="local-fire-department" color={C.warning} />
                    <Metric label="Столы" value={summary?.tables_count || 0} icon="table-restaurant" />
                </ScrollView>

                <Section title="Официанты" icon="people" count={staff.filter(s => s.role === 'WAITER').length} link="StaffScreen">
                    {topWaiters.length === 0 ? (
                        <View style={styles.empty}><Text style={styles.et}>Нет данных</Text></View>
                    ) : topWaiters.map((w, i) => (
                        <View key={w.staff_id} style={styles.row}>
                            <View style={styles.rb}><Text style={styles.rt}>{i + 1}</Text></View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.rn}>{w.full_name}</Text>
                                <Text style={styles.rs}>{w.delivered_orders} зак · {w.shifts_count} смен</Text>
                            </View>
                            <Text style={styles.rv}>{fmt(w.revenue)}</Text>
                        </View>
                    ))}
                </Section>

                <Section title="Популярные блюда" icon="restaurant-menu" count={topDishes.length}>
                    {topDishes.length === 0 ? (
                        <View style={styles.empty}><Text style={styles.et}>Нет продаж</Text></View>
                    ) : topDishes.map((d, i) => (
                        <View key={i} style={styles.row}>
                            <View style={styles.rb}><Text style={styles.rt}>{i + 1}</Text></View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.rn}>{d.name || d.dish_name}</Text>
                                <Text style={styles.rs}>{d.total_sold} шт</Text>
                            </View>
                            <Text style={styles.rv}>{fmt(d.total_revenue)}</Text>
                        </View>
                    ))}
                </Section>

                <Section title="Склад" icon="inventory" count={lowStock.length > 0 ? lowStock.length : null} link="InventoryScreen">
                    {lowStock.length === 0 ? (
                        <View style={styles.empty}><MaterialIcons name="check-circle" size={22} color={C.success} /><Text style={[styles.et, { color: C.success, marginLeft: 4 }]}>Всё в норме</Text></View>
                    ) : lowStock.map((item, i) => (
                        <View key={i} style={styles.row}>
                            <MaterialIcons name={item.is_empty ? 'error' : 'warning'} size={18} color={item.is_empty ? C.primary : C.warning} />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.rn}>{item.ingredient_name}</Text>
                                <Text style={styles.rs}>{item.quantity} {item.unit} {item.is_empty ? '(пусто)' : '(мало)'}</Text>
                            </View>
                        </View>
                    ))}
                </Section>

                <Section title="Заказы по часам" icon="bar-chart">
                    {maxOrders <= 1 ? (
                        <View style={styles.empty}><Text style={styles.et}>Нет заказов сегодня</Text></View>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 12, height: 120 }}>
                            {(analytics?.hourly_breakdown || []).filter(h => Number(h.order_count) > 0).map((h, i) => (
                                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                                    <View style={[styles.bar, { height: Math.max(4, (Number(h.order_count) / maxOrders) * 80), backgroundColor: i % 2 === 0 ? C.primary : C.accent }]} />
                                    <Text style={styles.bl}>{`${Number(h.hour)}:00`}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </Section>

                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: C.muted, fontSize: 11 }}>
                        {staff.length} сотрудников · {summary?.tables_count || 0} столов
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    kicker: { color: '#8bd8ff', fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
    title: { color: C.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    sub: { color: C.muted, fontSize: 13, marginTop: 2 },
    hBtn: { padding: 8, borderRadius: 999, backgroundColor: C.bg },
    metric: { width: 140, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 14 },
    metricL: { color: C.muted, fontSize: 10, fontWeight: '700' },
    metricV: { color: C.text, fontSize: 24, fontWeight: '900', marginTop: 6 },
    section: { marginHorizontal: 16, marginTop: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 16 },
    sh: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    st: { color: C.text, fontSize: 16, fontWeight: '900' },
    sc: { color: C.muted, fontSize: 11, fontWeight: '700', backgroundColor: C.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
    link: { color: C.accent, fontSize: 12, fontWeight: '800' },
    empty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
    et: { color: C.muted, fontSize: 13 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
    rb: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
    rt: { color: C.primary, fontSize: 11, fontWeight: '900' },
    rn: { color: C.text, fontSize: 14, fontWeight: '700' },
    rs: { color: C.muted, fontSize: 10, marginTop: 1 },
    rv: { color: C.text, fontSize: 15, fontWeight: '900', marginLeft: 8 },
    bar: { width: '100%', borderRadius: 4, minWidth: 6 },
    bl: { color: C.muted, fontSize: 7, marginTop: 2 },
});
