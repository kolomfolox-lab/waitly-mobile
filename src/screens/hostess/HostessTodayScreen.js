import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    RefreshControl, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
    getHostessToday, patchBooking, bookingOnWay, bookingLate15,
    bookingArrived, bookingSuggest, hostessKpi,
    getWaitlist, addWaitlist, callWaitlist, seatWaitlist, cancelWaitlist,
    getHandovers, createHandover, acceptHandover,
} from '../../api/hostess';
import { alertDialog, confirmDialog } from '../../utils/dialog';

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
    border: '#f0ecec',
};

const STATUS_STYLE = {
    PENDING: { label: 'Ожидает', color: COLORS.warning },
    CONFIRMED: { label: 'Подтверждена', color: COLORS.success },
    SEATED: { label: 'Сидит', color: COLORS.blue },
    COMPLETED: { label: 'Завершена', color: COLORS.muted },
    CANCELLED: { label: 'Отменена', color: COLORS.danger },
    NO_SHOW: { label: 'Не пришёл', color: COLORS.danger },
};

function BookingCard({ booking, onChanged }) {
    const [busy, setBusy] = useState(false);
    const [suggest, setSuggest] = useState(null);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const st = STATUS_STYLE[booking.status] || { label: booking.status, color: COLORS.muted };

    const run = async (fn, okMsg) => {
        setBusy(true);
        try {
            await fn();
            if (okMsg) await alertDialog('Готово', okMsg);
            onChanged();
        } catch (e) {
            await alertDialog('Ошибка', e.response?.data?.error || e.response?.data?.detail || 'Не удалось');
        } finally {
            setBusy(false);
        }
    };

    const seat = () => run(
        () => patchBooking(booking.id, { status: 'SEATED', arrived_count: booking.guest_count }),
        'Гость посажен',
    );
    const arrivedOne = () => run(() => bookingArrived(booking.id, 1));
    // В TWA Alert.alert — no-op (react-native-web), поэтому подтверждение
    // через confirmDialog (нативный showPopup → window.confirm → Alert).
    const noShow = async () => {
        const ok = await confirmDialog('Неявка?', 'Отметить гостя как не пришедшего?', { okText: 'Да', destructive: true });
        if (ok) run(() => patchBooking(booking.id, { status: 'NO_SHOW' }));
    };
    const openSuggest = async () => {
        setBusy(true);
        try {
            const tables = await bookingSuggest(booking.id);
            setSuggest(tables || []);
            setSuggestOpen(true);
        } catch {
            await alertDialog('Ошибка', 'Нет свободных столов на замену');
        } finally {
            setBusy(false);
        }
    };
    const moveTo = async (table) => {
        const ok = await confirmDialog(`Пересадить на стол ${table.number}?`, '', { okText: 'Пересадить', cancelText: 'Нет' });
        if (!ok) return;
        setSuggestOpen(false);
        run(() => patchBooking(booking.id, { table: table.id }), `Пересажено на стол ${table.number}`);
    };

    const active = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
    return (
        <View style={styles.card}>
            <View style={styles.cardHead}>
                <View>
                    <Text style={styles.name}>{booking.client_name}</Text>
                    <Text style={styles.sub}>
                        {booking.client_phone_masked || booking.client_phone}
                        {booking.low_trusted ? ' · ⚠️ low-trusted' : ''}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: st.color + '1f' }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>
            <Text style={styles.meta}>
                Стол {booking.table_number} · {(booking.booking_time || '').slice(0, 5)} · {booking.guest_count} гост.
                {booking.arrived_count ? ` · пришло ${booking.arrived_count}` : ''}
            </Text>
            <View style={styles.badges}>
                {booking.is_late_hold && <Text style={[styles.badge, styles.badgeLate]}>⏰ держим +15</Text>}
                {booking.is_partial && <Text style={[styles.badge, styles.badgeInfo]}>👥 частично</Text>}
                {booking.deposit_status === 'HOLD' && (
                    <Text style={[styles.badge, styles.badgeDep]}>💰 депозит {booking.deposit_amount}</Text>
                )}
                {booking.deposit_status === 'FORFEITED' && (
                    <Text style={[styles.badge, styles.badgeBad]}>💰 депозит сгорел</Text>
                )}
                {booking.occasion ? <Text style={styles.note}>🎉 {booking.occasion}</Text> : null}
                {booking.notes ? <Text style={styles.note}>📝 {booking.notes}</Text> : null}
            </View>
            {active && (
                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={seat} disabled={busy}>
                        <Text style={styles.btnPrimaryText}>Посадить</Text>
                    </TouchableOpacity>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                        <TouchableOpacity style={styles.chip} onPress={arrivedOne} disabled={busy}><Text style={styles.chipText}>+1 пришёл</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.chip} onPress={() => run(() => bookingOnWay(booking.id))} disabled={busy}><Text style={styles.chipText}>В пути</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.chip} onPress={() => run(() => bookingLate15(booking.id))} disabled={busy}><Text style={styles.chipText}>+15</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.chip} onPress={openSuggest} disabled={busy}><Text style={styles.chipText}>Замена</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.chip, styles.chipDanger]} onPress={noShow} disabled={busy}><Text style={[styles.chipText, styles.chipDangerText]}>No-show</Text></TouchableOpacity>
                    </ScrollView>
                </View>
            )}
            <Modal visible={suggestOpen} transparent animationType="slide">
                <View style={styles.modalWrap}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Свободные столы</Text>
                        {(suggest || []).map((t) => (
                            <TouchableOpacity key={t.id} style={styles.suggestRow} onPress={() => moveTo(t)}>
                                <Text style={styles.suggestText}>Стол {t.number} · {t.capacity} мест</Text>
                                <MaterialIcons name="arrow-forward" size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                        ))}
                        {(!suggest || !suggest.length) && <Text style={styles.sub}>Нет свободных — предложите очередь</Text>}
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setSuggestOpen(false)}>
                            <Text style={styles.closeBtnText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function WaitlistPane({ onChanged, refreshKey }) {
    const [list, setList] = useState([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [guests, setGuests] = useState('2');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setList(await getWaitlist());
        } catch { /* silent */ }
    }, []);
    useFocusEffect(useCallback(() => { load(); }, [load, refreshKey]));

    const run = async (fn) => {
        setBusy(true);
        try {
            await fn();
            load();
            onChanged();
        } catch (e) {
            await alertDialog('Ошибка', e.response?.data?.error || 'Не удалось');
        } finally {
            setBusy(false);
        }
    };

    const add = () => {
        if (!name.trim() || !phone.trim()) {
            alertDialog('Заполните', 'Имя и телефон обязательны');
            return;
        }
        run(() => addWaitlist({ client_name: name.trim(), client_phone: phone.trim(), guest_count: Math.max(1, parseInt(guests, 10) || 2) }))
            .then(() => { setName(''); setPhone(''); setGuests('2'); });
    };

    const waiting = list.filter((e) => e.status === 'WAITING' || e.status === 'CALLED');
    return (
        <View>
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>В очередь</Text>
                <TextInput style={styles.input} placeholder="Имя" value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder="Телефон" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                <TextInput style={styles.input} placeholder="Гостей" keyboardType="number-pad" value={guests} onChangeText={setGuests} />
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={add} disabled={busy}>
                    <Text style={styles.btnPrimaryText}>Добавить</Text>
                </TouchableOpacity>
            </View>
            {waiting.map((e, i) => (
                <View key={e.id} style={styles.card}>
                    <View style={styles.cardHead}>
                        <View>
                            <Text style={styles.name}>#{i + 1} {e.client_name} · {e.guest_count} гост.</Text>
                            <Text style={styles.sub}>{e.client_phone_masked || e.client_phone}</Text>
                        </View>
                        <Text style={[styles.statusText, { color: e.status === 'CALLED' ? COLORS.success : COLORS.warning }]}>
                            {e.status === 'CALLED' ? 'Вызван' : 'Ждёт'}
                        </Text>
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => run(() => callWaitlist(e.id))} disabled={busy}>
                            <Text style={styles.btnPrimaryText}>Вызвать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => run(() => seatWaitlist(e.id))} disabled={busy}>
                            <Text style={styles.btnGhostText}>Посадить</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => run(() => cancelWaitlist(e.id))} disabled={busy}>
                            <Text style={[styles.btnGhostText, { color: COLORS.danger }]}>Убрать</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            {!waiting.length && <Text style={styles.empty}>Очередь пуста 🎉</Text>}
        </View>
    );
}

