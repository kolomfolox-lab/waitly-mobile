import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#ff6b6b',
    primaryDark: '#e85d5d',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    danger: '#EE5A6F',
};

export default function LoginScreen() {
    const { login } = useAuth();
    const [phone, setPhone] = useState('+998');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Animations
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const formTranslateY = useRef(new Animated.Value(60)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(formTranslateY, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(formOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (phone.length < 4) {
            Alert.alert('Ошибка', 'Введите номер телефона');
            return;
        }
        if (password.length < 1) {
            Alert.alert('Ошибка', 'Введите пароль');
            return;
        }

        setLoading(true);
        try {
            await login(phone, password);
        } catch (error) {
            const msg = error.response?.data?.detail
                || error.response?.data?.message
                || error.response?.data?.non_field_errors?.[0]
                || 'Неверный номер телефона или пароль';
            Alert.alert('Ошибка входа', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Logo Area */}
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

                    {/* Login Form */}
                    <Animated.View style={[styles.formArea, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>
                        <Text style={styles.formTitle}>Вход в систему</Text>

                        {/* Phone Input */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIconBox}>
                                <MaterialIcons name="phone" size={20} color={COLORS.primary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Номер телефона"
                                placeholderTextColor={COLORS.textMuted}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIconBox}>
                                <MaterialIcons name="lock" size={20} color={COLORS.primary} />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Пароль"
                                placeholderTextColor={COLORS.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility' : 'visibility-off'}
                                    size={20}
                                    color={COLORS.textMuted}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#ff8a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.loginBtnText}>Войти</Text>
                                        <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Demo Hint */}
                        <View style={styles.hintBox}>
                            <MaterialIcons name="info-outline" size={16} color={COLORS.textMuted} />
                            <Text style={styles.hintText}>
                                Тестовый режим — введите любой номер и пароль
                            </Text>
                        </View>
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
    keyboardView: {
        flex: 1,
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
    formArea: {
        gap: 16,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 8,
        textAlign: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingHorizontal: 4,
        height: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    inputIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: COLORS.textDark,
        fontWeight: '500',
    },
    eyeBtn: {
        padding: 12,
    },
    loginBtn: {
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
    loginBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    loginBtnText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 8,
    },
    hintText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
});
