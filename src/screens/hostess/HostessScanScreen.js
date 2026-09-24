/* global window, requestAnimationFrame, cancelAnimationFrame */
import React, { useState, useRef, useEffect, useCallback } from 'react';import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, Platform, Animated, Easing, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { resolveBookingQr, patchBooking, bookingArrived, bookingTurnover } from '../../api/hostess';
import { alertDialog } from '../../utils/dialog';
import { useTelegram } from '../../telegram/TelegramProvider';

const COLORS = {
    primary: '#ff6b6b',
    background: '#0f172a',
    card: '#FFFFFF',
    text: '#0f172a',
    muted: '#94a3b8',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
};

let CameraView = null;
let useCameraPermissions = null;
if (Platform.OS !== 'web') {
    try {
        const cam = require('expo-camera');
        CameraView = cam.CameraView;
        useCameraPermissions = cam.useCameraPermissions;
    } catch { /* камера недоступна */ }
}

export default function HostessScanScreen() {
    const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, null];
    const [token, setToken] = useState('');
    const [busy, setBusy] = useState(false);
    const [found, setFound] = useState(null);
    const [turnover, setTurnover] = useState(null);
    const [scanning, setScanning] = useState(true);
    const [scanError, setScanError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);
    const scannedRef = useRef(false);
    const scanAnim = useRef(new Animated.Value(0)).current;

    // Лазерная линия в рамке: бегает пока идёт сканирование.
    useEffect(() => {
        if (!scanning || found) return undefined;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: false }),
                Animated.timing(scanAnim, { toValue: 0, duration: 1600, easing: Easing.linear, useNativeDriver: false }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [scanning, found, scanAnim]);

    // Возврат на вкладку — камера снова сама сканирует (без лишних тапов).
    useFocusEffect(useCallback(() => {
        if (!found) {
            scannedRef.current = false;
            setScanning(true);
        }
        return undefined;
    }, [found]));
    // Нативный QR-сканер Telegram внутри TWA (Bot API 6.4 showScanQrPopup):
    // в WebView getUserMedia может быть недоступен — используем системный сканер.
    let tg = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        tg = useTelegram();
    } catch { tg = null; }
    const tgCanScan = !!(tg?.isTelegramEnv && typeof tg?.canScanQr === 'function' && tg.canScanQr());

    // Сканеры часто отдают текст с мусором (переносы строк, URL-обёртка) —
    // вытаскиваем токен WLY1.<id>.<exp>.<sig>, иначе шлём как есть.
    const extractToken = (raw) => {
        const v = String(raw || '').trim();
        if (!v) return '';
        const m = v.match(/WLY1\.[A-Za-z0-9_-]+\.\d+\.[A-Za-z0-9_-]+/);
        return m ? m[0] : v;
    };

    const scanViaTelegram = async () => {
        if (!tg || !tgCanScan) return;
        try { tg.haptic?.selection?.(); } catch { /* ignore */ }
        setScanError('');
        const text = await tg.scanQr();
        if (text && String(text).trim()) {
            scannedRef.current = true;
            resolve(String(text).trim());
        }
    };

    // Вставка из буфера: длинный токен вручную не набить, а камера
    // в WebView/старом клиенте может отсутствовать вовсе.
    const pasteFromClipboard = async () => {
        setScanError('');
        try {
            const WebApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
            if (WebApp && typeof WebApp.readTextFromClipboard === 'function') {
                const text = await new Promise((resolveClip) => {
                    let done = false;
                    const finish = (v) => { if (!done) { done = true; resolveClip(v); } };
                    try {
                        WebApp.onEvent?.('clipboardTextReceived', (e) => finish(e?.data || ''));
                    } catch { /* ignore */ }
                    try {
                        WebApp.readTextFromClipboard((t) => finish(typeof t === 'string' ? t : ''));
                    } catch { finish(''); }
                    setTimeout(() => finish(''), 8000);
                });
                if (text && text.trim()) {
                    setToken(extractToken(text));
                    return;
                }
            }
            if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    setToken(extractToken(text));
                    return;
                }
            }
            setScanError('Буфер пуст или недоступен — введите код вручную');
        } catch {
            setScanError('Не получилось прочитать буфер — введите код вручную');
        }
    };

    const resolve = async (raw) => {
        const value = extractToken(raw);
        if (!value || busy) return;
        setBusy(true);
        setScanError('');
        try {
            const booking = await resolveBookingQr(value);
            setFound(booking);
            setScanning(false);
            try { tg?.haptic?.notification?.('success'); } catch { /* ignore */ }
            bookingTurnover(booking.id).then(setTurnover).catch(() => null);
        } catch (e) {
            const msg = e.response?.data?.error || 'QR недействителен';
            setScanError(msg);
            await alertDialog('Скан', msg);
            scannedRef.current = false;
        } finally {
            setBusy(false);
        }
    };

    // Web: живая камера через BarcodeDetector (как в POS PairPage).
    useEffect(() => {
        if (Platform.OS !== 'web' || !scanning || found) return undefined;
        let active = true;
        let raf = 0;
        const start = async () => {
            try {
                const W = typeof window !== 'undefined' ? window : null;
                if (!W?.BarcodeDetector) return;
                detectorRef.current = new W.BarcodeDetector({ formats: ['qr_code'] });
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (!active) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(() => null);
                }
                const tick = async () => {
                    if (!active || scannedRef.current || !videoRef.current) return;
                    try {
                        const codes = await detectorRef.current.detect(videoRef.current);
                        if (codes?.length && codes[0].rawValue) {
                            scannedRef.current = true;
                            resolve(codes[0].rawValue);
                            return;
                        }
                    } catch { /* кадр не читается */ }
                    raf = requestAnimationFrame(tick);
                };
                raf = requestAnimationFrame(tick);
            } catch {
                // нет камеры — только ручной ввод
            }
        };
        start();
        return () => {
            active = false;
            cancelAnimationFrame(raf);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
    }, [scanning, found]);

    const onNativeBarcode = ({ data }) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        resolve(data);
    };

    const reset = () => {
        setFound(null);
        setTurnover(null);
        setToken('');
        setScanError('');
        scannedRef.current = false;
        setScanning(true);
    };

    const seat = async () => {
        setBusy(true);
        try {
            await patchBooking(found.id, { status: 'SEATED', arrived_count: found.guest_count });
            await alertDialog('Готово', `Гость посажен за стол ${found.table_number}`);
            reset();
        } catch {
            await alertDialog('Ошибка', 'Не удалось посадить');
        } finally {
            setBusy(false);
        }
    };

    const arrivedOne = async () => {
        setBusy(true);
        try {
            const updated = await bookingArrived(found.id, 1);
            setFound(updated);
        } catch {
            await alertDialog('Ошибка', 'Не удалось отметить прибытие');
        } finally {
            setBusy(false);
        }
    };

    const scanLineTop = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 204] });
    const canShowCamera = Platform.OS === 'web' || (CameraView && permission?.granted);

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Скан QR гостя</Text>
            <Text style={styles.subtitle}>
                {found ? 'Данные гостя из брони' : 'Наведите камеру на QR — данные подтянутся сами'}
            </Text>
            {!found ? (
                <>
                    <View style={styles.cameraBox}>
                        {canShowCamera ? (
                            <>
                                {Platform.OS === 'web' ? (
                                    <video ref={videoRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                                ) : (
                                    <CameraView
                                        style={StyleSheet.absoluteFill}
                                        barcodeScannerEnabled
                                        onBarcodeScanned={onNativeBarcode}
                                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                                    />
                                )}
                                <View style={styles.overlay} pointerEvents="none">
                                    <View style={styles.maskTop} />
                                    <View style={styles.maskRow}>
                                        <View style={styles.maskSide} />
                                        <View style={styles.cutout}>
                                            <View style={[styles.corner, styles.cornerTL]} />
                                            <View style={[styles.corner, styles.cornerTR]} />
                                            <View style={[styles.corner, styles.cornerBL]} />
                                            <View style={[styles.corner, styles.cornerBR]} />
                                            <Animated.View style={[styles.scanLine, { top: scanLineTop }]} />
                                        </View>
                                        <View style={styles.maskSide} />
                                    </View>
                                    <View style={styles.maskBottom}>
                                        <Text style={styles.overlayHint}>QR гостя — в рамку</Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.noCam}>
                                <MaterialIcons name="qr-code-scanner" size={56} color={COLORS.muted} />
                                <Text style={styles.hint}>Камера недоступна — введите код вручную</Text>
                                {Platform.OS !== 'web' && requestPermission && (
                                    <TouchableOpacity style={styles.camBtn} onPress={requestPermission}>
                                        <Text style={styles.camBtnText}>Разрешить камеру</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        {busy && (
                            <View style={styles.loaderWrap}>
                                <ActivityIndicator size="large" color="#fff" />
                            </View>
                        )}
                    </View>
                    {!!scanError && <Text style={styles.scanError}>{scanError}</Text>}
                    {tgCanScan && (
                        <TouchableOpacity style={[styles.btn, styles.tgScanBtn]} onPress={scanViaTelegram} disabled={busy}>
                            <Text style={styles.btnText}>📷 Сканировать через Telegram</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.manual}>
                        <Text style={styles.manualTitle}>Нет камеры? Введите код</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="WLY1.…"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={token}
                            onChangeText={(v) => { setToken(v); if (scanError) setScanError(''); }}
                        />
                        <View style={styles.row}>
                            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={pasteFromClipboard} disabled={busy}>
                                <Text style={[styles.btnText, { color: COLORS.text }]}>Вставить</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btn} onPress={() => resolve(token)} disabled={busy || !token.trim()}>
                                <Text style={styles.btnText}>Проверить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            ) : (
                <GuestCard
                    found={found}
                    turnover={turnover}
                    busy={busy}
                    onSeat={seat}
                    onArrived={arrivedOne}
                    onNext={reset}
                />
            )}
            </ScrollView>
        </SafeAreaView>
    );
}

function GuestCard({ found, turnover, busy, onSeat, onArrived, onNext }) {
    const initial = ((found.client_name || 'Г').trim().slice(0, 1) || 'Г').toUpperCase();
    const st = String(found.status || '');
    const pill = st === 'SEATED'
        ? { label: 'Сидит', fg: '#1d4ed8' }
        : st === 'CONFIRMED'
            ? { label: 'Подтверждена', fg: '#15803d' }
            : st === 'PENDING'
                ? { label: 'Ожидает', fg: '#92400e' }
                : { label: st, fg: COLORS.muted };
    const rows = [
        { icon: 'event-seat', text: `Стол ${found.table_number}` },
        { icon: 'access-time', text: `Сегодня · ${(found.booking_time || '').slice(0, 5)}` },
        {
            icon: 'people',
            text: `${found.guest_count} гост.` + (found.arrived_count ? ` · пришло ${found.arrived_count}` : ''),
        },
    ];
    if (found.deposit_status === 'HOLD') {
        rows.push({ icon: 'payments', text: `Депозит ${found.deposit_amount} (холд)` });
    }
    if (turnover) {
        rows.push({
            icon: 'hourglass-empty',
            text: turnover.freeing_soon ? 'Стол скоро освобождается' : `Слот до ${(turnover.ends_at || '').slice(11, 16)}`,
        });
    }
    return (
        <View style={styles.guestCard}>
            <LinearGradient colors={['#ff6b6b', '#ff8a5c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.guestHead}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.guestHeadMain}>
                    <Text style={styles.guestName}>{found.client_name}</Text>
                    <Text style={styles.guestPhone}>{found.client_phone_masked || found.client_phone}</Text>
                </View>
                <View style={styles.statusPill}>
                    <Text style={[styles.statusPillText, { color: pill.fg }]}>{pill.label}</Text>
                </View>
            </LinearGradient>
            <View style={styles.guestBody}>
                {found.low_trusted && (
                    <Text style={styles.lowTrusted}>⚠️ low-trusted гость — проверьте оплату</Text>
                )}
                {rows.map((r, i) => (
                    <View key={i} style={styles.infoRow}>
                        <MaterialIcons name={r.icon} size={18} color={COLORS.muted} />
                        <Text style={styles.infoText}>{r.text}</Text>
                    </View>
                ))}
                {!!found.occasion && <Text style={styles.note}>🎉 {found.occasion}</Text>}
                {!!found.notes && <Text style={styles.note}>📝 {found.notes}</Text>}
                <View style={styles.row}>
                    <TouchableOpacity style={styles.seatBtn} onPress={onSeat} disabled={busy}>
                        <Text style={styles.seatBtnText}>Посадить за стол {found.table_number}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onArrived} disabled={busy}>
                    <Text style={[styles.btnText, { color: COLORS.text }]}>+1 пришёл</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.close} onPress={onNext}>
                    <MaterialIcons name="refresh" size={16} color={COLORS.muted} />
                    <Text style={styles.closeText}>Следующий гость</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 24, fontWeight: '800', color: '#fff' },
    subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 4, marginBottom: 14 },
    // --- сканер ---
    cameraBox: { height: 400, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
    overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'stretch' },
    maskTop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.62)' },
    maskRow: { height: 230, flexDirection: 'row' },
    maskSide: { flex: 1, backgroundColor: 'rgba(2,6,23,0.62)' },
    maskBottom: { flex: 1, backgroundColor: 'rgba(2,6,23,0.62)', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 14 },
    cutout: { width: 230, height: 230 },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#fff' },
    cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
    scanLine: {
        position: 'absolute', left: 14, right: 14, height: 3, borderRadius: 2,
        backgroundColor: '#4ade80',
        shadowColor: '#4ade80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8,
    },
    overlayHint: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
    noCam: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10, backgroundColor: '#1e293b' },
    hint: { color: COLORS.muted, textAlign: 'center', paddingHorizontal: 24 },
    camBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 8 },
    camBtnText: { color: '#fff', fontWeight: '700' },
    loaderWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.45)' },
    scanError: { color: '#fda4af', fontWeight: '700', fontSize: 13, marginTop: 10 },
    tgScanBtn: { marginTop: 12, backgroundColor: '#229ED9' },
    manual: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginTop: 12 },
    manualTitle: { fontWeight: '800', marginBottom: 8, color: COLORS.text, fontSize: 15 },
    input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 10 },
    btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', flex: 1 },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    btnGhost: { backgroundColor: '#f1f5f9' },
    row: { flexDirection: 'row', gap: 8, marginTop: 4 },
    // --- карточка гостя ---
    guestCard: { backgroundColor: COLORS.card, borderRadius: 24, overflow: 'hidden', marginTop: 4 },
    guestHead: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 12 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
    guestHeadMain: { flex: 1 },
    guestName: { color: '#fff', fontSize: 20, fontWeight: '900' },
    guestPhone: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 2, fontWeight: '600' },
    statusPill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    statusPillText: { fontSize: 12, fontWeight: '800' },
    guestBody: { padding: 18, gap: 2 },
    lowTrusted: { color: COLORS.danger, fontWeight: '700', fontSize: 13, marginBottom: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
    infoText: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
    note: { fontSize: 13, color: COLORS.muted, marginTop: 6 },
    seatBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flex: 1, marginTop: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
    seatBtnText: { color: '#fff', fontWeight: '900', fontSize: 17 },
    close: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
    closeText: { color: COLORS.muted, fontWeight: '700', fontSize: 14 },
});
