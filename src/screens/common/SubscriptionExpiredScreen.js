import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#ffffff',
    textDark: '#0f172a',
    textMuted: '#64748b',
};

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

export default function SubscriptionExpiredScreen() {
    const { subscriptionLock, refreshUser, logout } = useAuth();
    const expiresAt = formatDate(subscriptionLock.subscriptionExpiresAt);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconWrap}>
                    <MaterialIcons name="vpn-key-off" size={42} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>Доступ к ресторану остановлен</Text>
                <Text style={styles.subtitle}>
                    Ключ или подписка ресторана истекли. Пока владелец не продлит доступ, приложение работать не должно.
                </Text>
                {expiresAt ? (
                    <Text style={styles.meta}>Истёк: {expiresAt}</Text>
                ) : null}
                {subscriptionLock.subscriptionStatus ? (
                    <Text style={styles.meta}>Статус: {subscriptionLock.subscriptionStatus}</Text>
                ) : null}

                <TouchableOpacity style={styles.primaryBtn} onPress={refreshUser}>
                    <Text style={styles.primaryBtnText}>Проверить снова</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={logout}>
                    <Text style={styles.secondaryBtnText}>Выйти</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 28,
        padding: 28,
        alignItems: 'center',
    },
    iconWrap: {
        width: 84,
        height: 84,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 107, 107, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textDark,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    meta: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textDark,
    },
    primaryBtn: {
        width: '100%',
        marginTop: 22,
        borderRadius: 18,
        paddingVertical: 15,
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    primaryBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.white,
    },
    secondaryBtn: {
        width: '100%',
        marginTop: 10,
        borderRadius: 18,
        paddingVertical: 15,
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.06)',
    },
    secondaryBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textDark,
    },
});
