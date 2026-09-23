import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Animated,
    Easing,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTelegram } from '../../telegram/TelegramProvider';
import { openTelegramLink } from '../../telegram/openLink';
import RegisterScreen from '../common/RegisterScreen';
import { BUILD_ID } from '../../buildInfo';

// Work-бот смены. Отдельной настройки нет — тот же бот, что шлёт отчёты.
const WORK_BOT_URL = 'https://t.me/WaitlyWork_Bot';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    telegram: '#0088cc',
    border: '#e8e4e4',
};

/**
 * TWA-вход персонала в дизайне LoginScreen (гитхаб-канон):
 * логотип с анимацией, градиентные кнопки, карточки ввода.
 * Фазы: login (тихий по initData) → phone (номер → сверка с базой) →
 * tg (явный вход через Telegram: Поделиться номером) →
 * credentials (номер+пароль) / register (инвайт) → дальше табы по роли.
 */
export default function HostessEntryGate() {
    const { telegramAuth, login } = useAuth();
    const { initData, isTelegramEnv, webAppVersion, tgPlatform, requestContact } = useTelegram() || {};
    const [phase, setPhase] = useState('login');
    const [error, setError] = useState('');
    const [phone, setPhone] = useState('+998');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [busy, setBusy] = useState(false);
    const [attempt, setAttempt] = useState(0);

    /* ── анимация логотипа (как в LoginScreen) ── */
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1, duration: 600, useNativeDriver: true,
            }),
        ]).start();
        Animated.timing(contentOpacity, {
            toValue: 1, duration: 500, delay: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        let active = true;
        if (!isTelegramEnv || !initData) {
            if (active) {
                setError('Откройте эту страницу из Telegram work-бота');
                setPhase('error');
            }
            return () => { active = false; };
        }
        setBusy(true);
        telegramAuth(initData)
            .then((res) => {
                if (!active) return;
                if (res && res.needsPhoneLink) {
                    // Этот Telegram ни к кому не привязан — СРАЗУ предлагаем
                    // поделиться номером (одна лёгкая регистрация), а не экран ошибки:
                    // номер из бота подберётся через pending_contact (живёт 24ч).
                    setError('');
                    setPhase('tg');
                } else if (res && res.role === 'GUEST') {
                    setPhase('guest');
                }
                // Иначе user в контексте — дальше AppNavigator сам.
            })
            .catch(() => {
                if (active) {
                    setError('Не удалось войти. Проверьте интернет и откройте смену заново из бота.');
                    setPhase('error');
                }
            })
            .finally(() => { if (active) setBusy(false); });
        return () => { active = false; };
    }, [initData, isTelegramEnv, attempt]);


    const submitCredentials = async () => {
        const value = phone.trim();
        if (value.replace(/\D/g, '').length < 7 || !password) {
            setFormError('Введите номер и пароль от вашего аккаунта');
            return;
        }
        setFormError('');
        setBusy(true);
        try {
            const userData = await login(value, password);
            if (userData && userData.role === 'GUEST') {
                setPhase('guest');
            }
            // user в контексте — дальше AppNavigator сам.
        } catch (e) {
            const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || '';
            setError(`Не получилось войти: ${msg || 'проверьте номер и пароль'}`);
            setPhase('error');
        } finally {
            setBusy(false);
        }
    };

    const submitTelegram = async () => {
        if (typeof requestContact !== 'function') {
            setError('Telegram недоступен. Войдите по номеру и паролю.');
            setPhase('error');
            return;
        }
        setBusy(true);
        const withTimeout = (promise, ms) => Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
        ]);
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        try {
            let shared = false;
            try {
                shared = await withTimeout(requestContact(), 30000);
            } catch {
                setError('Telegram не ответил за 30 секунд. Войдите по номеру и паролю ниже.');
                setPhase('error');
                return;
            }
            if (!shared) {
                // Диалог отклонён или клиент не отдал номер — не молчим.
                setError('Номер не shared. Войдите по номеру и паролю ниже.');
                setPhase('error');
                return;
            }
            // Номер ушёл боту — вебхук кладёт его в кэш с задержкой, опрашиваем.
            let res = null;
            let lastErr = null;
            for (let i = 0; i < 5; i += 1) {
                try {
                    res = await telegramAuth(initData);
                    lastErr = null;
                    break;
                } catch (e) {
                    lastErr = e;
                    await sleep(2000);
                }
            }
            if (res && (res.needsPhoneLink || res.role === 'GUEST')) {
                setError('Этот Telegram не привязан к персоналу. Войдите по номеру и паролю ниже.');
                setPhase('error');
            } else if (!res) {
                const msg = lastErr?.response?.data?.error || lastErr?.response?.data?.message || '';
                setError(msg || 'Не получилось войти через Telegram. Войдите по номеру и паролю ниже.');
                setPhase('error');
            }
            // res === true → user в контексте, AppNavigator увезёт дальше сам.
        } finally {
            setBusy(false);
        }
    };

    const logo = (subtitle) => (
        <Animated.View style={[styles.logoArea, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <LinearGradient
                colors={[COLORS.primary, '#ff8a8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoCircle}
            >
                <MaterialIcons name="restaurant" size={48} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.appName}>Waitly</Text>
            <Text style={styles.appSubtitle}>{subtitle}</Text>
        </Animated.View>
    );

    const gradientBtn = (label, onPress) => (
        <TouchableOpacity
            style={[styles.submitBtn, busy && { opacity: 0.6 }]}
            onPress={onPress}
            disabled={busy}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={[COLORS.primary, '#ff8a8a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
            >
                {busy ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Text style={styles.submitBtnText}>{label}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );

    const phoneInput = (placeholder, value, onChange, extra) => (
        <View style={styles.inputGroup}>
            <View style={styles.inputBox}>
                <MaterialIcons name="phone" size={20} color={COLORS.textMuted} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    {...extra}
                />
            </View>
        </View>
    );

    /* ── регистрация по инвайту — та же страница из приложения ── */
    if (phase === 'register') {
        return <RegisterScreen navigation={{ goBack: () => setPhase('error') }} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.content}>
                    {logo('Смена')}

                    <Animated.View style={[styles.formWrapper, { opacity: contentOpacity }]}>
                        {phase === 'login' && (
                            <>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.hint}>Входим…</Text>
                            </>
                        )}


                        {phase === 'credentials' && (
                            <>
                                <Text style={styles.formTitle}>Вход для персонала</Text>
                                {phoneInput('+998901234567', phone, setPhone)}
                                <View style={styles.inputGroup}>
                                    <View style={styles.inputBox}>
                                        <MaterialIcons name="lock" size={20} color={COLORS.textMuted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Пароль"
                                            placeholderTextColor={COLORS.textMuted}
                                            secureTextEntry
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                    </View>
                                </View>
                                {!!formError && <Text style={styles.formError}>{formError}</Text>}
                                {gradientBtn('Войти', submitCredentials)}
                                <TouchableOpacity
                                    style={styles.registerLink}
                                    onPress={() => setPhase('register')}
                                >
                                    <Text style={styles.registerLinkText}>
                                        Нет аккаунта? <Text style={styles.registerLinkBold}>Регистрация по инвайту</Text>
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {phase === 'guest' && (
                            <>
                                <Text style={styles.formTitle}>Номер найден, но это гость</Text>
                                <Text style={styles.hint}>
                                    {phone.trim()} записан как гость, а не персонал — поэтому
                                    смены нет. Попросите владельца перевести номер в персонал
                                    или зарегистрируйтесь по инвайту.
                                </Text>
                                <TouchableOpacity
                                    style={styles.loginBtn}
                                    onPress={() => setPhase('register')}
                                >
                                    <MaterialIcons name="mail-outline" size={18} color={COLORS.textMuted} />
                                    <Text style={styles.loginBtnText}>Регистрация по инвайту</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.loginBtn}
                                    onPress={() => { setError(''); setFormError(''); setPassword(''); setPhase('credentials'); }}
                                >
                                    <MaterialIcons name="phone" size={18} color={COLORS.textMuted} />
                                    <Text style={styles.loginBtnText}>Другой номер</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {phase === 'tg' && (
                            <>
                                <Text style={styles.formTitle}>Вход через Telegram</Text>
                                <Text style={styles.hint}>
                                    Поделитесь номером здесь или в чате work-бота — это нужно один раз для входа.
                                    Номер из чата подходит в течение суток.
                                </Text>
                                <TouchableOpacity
                                    style={styles.telegramBtn}
                                    onPress={submitTelegram}
                                    disabled={busy}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[COLORS.telegram, '#0099dd']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.telegramBtnGradient}
                                    >
                                        {busy ? (
                                            <ActivityIndicator color={COLORS.white} />
                                        ) : (
                                            <>
                                                <MaterialIcons name="telegram" size={24} color={COLORS.white} />
                                                <Text style={styles.telegramBtnText}>Поделиться номером</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.loginBtn}
                                    onPress={() => { setError(''); setPassword(''); setPhase('credentials'); }}
                                >
                                    <MaterialIcons name="phone" size={18} color={COLORS.textMuted} />
                                    <Text style={styles.loginBtnText}>Войти по номеру и паролю</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {phase === 'error' && (
                            <>
                                <View style={styles.errorBox}>
                                    <MaterialIcons name="telegram" size={28} color={COLORS.telegram} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.errorTitle}>
                                            {isTelegramEnv ? 'Telegram без данных' : 'Откройте из Telegram'}
                                        </Text>
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                </View>
                                {isTelegramEnv ? (
                                    <Text style={styles.hint}>
                                        Вы в Telegram, но ваш клиент не передал данные для
                                        тихого входа (так бывает в десктопной версии).
                                        Войдите вручную — дальше всё как обычно.
                                    </Text>
                                ) : (
                                    <Text style={styles.hint}>
                                        Эта страница работает только внутри Telegram: откройте
                                        work-бота и нажмите кнопку меню «Смена».
                                    </Text>
                                )}
                                {!isTelegramEnv && (
                                    <TouchableOpacity
                                        style={styles.telegramBtn}
                                        onPress={() => openTelegramLink(WORK_BOT_URL)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={[COLORS.telegram, '#0099dd']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.telegramBtnGradient}
                                        >
                                            <MaterialIcons name="telegram" size={24} color={COLORS.white} />
                                            <Text style={styles.telegramBtnText}>Открыть work-бота</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.loginBtn}
                                    onPress={() => { setError(''); setPhase('tg'); }}
                                >
                                    <MaterialIcons name="telegram" size={18} color={COLORS.telegram} />
                                    <Text style={[styles.loginBtnText, { color: COLORS.telegram }]}>Продолжить с Telegram</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.loginBtn}
                                    onPress={() => { setError(''); setPassword(''); setPhase('credentials'); }}
                                >
                                    <MaterialIcons name="phone" size={18} color={COLORS.textMuted} />
                                    <Text style={styles.loginBtnText}>Войти по номеру и паролю</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.loginBtn}
                                    onPress={() => { setError(''); setPhase('login'); setAttempt((a) => a + 1); }}
                                >
                                    <MaterialIcons name="refresh" size={18} color={COLORS.textMuted} />
                                    <Text style={styles.loginBtnText}>Попробовать снова</Text>
                                </TouchableOpacity>
                                <Text style={styles.debug}>
                                    tg:{isTelegramEnv ? 'да' : 'нет'} · init:{initData ? 'есть' : 'нет'}
                                    {tgPlatform ? ` · ${tgPlatform}` : ''}{webAppVersion ? ` · v${webAppVersion}` : ''}
                                </Text>
                            </>
                        )}
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    logoArea: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.textDark,
        letterSpacing: -1,
    },
    appSubtitle: {
        fontSize: 15,
        color: COLORS.textMuted,
        marginTop: 4,
        fontWeight: '500',
    },
    formWrapper: {
        gap: 16,
        alignItems: 'stretch',
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textDark,
        textAlign: 'center',
    },
    formError: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    inputGroup: {
        gap: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.textDark,
    },
    submitBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    submitBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitBtnText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
    registerLink: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    registerLinkText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    registerLinkBold: {
        fontWeight: '700',
        color: COLORS.primary,
    },
    telegramBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: COLORS.telegram,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    telegramBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    telegramBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '800',
    },
    loginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    loginBtnText: {
        color: COLORS.textMuted,
        fontSize: 16,
        fontWeight: '600',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    errorText: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    debug: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});
