import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
    RefreshControl, TextInput, Alert, ActivityIndicator, Switch, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
    getOwnerStaff,
    getPosSettings,
    updatePosSettings,
    setStaffPin,
    getPosCertificates,
    createPosCertificate,
    getPosShift,
    openPosShift,
    dropPosShift,
    closePosShift,
    createPosPairRequest,
    getPosPairRequest,
} from '../../api/apiService';

const C = {
    primary: '#22C55E',
    bg: '#F8F9FA',
    card: '#FFFFFF',
    text: '#0B1527',
    muted: '#8F9BB3',
    border: '#E6EAF0',
    red: '#EF4444',
};

const QR_URL = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data)}`;

export default function PosScreen() {
    const [staff, setStaff] = useState([]);
    const [pos, setPos] = useState({});
    const [certs, setCerts] = useState([]);
    const [shift, setShift] = useState(null);
    const [shiftForm, setShiftForm] = useState({ opening: '', drop: '', close: '' });
    const [shiftBusy, setShiftBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pinTarget, setPinTarget] = useState(null);
    const [pinValue, setPinValue] = useState('');
    const [certForm, setCertForm] = useState({ code: '', amount: '' });
    // Обратный Magic Pair: касса генерирует QR, владелец подтверждает с телефона
    const [pair, setPair] = useState(null); // { code, qr_url, status, expires_in }
    const [pairBusy, setPairBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [staffRes, posRes, certRes, shiftRes] = await Promise.allSettled([
                getOwnerStaff(), getPosSettings(), getPosCertificates(), getPosShift(),
            ]);
            setStaff(staffRes.status === 'fulfilled' ? (staffRes.value || []) : []);
            setPos(posRes.status === 'fulfilled' ? posRes.value : {});
            setCerts(certRes.status === 'fulfilled' ? (certRes.value || []) : []);
            setShift(shiftRes.status === 'fulfilled' ? (shiftRes.value?.shift || null) : null);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    useFocusEffect(useCallback(() => { void load(); }, [load]));

    // Поллинг паринга: 90с на подтверждение владельцем
    useEffect(() => {
        if (!pair || pair.status === 'confirmed' || pair.status === 'expired') return;
        const timer = setInterval(async () => {
            try {
                const res = await getPosPairRequest(pair.code);
                if (res?.status === 'confirmed') {
                    setPair((p) => (p ? { ...p, status: 'confirmed' } : p));
                    Alert.alert('Касса подключена', 'Владелец подтвердил подключение. Касса вошла в систему.');
                    clearInterval(timer);
                } else if (res?.status === 'expired') {
                    setPair((p) => (p ? { ...p, status: 'expired' } : p));
                    clearInterval(timer);
                }
            } catch { /* сеть — попробуем ещё раз */ }
        }, 2000);
        return () => clearInterval(timer);
    }, [pair?.code, pair?.status]);

    const togglePin = async () => {
        try {
            const res = await updatePosSettings({ pin_required: !pos.pin_required });
            setPos(res);
            Alert.alert('Готово', 'Настройка PIN обновлена');
        } catch { Alert.alert('Ошибка', 'Не удалось обновить'); }
    };

    const savePin = async () => {
        if (!pinTarget) return;
        if (!/^\d{4}$/.test(pinValue.trim())) {
            Alert.alert('Ошибка', 'PIN должен быть ровно 4 цифры');
            return;
        }
        try {
            await setStaffPin(pinTarget, pinValue.trim());
            Alert.alert('Готово', 'PIN сохранён');
            setPinTarget(null);
            setPinValue('');
            await load();
        } catch (e) {
            Alert.alert('Ошибка', e?.response?.data?.error?.message || 'Не удалось сохранить PIN');
        }
    };

    const createCert = async () => {
        if (!certForm.code.trim() || !certForm.amount) {
            Alert.alert('Ошибка', 'Введите код и сумму');
            return;
        }
        try {
            await createPosCertificate({
                code: certForm.code.trim().toUpperCase(),
                amount: Number(certForm.amount),
            });
            Alert.alert('Готово', 'Сертификат создан');
            setCertForm({ code: '', amount: '' });
            await load();
        } catch { Alert.alert('Ошибка', 'Не удалось создать сертификат'); }
    };

    const errMessage = (e, fallback) => e?.response?.data?.error?.message || e?.response?.data?.message || fallback;

    // ── Кассовая смена ──────────────────────────────────────────────
    const openShift = async () => {
        if (!shiftForm.opening) { Alert.alert('Ошибка', 'Введите начальную сумму кассы'); return; }
        setShiftBusy(true);
        try {
            const res = await openPosShift(shiftForm.opening);
            setShift(res.shift || null);
            setShiftForm({ ...shiftForm, opening: '' });
            Alert.alert('Смена открыта', `Начальная сумма: ${Number(res.shift?.opening_cash || 0).toLocaleString()} сум`);
        } catch (e) {
            Alert.alert('Ошибка', errMessage(e, 'Не удалось открыть смену'));
        } finally { setShiftBusy(false); }
    };

    const doDrop = async () => {
        if (!shiftForm.drop) { Alert.alert('Ошибка', 'Введите сумму изъятия'); return; }
        setShiftBusy(true);
        try {
            const res = await dropPosShift(shiftForm.drop);
            setShift(res.shift || null);
            setShiftForm({ ...shiftForm, drop: '' });
            Alert.alert('Изъято', `${Number(shiftForm.drop).toLocaleString()} сум отправлено в сейф`);
        } catch (e) {
            Alert.alert('Ошибка', errMessage(e, 'Не удалось провести изъятие'));
        } finally { setShiftBusy(false); }
    };

    const doCloseShift = async () => {
        if (!shiftForm.close) { Alert.alert('Ошибка', 'Введите фактическую сумму в кассе (Z-отчёт)'); return; }
        setShiftBusy(true);
        try {
            const res = await closePosShift(shiftForm.close);
            setShift(null);
            setShiftForm({ ...shiftForm, close: '' });
            const diff = Number(res.shift?.difference || 0);
            Alert.alert(
                'Z-отчёт · смена закрыта',
                diff === 0 ? 'Остаток сошёлся' : `Расхождение: ${diff.toLocaleString()} сум`,
            );
        } catch (e) {
            Alert.alert('Ошибка', errMessage(e, 'Не удалось закрыть смену'));
        } finally { setShiftBusy(false); }
    };

    // ── Обратный Magic Pair ─────────────────────────────────────────
    const startPair = async () => {
        setPairBusy(true);
        try {
            const res = await createPosPairRequest();
            setPair({ code: res.code, qr_url: res.qr_url, status: res.status || 'waiting', expires_in: res.expires_in });
        } catch (e) {
            Alert.alert('Ошибка', errMessage(e, 'Не удалось создать код подключения'));
        } finally { setPairBusy(false); }
    };

    const formatSum = (v) => Number(v || 0).toLocaleString('ru-RU');

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                contentContainerStyle={styles.content}
            >
                <Text style={styles.title}>Касса (POS)</Text>
                <Text style={styles.subtitle}>Приложение-касса для планшета. Вход по PIN — видно, кто выполнил действие.</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Приложение-касса</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>
                            {pos.pin_policy_fixed
                                ? 'PIN обязателен (кофейня)'
                                : pos.pin_required ? 'PIN вход включён' : 'PIN вход выключен (ресторан)'}
                        </Text>
                        <Switch
                            value={!!pos.pin_required}
                            onValueChange={togglePin}
                            disabled={pos.pin_policy_fixed}
                            trackColor={{ true: C.primary }}
                        />
                    </View>
                    {pos.pos_url ? (
                        <TouchableOpacity
                            style={styles.linkBox}
                            onPress={() => Alert.alert('Ссылка кассы', pos.pos_url)}
                        >
                            <Text style={styles.linkText} numberOfLines={2}>{pos.pos_url}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                <Text style={styles.sectionTitle}>Подключение кассы (QR)</Text>
                <View style={styles.card}>
                    {!pair ? (
                        <>
                            <Text style={styles.mutedText}>
                                Касса сама генерирует QR — владелец сканирует телефоном и подтверждает на app.waitly.uz/pos-pair/код.
                            </Text>
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: C.primary, marginTop: 10 }]}
                                onPress={startPair}
                                disabled={pairBusy}
                            >
                                {pairBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Показать QR для владельца</Text>}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {pair.status === 'confirmed' ? (
                                <Text style={[styles.label, { color: C.primary }]}>✓ Подключение подтверждено владельцем</Text>
                            ) : pair.status === 'expired' ? (
                                <>
                                    <Text style={[styles.label, { color: C.red }]}>Код истёк (90 секунд)</Text>
                                    <TouchableOpacity
                                        style={[styles.btn, { backgroundColor: C.primary, marginTop: 10 }]}
                                        onPress={startPair}
                                    >
                                        <Text style={styles.btnText}>Обновить код</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={styles.pairRow}>
                                        <Image source={{ uri: QR_URL(pair.qr_url) }} style={styles.qr} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.label}>Код: {pair.code}</Text>
                                            <Text style={styles.mutedText}>
                                                Владелец сканирует QR и подтверждает на app.waitly.uz/pos-pair/{pair.code}
                                            </Text>
                                            <Text style={[styles.mutedText, { marginTop: 4 }]}>
                                                Ждём подтверждения… (код живёт {pair.expires_in || 90} с)
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.btn, { backgroundColor: '#E6EAF0', marginTop: 10, alignSelf: 'flex-start' }]}
                                        onPress={() => setPair(null)}
                                    >
                                        <Text style={[styles.btnText, { color: C.text }]}>Отмена</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Кассовая смена</Text>
                <View style={styles.card}>
                    {shift ? (
                        <>
                            <Text style={[styles.label, { color: C.primary }]}>● Смена открыта</Text>
                            <Text style={styles.mutedText}>
                                Начальная сумма: {formatSum(shift.opening_cash)} сум · Ожидается: {formatSum(shift.expected_cash)} сум
                            </Text>
                            <Text style={styles.mutedText}>Изъятия: {formatSum(shift.cash_drops)} сум</Text>
                            <TextInput
                                value={shiftForm.drop}
                                onChangeText={(v) => setShiftForm({ ...shiftForm, drop: v.replace(/\D/g, '') })}
                                keyboardType="number-pad"
                                placeholder="Сумма изъятия (сум)"
                                placeholderTextColor="#bbb"
                                style={styles.input}
                            />
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: '#F59E0B', marginTop: 8 }]}
                                onPress={doDrop}
                                disabled={shiftBusy}
                            >
                                <Text style={styles.btnText}>Изъять наличные</Text>
                            </TouchableOpacity>
                            <TextInput
                                value={shiftForm.close}
                                onChangeText={(v) => setShiftForm({ ...shiftForm, close: v.replace(/\D/g, '') })}
                                keyboardType="number-pad"
                                placeholder="Фактическая сумма в кассе (сум)"
                                placeholderTextColor="#bbb"
                                style={styles.input}
                            />
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: C.red, marginTop: 8 }]}
                                onPress={doCloseShift}
                                disabled={shiftBusy}
                            >
                                <Text style={styles.btnText}>Закрыть смену (Z-отчёт)</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.mutedText}>Смена закрыта. Откройте смену с начальной суммой кассы.</Text>
                            <TextInput
                                value={shiftForm.opening}
                                onChangeText={(v) => setShiftForm({ ...shiftForm, opening: v.replace(/\D/g, '') })}
                                keyboardType="number-pad"
                                placeholder="Начальная сумма (сум)"
                                placeholderTextColor="#bbb"
                                style={styles.input}
                            />
                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: C.primary, marginTop: 8 }]}
                                onPress={openShift}
                                disabled={shiftBusy}
                            >
                                <Text style={styles.btnText}>Открыть смену</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <Text style={styles.sectionTitle}>PIN сотрудников</Text>
                {staff.map((s) => (
                    <View key={s.id} style={styles.card}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>{s.full_name}</Text>
                                <Text style={styles.mutedText}>{s.role}</Text>
                            </View>
                            {pinTarget === s.id ? (
                                <View style={{ flex: 1 }}>
                                    <TextInput
                                        value={pinValue}
                                        onChangeText={(v) => setPinValue(v.replace(/\D/g, '').slice(0, 4))}
                                        keyboardType="number-pad"
                                        placeholder="••••"
                                        placeholderTextColor="#bbb"
                                        style={styles.input}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                                        <TouchableOpacity style={[styles.btn, { backgroundColor: C.primary }]} onPress={savePin}>
                                            <Text style={styles.btnText}>OK</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#E6EAF0' }]} onPress={() => { setPinTarget(null); setPinValue(''); }}>
                                            <Text style={[styles.btnText, { color: C.text }]}>Отмена</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.btn} onPress={() => { setPinTarget(s.id); setPinValue(''); }}>
                                    <Text style={styles.btnText}>{s.has_pin ? 'Сменить PIN' : 'Задать PIN'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Сертификаты</Text>
                <View style={styles.card}>
                    <TextInput
                        value={certForm.code}
                        onChangeText={(v) => setCertForm({ ...certForm, code: v })}
                        placeholder="Код (CERT-100)"
                        placeholderTextColor="#bbb"
                        style={styles.input}
                    />
                    <TextInput
                        value={certForm.amount}
                        onChangeText={(v) => setCertForm({ ...certForm, amount: v.replace(/\D/g, '') })}
                        keyboardType="number-pad"
                        placeholder="Сумма (сум)"
                        placeholderTextColor="#bbb"
                        style={styles.input}
                    />
                    <TouchableOpacity style={[styles.btn, { backgroundColor: C.primary, marginTop: 8 }]} onPress={createCert}>
                        <Text style={styles.btnText}>Создать сертификат</Text>
                    </TouchableOpacity>
                </View>
                {certs.map((c) => (
                    <View key={c.id} style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.label}>{c.code}</Text>
                            <Text style={styles.mutedText}>
                                {Number(c.balance).toLocaleString()} сум
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    content: { padding: 16, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: '800', color: C.text },
    subtitle: { fontSize: 13, color: C.muted, marginTop: 4, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: C.muted, marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
    card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
    cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    label: { fontSize: 15, fontWeight: '600', color: C.text },
    mutedText: { fontSize: 13, color: C.muted, marginTop: 2 },
    linkBox: { marginTop: 12, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12 },
    linkText: { color: '#16A34A', fontSize: 13 },
    pairRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    qr: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#fff' },
    input: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8, color: C.text },
    btn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
