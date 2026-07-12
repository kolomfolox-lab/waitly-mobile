import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#FFFFFF',
    text: '#1a1a2e',
    textMuted: '#94a3b8',
    border: '#e8e4e4',
};

export default function AuthScreen({ navigation }) {
    const { login } = useAuth();
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Вход</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>
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
                    </View>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.replace('Register')}
                    >
                        <Text style={styles.registerLinkText}>
                            Нет аккаунта? <Text style={styles.registerLinkBold}>Зарегистрироваться</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        justifyContent: 'center',
        flex: 1,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
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
        color: COLORS.text,
    },
    submitBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
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
        paddingVertical: 20,
    },
    registerLinkText: {
        fontSize: 15,
        color: COLORS.textMuted,
    },
    registerLinkBold: {
        fontWeight: '700',
        color: COLORS.primary,
    },
});
