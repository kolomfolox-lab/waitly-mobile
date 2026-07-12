import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTelegram } from '../../telegram/TelegramProvider';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    telegram: '#0088cc',
};

const POLL_INTERVAL = 2000;
const POLL_TIMEOUT = 20000;

export default function LoginTelegramScreen({ navigation }) {
    const { telegramAuth } = useAuth();
    const { initData, isTelegramEnv, WebApp } = useTelegram();
    const [state, setState] = useState('idle');
    const [pollCount, setPollCount] = useState(0);

    const pollLogin = useCallback(async () => {
        setState('polling');
        setPollCount(0);
        const start = Date.now();

        const tryLogin = async () => {
            const elapsed = Date.now() - start;
            if (elapsed >= POLL_TIMEOUT) {
                setState('timeout');
                return;
            }
            setPollCount(p => p + 1);
            try {
                const result = await telegramAuth(initData);
                if (result === true) {
                    setState('done');
                    return;
                }
            } catch (e) {
                // ignore, retry
            }
            setTimeout(tryLogin, POLL_INTERVAL);
        };

        setTimeout(tryLogin, 1000);
    }, [initData, telegramAuth]);

    const handleShareContact = async () => {
        if (!WebApp || !isTelegramEnv) return;
        setState('requesting');
        try {
            const shared = await WebApp.requestContact();
            if (shared === true) {
                await pollLogin();
            } else {
                setState('idle');
            }
        } catch (e) {
            setState('idle');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
            </View>
            <View style={styles.content}>
                {state === 'polling' || state === 'requesting' ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>
                            {state === 'requesting'
                                ? 'Запрос номера...'
                                : `Проверка... (${pollCount}s)`}
                        </Text>
                        <Text style={styles.loadingHint}>
                            {state === 'polling' && 'Нажмите «Поделиться» в диалоге Telegram'}
                        </Text>
                    </View>
                ) : null}

                {state === 'timeout' ? (
                    <View style={styles.errorBox}>
                        <MaterialIcons name="error-outline" size={48} color={COLORS.primary} />
                        <Text style={styles.errorTitle}>Не удалось получить номер</Text>
                        <Text style={styles.errorText}>
                            Попробуйте ещё раз или вернитесь в чат с ботом и нажмите кнопку «Поделиться номером»
                        </Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={handleShareContact}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#ff8a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.retryBtnGradient}
                            >
                                <MaterialIcons name="refresh" size={20} color={COLORS.white} />
                                <Text style={styles.retryBtnText}>Попробовать снова</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {state === 'idle' && isTelegramEnv ? (
                    <View style={styles.telegramBox}>
                        <LinearGradient
                            colors={['rgba(0,136,204,0.08)', 'rgba(0,136,204,0.02)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.telegramPromo}
                        >
                            <MaterialIcons name="smartphone" size={40} color={COLORS.telegram} />
                            <Text style={styles.telegramPromoTitle}>Вход через Telegram</Text>
                            <Text style={styles.telegramPromoText}>
                                Нажмите кнопку ниже, чтобы поделиться номером телефона через Telegram
                            </Text>
                        </LinearGradient>
                        <TouchableOpacity
                            style={styles.shareBtn}
                            onPress={handleShareContact}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[COLORS.telegram, '#0099dd']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shareBtnGradient}
                            >
                                <MaterialIcons name="telegram" size={22} color={COLORS.white} />
                                <Text style={styles.shareBtnText}>Поделиться номером</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <View style={styles.hintBox}>
                            <MaterialIcons name="info-outline" size={14} color={COLORS.textMuted} />
                            <Text style={styles.hintText}>
                                Нужно всего один раз — для входа в приложение
                            </Text>
                        </View>
                    </View>
                ) : state === 'idle' && !isTelegramEnv ? (
                    <View style={styles.webFallback}>
                        <MaterialIcons name="open-in-browser" size={40} color={COLORS.textMuted} />
                        <Text style={styles.webFallbackText}>
                            Откройте эту страницу в Telegram
                        </Text>
                    </View>
                ) : null}
            </View>
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
        paddingTop: 14,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    loadingBox: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    loadingText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    loadingHint: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    errorBox: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 12,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    errorText: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    retryBtn: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    retryBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    retryBtnText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
    telegramBox: {
        gap: 16,
    },
    telegramPromo: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
        borderRadius: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,136,204,0.12)',
    },
    telegramPromoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    telegramPromoText: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    shareBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.telegram,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    shareBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 10,
    },
    shareBtnText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    hintText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    webFallback: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    webFallbackText: {
        fontSize: 16,
        color: COLORS.textMuted,
        fontWeight: '600',
        textAlign: 'center',
    },
});
