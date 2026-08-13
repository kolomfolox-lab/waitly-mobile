import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useKitchen } from '../../context/KitchenContext';
import { getMe } from '../../api/apiService';
import UserAvatar from '../../components/common/UserAvatar';
import {
    AVATAR_PRESETS,
    loadStoredAvatarPreset,
    saveStoredAvatarPreset,
} from '../../utils/avatar';

const COLORS = {
    primary: '#ff6b6b',
    primaryLight: 'rgba(255, 107, 107, 0.1)',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
};

const ROLE_LABELS = {
    SUPER_ADMIN: 'Супер Админ',
    CHAIN_OWNER: 'Владелец сети',
    RESTAURANT_OWNER: 'Владелец ресторана',
    HEAD_WAITER: 'Старший официант',
    WAITER: 'Официант',
    HOSTESS: 'Хостес',
    CHEF: 'Шеф-повар',
    COOK: 'Повар',
};

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const kitchen = useKitchen();
    const [profile, setProfile] = useState(null);
    const [avatarPresetId, setAvatarPresetId] = useState(null);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
        fetchProfile();
        loadStoredAvatarPreset().then(setAvatarPresetId).catch(() => {});
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getMe();
            setProfile(data);
        } catch (e) {
            console.log('Profile fetch failed:', e.message);
        }
    };

    const displayUser = profile || user || {};
    const isKitchenRole = ['CHEF', 'COOK', 'HEAD_CHEF'].includes(displayUser.role || user?.role);
    const menuItems = isKitchenRole ? [
        { icon: 'notifications-active', label: 'Обновления кухни', screen: 'KitchenUpdates' },
        { icon: 'tune', label: 'Параметры', screen: 'Settings' },
        { icon: 'language', label: 'Язык', screen: 'Language' },
        { icon: 'info-outline', label: 'О приложении', screen: 'About' },
    ] : [
        { icon: 'notifications', label: 'Уведомления', screen: 'Notifications' },
        { icon: 'tune', label: 'Параметры', screen: 'Settings' },
        { icon: 'language', label: 'Язык', screen: 'Language' },
        { icon: 'info-outline', label: 'О приложении', screen: 'About' },
    ];

    const handleLogout = () => {
        Alert.alert(
            'Выход',
            'Вы уверены, что хотите выйти?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Выйти',
                    style: 'destructive',
                    onPress: logout,
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Удаление аккаунта',
            'Вы уверены? Это действие необратимо. Ваш аккаунт будет деактивирован.',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const client = require('../../api/client').default;
                            await client.post('/auth/delete-account/');
                            Alert.alert('Аккаунт удалён', 'Вы будете перенаправлены на экран входа.');
                            logout();
                        } catch (e) {
                            Alert.alert('Ошибка', 'Не удалось удалить аккаунт. Попробуйте позже.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleMenuPress = (item) => {
        if (item.screen) {
            navigation.navigate(item.screen);
        }
    };

    const handleAvatarSelect = async (avatarId) => {
        await saveStoredAvatarPreset(avatarId);
        setAvatarPresetId(avatarId);
        setAvatarModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <Text style={styles.headerTitle}>Профиль</Text>
                </Animated.View>

                {/* Avatar Section */}
                <Animated.View style={[styles.avatarSection, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setAvatarModalVisible(true)}
                        style={styles.avatarButton}
                    >
                        <View style={styles.avatarCircle}>
                            <UserAvatar
                                fullName={displayUser.full_name}
                                avatarPresetId={avatarPresetId}
                                size={88}
                                fallbackBackgroundColor={COLORS.primary}
                                fallbackTextColor={COLORS.white}
                            />
                        </View>
                        <View style={styles.avatarEditBadge}>
                            <MaterialIcons name="photo-camera" size={14} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.userName}>{displayUser.full_name || 'Пользователь'}</Text>
                    <View style={styles.roleChip}>
                        <Text style={styles.roleText}>
                            {ROLE_LABELS[displayUser.role] || displayUser.role || 'Официант'}
                        </Text>
                    </View>
                    {displayUser.phone_number && (
                        <Text style={styles.phoneText}>{displayUser.phone_number}</Text>
                    )}
                    {displayUser.created_at && (
                        <Text style={styles.dateText}>С нами с: {formatDate(displayUser.created_at)}</Text>
                    )}
                </Animated.View>

                <Animated.View style={[styles.avatarHintWrap, { opacity: fadeAnim }]}>
                    <Text style={styles.avatarHintText}>Нажмите на аватар, чтобы выбрать стиль</Text>
                </Animated.View>

                {/* Menu */}
                <Animated.View style={[styles.menuSection, { opacity: fadeAnim }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            activeOpacity={0.7}
                            onPress={() => handleMenuPress(item)}
                        >
                            <View style={styles.menuIconCircle}>
                                <MaterialIcons name={item.icon} size={22} color={COLORS.textMuted} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            {(item.screen === 'Notifications' && unreadCount > 0) || (item.screen === 'KitchenUpdates' && kitchen?.unreadUpdatesCount > 0) ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {item.screen === 'KitchenUpdates' ? kitchen?.unreadUpdatesCount : unreadCount}
                                    </Text>
                                </View>
                            ) : null}
                            <MaterialIcons name="chevron-right" size={22} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Logout */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        activeOpacity={0.7}
                        onPress={handleLogout}
                    >
                        <MaterialIcons name="logout" size={20} color="#EE5A6F" />
                        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.logoutBtn, { marginTop: 12, borderColor: '#EE5A6F40' }]}
                        activeOpacity={0.7}
                        onPress={handleDeleteAccount}
                    >
                        <MaterialIcons name="delete-forever" size={20} color="#EE5A6F" />
                        <Text style={styles.logoutText}>Удалить аккаунт</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            <Modal
                visible={avatarModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAvatarModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Выберите аватар</Text>
                        <View style={styles.avatarGrid}>
                            {AVATAR_PRESETS.map((preset) => {
                                const isActive = avatarPresetId === preset.id;
                                return (
                                    <TouchableOpacity
                                        key={preset.id}
                                        style={[styles.avatarOption, isActive && styles.avatarOptionActive]}
                                        onPress={() => handleAvatarSelect(preset.id)}
                                    >
                                        <UserAvatar
                                            fullName={displayUser.full_name}
                                            avatarPresetId={preset.id}
                                            size={54}
                                            fallbackBackgroundColor={COLORS.primary}
                                            fallbackTextColor={COLORS.white}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity style={styles.initialsBtn} onPress={() => handleAvatarSelect(null)}>
                            <Text style={styles.initialsBtnText}>Сбросить на инициалы</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setAvatarModalVisible(false)}>
                            <Text style={styles.closeBtnText}>Готово</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textDark,
        textAlign: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarButton: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarEditBadge: {
        position: 'absolute',
        right: -2,
        bottom: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 8,
    },
    roleChip: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 8,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    phoneText: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '500',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 13,
        color: '#a0aec0',
        fontWeight: '400',
    },
    avatarHintWrap: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarHintText: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: '500',
    },
    menuSection: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate100,
    },
    menuIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    badge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.white,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
        backgroundColor: 'rgba(238, 90, 111, 0.08)',
        borderRadius: 16,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EE5A6F',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.36)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textDark,
        textAlign: 'center',
        marginBottom: 18,
    },
    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    avatarOption: {
        width: '30%',
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.slate100,
        backgroundColor: COLORS.backgroundLight,
    },
    avatarOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(255, 107, 107, 0.08)',
    },
    initialsBtn: {
        marginTop: 16,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: COLORS.backgroundLight,
    },
    initialsBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    closeBtn: {
        marginTop: 10,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: COLORS.primary,
    },
    closeBtnText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.white,
    },
});
