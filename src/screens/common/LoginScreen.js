import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
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
import { useTelegram } from '../../telegram/TelegramProvider';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    telegram: '#0088cc',
    border: '#e8e4e4',
};

export default function LoginScreen({ navigation }) {
    const { isTelegramEnv } = useTelegram();
    const { login } = useAuth();

    /* ── анимация ── */
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

    /* ── форма логина (если нет Telegram) ── */
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone.trim() || !password.trim()) {
            Alert.alert('Ошибка', 'Введите номер телефона и пароль');
            return;
        }
        setLoading(true);
        try {
            await login(phone.trim(), password);
        } catch (e) {
            const data = e?.response?.data;
            const msg = data?.error?.message || data?.detail || data?.message || 'Неверный логин или пароль';
            Alert.alert('Ошибка входа', msg);
        } finally {
            setLoading(false);
        }
    };

    /* ── Telegram-окружение: показываем кнопки ── */
    if (isTelegramEnv) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
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
                        <Text style={styles.appSubtitle}>Управление рестораном</Text>
                    </Animated.View>

                    <Animated.View style={[styles.actionArea, { opacity: contentOpacity }]}>
                        {/* Telegram — крупно */}
                        <TouchableOpacity
                            style={styles.telegramBtn}
                            onPress={() => navigation.navigate('LoginTelegram')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[COLORS.telegram, '#0099dd']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.telegramBtnGradient}
                            >
                                <MaterialIcons name="telegram" size={28} color={COLORS.white} />
                                <Text style={styles.telegramBtnText}>Продолжить с Telegram</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Логин — мелко */}
                        <TouchableOpacity
                            style={styles.loginBtn}
                            onPress={() => navigation.navigate('Auth')}
                        >
                            <MaterialIcons name="phone" size={18} color={COLORS.textMuted} />
                            <Text style={styles.loginBtnText}>Продолжить с логином</Text>
                        </TouchableOpacity>

                        <View style={styles.hintBox}>
                            <MaterialIcons name="info-outline" size={14} color={COLORS.textMuted} />
                            <Text style={styles.hintText}>Войдите или зарегистрируйтесь по приглашению</Text>
                        </View>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    /* ── Нет Telegram: форма логина сразу ── */
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.content}>
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
                        <Text style={styles.appSubtitle}>Войдите в аккаунт</Text>
                    </Animated.View>

                    <Animated.View style={[styles.formWrapper, { opacity: contentOpacity }]}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Номер телефона</Text>
                            <View style={styles.inputBox}>
                                <MaterialIcons name="phone" size={20} color={COLORS.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="+998901234567"
                                    placeholderTextColor={COLORS.textMuted}
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Пароль</Text>
                            <View style={styles.inputBox}>
                                <MaterialIcons name="lock" size={20} color={COLORS.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Введите пароль"
                                    placeholderTextColor={COLORS.textMuted}
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#ff8a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.submitBtnText}>Войти</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.registerLink}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.registerLinkText}>
                                Нет аккаунта? <Text style={styles.registerLinkBold}>Зарегистрироваться</Text>
                            </Text>
                        </TouchableOpacity>
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
        marginBottom: 48,
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
    actionArea: {
        gap: 20,
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
        paddingVertical: 22,
        gap: 12,
    },
    telegramBtnText: {
        color: COLORS.white,
        fontSize: 19,
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

    /* ── форма логина ── */
    formWrapper: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
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
        paddingVertical: 12,
    },
    registerLinkText: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    registerLinkBold: {
        fontWeight: '700',
        color: COLORS.primary,
    },
});
