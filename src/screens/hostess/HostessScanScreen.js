/* global window, requestAnimationFrame, cancelAnimationFrame */
import React, { useState, useRef, useEffect } from 'react';import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { resolveBookingQr, patchBooking, bookingArrived, bookingTurnover } from '../../api/hostess';
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
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const detectorRef = useRef(null);
    const scannedRef = useRef(false);
    // Нативный QR-сканер Telegram внутри TWA (Bot API 6.4 showScanQrPopup):
    // в WebView getUserMedia может быть недоступен — используем системный сканер.
    let tg = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        tg = useTelegram();
    } catch { tg = null; }
    const tgCanScan = !!(tg?.isTelegramEnv && typeof tg?.canScanQr === 'function' && tg.canScanQr());

    const scanViaTelegram = async () => {
        if (!tg || !tgCanScan) return;
        try { tg.haptic?.selection?.(); } catch { /* ignore */ }
        const text = await tg.scanQr();
        if (text && String(text).trim()) {
            scannedRef.current = true;
            resolve(String(text).trim());
        }
    };

    const resolve = async (raw) => {
        const value = String(raw || '').trim();
        if (!value || busy) return;
        setBusy(true);
        try {
            const booking = await resolveBookingQr(value);
            setFound(booking);
            setScanning(false);
            bookingTurnover(booking.id).then(setTurnover).catch(() => null);
        } catch (e) {
            const msg = e.response?.data?.error || 'QR недействителен';
            Alert.alert('Скан', msg);
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
        scannedRef.current = false;
        setScanning(true);
    };

    const seat = async () => {
        setBusy(true);
        try {
            await patchBooking(found.id, { status: 'SEATED', arrived_count: found.guest_count });
            Alert.alert('Готово', `Гость посажен за стол ${found.table_number}`);
            reset();
        } catch {
            Alert.alert('Ошибка', 'Не удалось посадить');
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
            Alert.alert('Ошибка', 'Не удалось отметить прибытие');
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Text style={styles.title}>Скан QR гостя</Text>
            {tgCanScan && !found && (
                <TouchableOpacity style={[styles.btn, styles.tgScanBtn]} onPress={scanViaTelegram} disabled={busy}>
                    <Text style={styles.btnText}>📷 Сканировать через Telegram</Text>
                </TouchableOpacity>
            )}
            {!found ? (
                <>
                    <View style={styles.frame}>
                        {Platform.OS === 'web' ? (
                            <video ref={videoRef} style={{ width: '100%', height: 240, borderRadius: 16, backgroundColor: '#1e293b' }} muted playsInline />
                        ) : CameraView && permission?.granted ? (
                            <CameraView
                                style={styles.camera}
                                barcodeScannerEnabled
                                onBarcodeScanned={onNativeBarcode}
                                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                            />
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
                        {busy && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />}
                    </View>
                    <View style={styles.manual}>
                        <Text style={styles.manualTitle}>или вставьте код из QR</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="WLY1.…"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={token}
                            onChangeText={setToken}
                        />
                        <TouchableOpacity style={styles.btn} onPress={() => resolve(token)} disabled={busy || !token.trim()}>
                            <Text style={styles.btnText}>Проверить</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.card}>
                    <Text style={styles.name}>{found.client_name}</Text>
                    <Text style={styles.sub}>
                        {found.client_phone_masked || found.client_phone}
                        {found.low_trusted ? ' · ⚠️ low-trusted' : ''}
                    </Text>
                    <Text style={styles.meta}>
                        Стол {found.table_number} · {(found.booking_time || '').slice(0, 5)} · {found.guest_count} гост.
                        {found.arrived_count ? ` · пришло ${found.arrived_count}` : ''}
                    </Text>
                    {found.deposit_status === 'HOLD' && (
                        <Text style={styles.dep}>💰 депозит {found.deposit_amount} (холд)</Text>
                    )}
                    {turnover && (
                        <Text style={styles.sub}>
                            {turnover.freeing_soon ? '⏳ стол скоро освобождается' : `Слот до ${turnover.ends_at.slice(11, 16)}`}
                        </Text>
                    )}
                    <Text style={[styles.status, { color: found.status === 'SEATED' ? COLORS.success : COLORS.warning }]}>
                        {found.status}
                    </Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.btn} onPress={seat} disabled={busy}>
                            <Text style={styles.btnText}>Посадить</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={arrivedOne} disabled={busy}>
                            <Text style={[styles.btnText, { color: COLORS.text }]}>+1 пришёл</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.close} onPress={reset}>
                        <Text style={styles.closeText}>Следующий гость</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
    title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 12 },
    frame: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#1e293b', minHeight: 240, justifyContent: 'center' },
    camera: { width: '100%', height: 280 },
    noCam: { alignItems: 'center', paddingVertical: 48, gap: 10 },
    hint: { color: COLORS.muted, textAlign: 'center', paddingHorizontal: 24 },
    camBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 8 },
    camBtnText: { color: '#fff', fontWeight: '700' },
    loader: { position: 'absolute', alignSelf: 'center' },
    manual: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginTop: 12 },
    manualTitle: { fontWeight: '700', marginBottom: 8, color: COLORS.text },
    input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 10 },
    btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', flex: 1 },
    tgScanBtn: { marginBottom: 12, backgroundColor: '#229ED9' },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    btnGhost: { backgroundColor: '#f1f5f9' },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginTop: 4 },
    name: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    sub: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
    meta: { fontSize: 15, color: COLORS.text, marginTop: 8 },
    dep: { fontSize: 14, fontWeight: '700', color: COLORS.success, marginTop: 6 },
    status: { fontWeight: '800', marginTop: 8 },
    row: { flexDirection: 'row', gap: 8, marginTop: 14 },
    close: { alignItems: 'center', paddingVertical: 12 },
    closeText: { color: COLORS.muted, fontWeight: '700' },
});
