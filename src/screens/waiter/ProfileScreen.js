import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useKitchen } from '../../context/KitchenContext';
import { getMe, uploadPhoto } from '../../api/apiService';
import UserAvatar from '../../components/common/UserAvatar';

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
    const { user, logout, refreshUser } = useAuth();
    const { unreadCount } = useNotifications();
    const kitchen = useKitchen();
    const [profile, setProfile] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getMe();
            setProfile(data);
        } catch (e) {
            console.log('Profile fetch failed:', e.message);
        }
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
            await handlePhotoUpload(result.assets[0].uri);
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
            await handlePhotoUpload(result.assets[0].uri);
        }
    };

    const handlePhotoUpload = async (uri) => {
        try {
            await uploadPhoto(uri);
            await refreshUser();
            await fetchProfile();
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось загрузить фото');
        }
    };

    const showPhotoPicker = () => {
        Alert.alert('Фото профиля', 'Выберите источник', [
            { text: 'Камера', onPress: takePhoto },
            { text: 'Галерея', onPress: pickPhoto },
            { text: 'Отмена', style: 'cancel' },
        ]);
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
                        onPress={showPhotoPicker}
                        style={styles.avatarButton}
                    >
                        <View style={styles.avatarCircle}>
                            <UserAvatar
                                fullName={displayUser.full_name}
                                photoUrl={displayUser.photo_url}
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
                    <Text style={styles.avatarHintText}>Нажмите на аватар, чтобы загрузить фото</Text>
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
                </Animated.View>
            </ScrollView>
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
