import React, { useState, useRef } from 'react';
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
    Animated,
    Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { validateInvite, uploadPhoto } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';
import InitialsAvatar from '../../components/InitialsAvatar';

const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#FFFFFF',
    text: '#1a1a2e',
    textMuted: '#94a3b8',
    border: '#e8e4e4',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
};

const STEPS = ['Код', 'Имя', 'Телефон', 'Пароль'];

function getPasswordScore(pw) {
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[a-z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score;
}

function getPasswordLabel(score) {
    if (score <= 1) return { label: 'Слабый', color: COLORS.danger, pct: 20 };
    if (score <= 3) return { label: 'Средний', color: COLORS.warning, pct: 45 };
    if (score <= 4) return { label: 'Хороший', color: '#3b82f6', pct: 70 };
    return { label: 'Надёжный', color: COLORS.success, pct: 100 };
}

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();

    const [step, setStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    /* Поля */
    const [inviteCode, setInviteCode] = useState('');
    const [inviteValid, setInviteValid] = useState(null);
    const [inviteData, setInviteData] = useState(null);
    const [checkingInvite, setCheckingInvite] = useState(false);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [photoUri, setPhotoUri] = useState(null);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [loading, setLoading] = useState(false);

    const passwordScore = getPasswordScore(password);
    const pwStrength = getPasswordLabel(passwordScore);

    const animateTo = (nextStep) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setStep(nextStep);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();
        });
    };

    const handleValidate = async () => {
        if (!inviteCode.trim()) return;
        setCheckingInvite(true);
        setInviteValid(null);
        try {
            const result = await validateInvite(inviteCode.trim());
            if (result.valid) {
                setInviteValid(true);
                setInviteData(result);
                setTimeout(() => animateTo(1), 400);
            } else {
                setInviteValid(false);
            }
        } catch {
            setInviteValid(false);
        } finally {
            setCheckingInvite(false);
        }
    };

    const handleNextName = () => {
        if (!fullName.trim()) { Alert.alert('Ошибка', 'Введите имя и фамилию'); return; }
        animateTo(2);
    };

    const handleNextPhone = () => {
        if (!phone.trim()) { Alert.alert('Ошибка', 'Введите номер телефона'); return; }
        animateTo(3);
    };

    const handleNextPassword = () => {
        if (!password.trim()) { Alert.alert('Ошибка', 'Придумайте пароль'); return; }
        if (password !== passwordConfirm) { Alert.alert('Ошибка', 'Пароли не совпадают'); return; }
        if (password.length < 6) { Alert.alert('Ошибка', 'Пароль должен быть минимум 6 символов'); return; }
        handleRegister();
    };

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Доступ запрещён', 'Разрешите доступ к галерее в настройках');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });
        if (!result.canceled && result.assets?.length) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Доступ запрещён', 'Разрешите доступ к камере в настройках');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });
        if (!result.canceled && result.assets?.length) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const showPhotoPicker = () => {
        Alert.alert('Фото профиля', 'Выберите источник', [
            { text: 'Камера', onPress: takePhoto },
            { text: 'Галерея', onPress: pickPhoto },
            { text: 'Отмена', style: 'cancel' },
        ]);
    };

    const handleRegister = async () => {
        setLoading(true);
        try {
            await register({
                invite_code: inviteCode.trim(),
                phone_number: phone.trim(),
                password,
                full_name: fullName.trim(),
            });
            if (photoUri) {
                try {
                    await uploadPhoto(photoUri);
                } catch (e) {
                    // photo upload failed — not critical
                }
            }
        } catch (e) {
            const data = e?.response?.data;
            const msg = data?.error?.message || data?.detail || data?.message || Object.values(data || {}).flat().join(', ') || 'Ошибка регистрации';
            Alert.alert('Ошибка', msg);
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
                <View key={s} style={styles.stepItem}>
                    <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                        <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>
                            {i + 1}
                        </Text>
                    </View>
                    <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
                    {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
                </View>
            ))}
        </View>
    );

    const renderStep0 = () => (
        <Animated.View style={{ opacity: fadeAnim, gap: 20 }}>
            <Text style={styles.stepTitle}>Код приглашения</Text>
            <Text style={styles.stepDesc}>Введите код, который выдал администратор ресторана</Text>

            <View style={styles.inviteBox}>
                <MaterialIcons name="vpn-key" size={24} color={inviteValid === true ? COLORS.success : inviteValid === false ? COLORS.danger : COLORS.textMuted} />
                <TextInput
                    style={styles.inviteInput}
                    placeholder="XXXXXX"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                    value={inviteCode}
                    onChangeText={(v) => { setInviteCode(v); setInviteValid(null); }}
                />
                {checkingInvite && <ActivityIndicator size="small" color={COLORS.primary} />}
                {inviteValid === true && <MaterialIcons name="check-circle" size={22} color={COLORS.success} />}
                {inviteValid === false && <MaterialIcons name="cancel" size={22} color={COLORS.danger} />}
            </View>

            {inviteValid === true && inviteData && (
                <View style={styles.inviteSuccess}>
                    <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
                    <Text style={styles.inviteSuccessText}>
                        {inviteData.restaurant?.name} · {inviteData.role === 'WAITER' ? 'Официант' : inviteData.role}
                    </Text>
                </View>
            )}
            {inviteValid === false && (
                <Text style={styles.inviteErrorText}>Неверный или просроченный код</Text>
            )}

            <TouchableOpacity
                style={[styles.actionBtn, (!inviteCode.trim() || checkingInvite) && { opacity: 0.5 }]}
                onPress={handleValidate}
                disabled={!inviteCode.trim() || checkingInvite}
            >
                <LinearGradient
                    colors={[COLORS.primary, '#ff8a8a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                >
                    <Text style={styles.actionBtnText}>Проверить код</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep1 = () => (
        <Animated.View style={{ opacity: fadeAnim, gap: 20 }}>
            <Text style={styles.stepTitle}>Ваше имя</Text>
            <Text style={styles.stepDesc}>Как к вам обращаться?</Text>

            <View style={styles.avatarPickerRow}>
                <TouchableOpacity onPress={showPhotoPicker} style={styles.avatarPickerBtn}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.avatarPreview} />
                    ) : (
                        <InitialsAvatar name={fullName || '?'} size={72} />
                    )}
                    <View style={styles.avatarBadge}>
                        <MaterialIcons name="camera-alt" size={14} color={COLORS.white} />
                    </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <View style={styles.inputBox}>
                        <MaterialIcons name="person" size={20} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="Иван Иванов"
                            placeholderTextColor={COLORS.textMuted}
                            value={fullName}
                            onChangeText={setFullName}
                            autoFocus
                        />
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.actionBtn, !fullName.trim() && { opacity: 0.5 }]}
                onPress={handleNextName}
                disabled={!fullName.trim()}
            >
                <LinearGradient
                    colors={[COLORS.primary, '#ff8a8a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                >
                    <Text style={styles.actionBtnText}>Далее</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View style={{ opacity: fadeAnim, gap: 20 }}>
            <Text style={styles.stepTitle}>Номер телефона</Text>
            <Text style={styles.stepDesc}>Для входа в аккаунт</Text>

            <View style={styles.inputBox}>
                <MaterialIcons name="phone" size={20} color={COLORS.textMuted} />
                <TextInput
                    style={styles.input}
                    placeholder="+998901234567"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                />
            </View>

            <TouchableOpacity
                style={[styles.actionBtn, !phone.trim() && { opacity: 0.5 }]}
                onPress={handleNextPhone}
                disabled={!phone.trim()}
            >
                <LinearGradient
                    colors={[COLORS.primary, '#ff8a8a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                >
                    <Text style={styles.actionBtnText}>Далее</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View style={{ opacity: fadeAnim, gap: 20 }}>
            <Text style={styles.stepTitle}>Придумайте пароль</Text>
            <Text style={styles.stepDesc}>Минимум 6 символов</Text>

            <View style={styles.inputBox}>
                <MaterialIcons name="lock" size={20} color={COLORS.textMuted} />
                <TextInput
                    style={styles.input}
                    placeholder="Новый пароль"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    autoFocus
                />
            </View>

            {/* Индикатор силы */}
            {password.length > 0 && (
                <View style={styles.strengthRow}>
                    <View style={styles.strengthTrack}>
                        <View style={[styles.strengthFill, { width: `${pwStrength.pct}%`, backgroundColor: pwStrength.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
                </View>
            )}

            <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} />
                <TextInput
                    style={styles.input}
                    placeholder="Повторите пароль"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                />
                {passwordConfirm.length > 0 && (
                    <MaterialIcons
                        name={password === passwordConfirm ? 'check-circle' : 'cancel'}
                        size={20}
                        color={password === passwordConfirm ? COLORS.success : COLORS.danger}
                    />
                )}
            </View>

            <TouchableOpacity
                style={[styles.actionBtn, loading && { opacity: 0.6 }]}
                onPress={handleNextPassword}
                disabled={loading}
            >
                <LinearGradient
                    colors={[COLORS.primary, '#ff8a8a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.actionBtnText}>Зарегистрироваться</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                        if (step === 0) navigation.goBack();
                        else animateTo(step - 1);
                    }}>
                        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Регистрация</Text>
                    <View style={{ width: 24 }} />
                </View>

                {renderStepIndicator()}

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {step === 0 && renderStep0()}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
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

    /* ── шаги ── */
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 0,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
    },
    stepDotText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    stepDotTextActive: {
        color: COLORS.white,
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginLeft: 4,
    },
    stepLabelActive: {
        color: COLORS.primary,
    },
    stepLine: {
        width: 20,
        height: 2,
        backgroundColor: COLORS.border,
        marginHorizontal: 6,
    },
    stepLineActive: {
        backgroundColor: COLORS.primary,
    },

    /* ── контент ── */
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
    },
    stepDesc: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: -12,
    },

    /* ── инвайт ── */
    inviteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 10,
    },
    inviteInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        letterSpacing: 2,
    },
    inviteSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: COLORS.success + '15',
        borderRadius: 10,
    },
    inviteSuccessText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.success,
    },
    inviteErrorText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.danger,
    },

    /* ── поля ── */
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

    /* ── аватар ── */
    avatarPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarPickerBtn: {
        position: 'relative',
    },
    avatarPreview: {
        width: 72,
        height: 72,
        borderRadius: 36,
        resizeMode: 'cover',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },

    /* ── сила пароля ── */
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    strengthTrack: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 13,
        fontWeight: '700',
        width: 70,
        textAlign: 'right',
    },

    /* ── кнопка ── */
    actionBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    actionBtnGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    actionBtnText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
});