export default function HostessTodayScreen() {
    const [tab, setTab] = useState('bookings');
    const [bookings, setBookings] = useState([]);
    const [kpi, setKpi] = useState(null);
    const [query, setQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [handoverOpen, setHandoverOpen] = useState(false);
    const [handoverNote, setHandoverNote] = useState('');
    const [lastHandover, setLastHandover] = useState(null);

    const load = useCallback(async () => {
        try {
            const [b, k, h] = await Promise.all([
                getHostessToday().catch(() => []),
                hostessKpi().catch(() => null),
                getHandovers().catch(() => []),
            ]);
            setBookings(b);
            setKpi(k);
            setLastHandover(Array.isArray(h) && h.length ? h[0] : null);
        } finally {
            setRefreshing(false);
        }
    }, []);
    useFocusEffect(useCallback(() => { load(); }, [load]));

    const refresh = () => {
        setRefreshing(true);
        setRefreshKey((k) => k + 1);
        load();
    };

    const q = query.trim().toLowerCase();
    const filtered = bookings.filter((b) => {
        if (!q) return true;
        return [b.client_name, b.client_phone, b.client_phone_masked, String(b.table_number)]
            .filter(Boolean).join(' ').toLowerCase().includes(q);
    });
    const active = filtered.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED');
    const done = filtered.filter((b) => !['PENDING', 'CONFIRMED'].includes(b.status));

    const sendHandover = async () => {
        try {
            await createHandover(handoverNote);
            setHandoverNote('');
            setHandoverOpen(false);
            load();
            await alertDialog('Готово', 'Смена передана');
        } catch {
            await alertDialog('Ошибка', 'Не удалось передать смену');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.title}>Сегодня</Text>
                <TouchableOpacity style={styles.handoverBtn} onPress={() => setHandoverOpen(true)}>
                    <MaterialIcons name="swap-horiz" size={18} color={COLORS.primary} />
                    <Text style={styles.handoverBtnText}>Передать смену</Text>
                </TouchableOpacity>
            </View>
            {kpi && (
                <View style={styles.kpiRow}>
                    <Text style={styles.kpi}>Всего {kpi.total}</Text>
                    <Text style={styles.kpi}>Сидит {kpi.seated}</Text>
                    <Text style={[styles.kpi, kpi.noshow > 0 && styles.kpiBad]}>No-show {kpi.noshow}</Text>
                    <Text style={styles.kpi}>+15: {kpi.late_holds}</Text>
                </View>
            )}
            {lastHandover && !lastHandover.accepted_by && (
                <TouchableOpacity
                    style={styles.handoverBanner}
                    onPress={async () => {
                        const ok = await confirmDialog('Принять смену?', lastHandover.note || 'Без заметки', { okText: 'Принять', cancelText: 'Нет' });
                        if (ok) {
                            try {
                                await acceptHandover(lastHandover.id);
                            } catch {
                                await alertDialog('Ошибка', 'Не удалось принять смену');
                            }
                            load();
                        }
                    }}
                >
                    <Text style={styles.handoverBannerText}>📋 Непринятая передача смены — нажать чтобы принять</Text>
                </TouchableOpacity>
            )}
            <View style={styles.seg}>
                {['bookings', 'queue'].map((key) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.segBtn, tab === key && styles.segBtnActive]}
                        onPress={() => setTab(key)}
                    >
                        <Text style={[styles.segText, tab === key && styles.segTextActive]}>
                            {key === 'bookings' ? `Брони (${active.length})` : 'Очередь'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {tab === 'bookings' && (
                <View style={styles.search}>
                    <MaterialIcons name="search" size={20} color={COLORS.muted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Имя, телефон, стол…"
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>
            )}
            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            >
                {tab === 'bookings' ? (
                    <>
                        {active.map((b) => <BookingCard key={b.id} booking={b} onChanged={refresh} />)}
                        {!active.length && <Text style={styles.empty}>Активных броней нет</Text>}
                        {done.length > 0 && <Text style={styles.sectionTitle}>История дня</Text>}
                        {done.map((b) => <BookingCard key={b.id} booking={b} onChanged={refresh} />)}
                    </>
                ) : (
                    <WaitlistPane onChanged={refresh} refreshKey={refreshKey} />
                )}
            </ScrollView>
            <Modal visible={handoverOpen} transparent animationType="slide">
                <View style={styles.modalWrap}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Передача смены</Text>
                        <TextInput
                            style={[styles.input, styles.noteInput]}
                            placeholder="Стол 7 сломан, банкет в 19:00…"
                            multiline
                            value={handoverNote}
                            onChangeText={setHandoverNote}
                        />
                        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={sendHandover}>
                            <Text style={styles.btnPrimaryText}>Передать</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setHandoverOpen(false)}>
                            <Text style={styles.closeBtnText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
    handoverBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
    handoverBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
    kpiRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
    kpi: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
    kpiBad: { color: COLORS.danger },
    handoverBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fef3c7', borderRadius: 12, padding: 10 },
    handoverBannerText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
    seg: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 999, padding: 4, marginBottom: 8 },
    segBtn: { flex: 1, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
    segBtnActive: { backgroundColor: COLORS.primary },
    segText: { fontWeight: '700', fontSize: 14, color: COLORS.muted },
    segTextActive: { color: COLORS.white },
    search: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 12, marginBottom: 8, gap: 6 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
    list: { flex: 1, paddingHorizontal: 16 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 10 },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    name: { fontSize: 16, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
    statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    meta: { fontSize: 14, color: COLORS.text, marginTop: 6 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    badge: { fontSize: 12, fontWeight: '700', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    badgeLate: { backgroundColor: '#fef3c7', color: '#92400e' },
    badgeInfo: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
    badgeDep: { backgroundColor: '#dcfce7', color: '#15803d' },
    badgeBad: { backgroundColor: '#fee2e2', color: '#b91c1c' },
    note: { fontSize: 13, color: COLORS.muted, width: '100%' },
    actions: { marginTop: 10, gap: 8 },
    chips: { flexDirection: 'row' },
    chip: { backgroundColor: COLORS.background, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginRight: 6, borderWidth: 1, borderColor: COLORS.border },
    chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
    chipDanger: { borderColor: COLORS.danger },
    chipDangerText: { color: COLORS.danger },
    btn: { borderRadius: 12, paddingVertical: 11, alignItems: 'center', flex: 1 },
    btnPrimary: { backgroundColor: COLORS.primary },
    btnPrimaryText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
    btnGhost: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
    btnGhostText: { color: COLORS.text, fontWeight: '700' },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginVertical: 8 },
    empty: { textAlign: 'center', color: COLORS.muted, marginVertical: 24 },
    input: { backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    noteInput: { minHeight: 80, textAlignVertical: 'top' },
    modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modal: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 8 },
    modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
    suggestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    suggestText: { fontSize: 15, fontWeight: '600' },
    closeBtn: { alignItems: 'center', paddingVertical: 10 },
    closeBtnText: { color: COLORS.muted, fontWeight: '700' },
});
