/* global window */
import { Alert, Platform } from 'react-native';

/**
 * Диалоги, которые работают ВЕЗДЕ: натив, веб и Telegram Mini App.
 *
 * Грабли: react-native-web НЕ реализует Alert.alert (пустой no-op) —
 * все подтверждения (No-show, пересадка, принять смену) и ошибки в TWA
 * молча ничего не делают и выглядят «мёртвыми кнопками».
 *
 * Порядок: Telegram showPopup/showAlert (нативные диалоги в TWA, Bot API 6.2+)
 * → window.confirm/alert (веб) → Alert.alert (натив, там кнопки работают).
 */

function getWebApp() {
    try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            return window.Telegram.WebApp;
        }
    } catch {
        // ignore
    }
    return null;
}

/**
 * Подтверждение с двумя кнопками. Возвращает true, если юзер подтвердил.
 */
export async function confirmDialog(title, message, opts = {}) {
    const { okText = 'Да', cancelText = 'Нет', destructive = false } = opts;
    try {
        const WebApp = getWebApp();
        if (Platform.OS === 'web' && WebApp && typeof WebApp.showPopup === 'function') {
            const okBtn = { id: 'ok', text: okText };
            if (destructive) okBtn.type = 'destructive';
            const id = await new Promise((resolve) => {
                let done = false;
                const finish = (v) => {
                    if (done) return;
                    done = true;
                    try { WebApp.offEvent?.('popupClosed', onClose); } catch { /* ignore */ }
                    resolve(v);
                };
                const onClose = (e) => finish(e?.button_id ?? null);
                try { WebApp.onEvent?.('popupClosed', onClose); } catch { /* ignore */ }
                try {
                    WebApp.showPopup(
                        { title: title || '', message: message || '', buttons: [okBtn, { id: 'cancel', type: 'cancel', text: cancelText }] },
                        (bid) => finish(bid ?? null),
                    );
                } catch {
                    finish(null);
                }
                setTimeout(() => finish(null), 60000);
            });
            return id === 'ok';
        }
    } catch {
        // ignore → fallback ниже
    }
    if (Platform.OS === 'web') {
        try {
            return window.confirm([title, message].filter(Boolean).join('\n'));
        } catch {
            return false;
        }
    }
    return new Promise((resolve) => {
        try {
            Alert.alert(title, message, [
                { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
                { text: okText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
            ]);
        } catch {
            resolve(false);
        }
    });
}

/**
 * Информационное сообщение (без кнопок Да/Нет).
 */
export async function alertDialog(title, message) {
    const text = [title, message].filter(Boolean).join('\n');
    try {
        const WebApp = getWebApp();
        if (Platform.OS === 'web' && WebApp && typeof WebApp.showAlert === 'function') {
            await new Promise((resolve) => {
                try {
                    WebApp.showAlert(text, () => resolve());
                } catch {
                    resolve();
                }
            });
            return;
        }
    } catch {
        // ignore → fallback ниже
    }
    if (Platform.OS === 'web') {
        try {
            window.alert(text);
        } catch {
            // ignore
        }
        return;
    }
    try {
        Alert.alert(title, message);
    } catch {
        // ignore
    }
}
