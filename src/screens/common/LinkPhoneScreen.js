import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
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
};

export default function LinkPhoneScreen() {
    const { telegramLink } = useAuth();
    const { initData } = useTelegram();
    const [phone, setPhone] = useState('+998');
    const [loading, setLoading] = useState(false);

    const handleLink = async () => {
        if (phone.length < 4) {
            Alert.alert('Ошибка', 'Введите номер телефона');
            return;
        }

        setLoading(true);
        try {
            await telegramLink(initData, phone);
        } catch (error) {
            const msg = error.response?.data?.detail
                || error.response?.data?.message
                || 'Пользователь с таким номером не найден';
            Alert.alert('Ошибка', msg);
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
                    <View style={styles.iconArea}>
                        <LinearGradient
                            colors={[COLORS.primary, '#ff8a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconCircle}
                        >
                            <MaterialIcons name="link" size={40} color={COLORS.white} />
                        </LinearGradient>
                        <Text style={styles.title}>Привязать Telegram</Text>
                        <Text style={styles.subtitle}>
                            Введите номер телефона, который привязан к вашему аккаунту в Waitly
                        </Text>
                    </View>

                    <View style={styles.formArea}>
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

                        <TouchableOpacity
                            style={[styles.linkBtn, loading && styles.linkBtnDisabled]}
                            onPress={handleLink}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#ff8a8a']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.linkBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.linkBtnText}>Привязать</Text>
                                        <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
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
    iconArea: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    formArea: {
        gap: 16,
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
    linkBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    linkBtnDisabled: {
        opacity: 0.7,
    },
    linkBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    linkBtnText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
});
