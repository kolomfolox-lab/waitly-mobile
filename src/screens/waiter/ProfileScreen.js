import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { getMe } from '../../api/apiService';

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

const MENU_ITEMS = [
    { icon: 'notifications', label: 'Уведомления', screen: 'Notifications' },
    { icon: 'tune', label: 'Параметры', screen: 'Settings' },
    { icon: 'language', label: 'Язык', screen: 'Language' },
    { icon: 'info-outline', label: 'О приложении', screen: 'About' },
];

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
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

    const displayUser = profile || user || {};

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
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {displayUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
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

                {/* Menu */}
                <Animated.View style={[styles.menuSection, { opacity: fadeAnim }]}>
                    {MENU_ITEMS.map((item, index) => (
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
                            {item.label === 'Уведомления' && unreadCount > 0 ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
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
        marginBottom: 32,
    },
    avatarCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.white,
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
});
