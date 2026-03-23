import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationsContext';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
    slate100: '#f1f5f9',
};

const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function NotificationsScreen({ navigation }) {
    const {
        notifications,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
    } = useNotifications();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Уведомления</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={markAllAsRead}>
                    <MaterialIcons name="done-all" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={false} onRefresh={refreshNotifications} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {notifications.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="notifications-none" size={44} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>Пока пусто</Text>
                        <Text style={styles.emptyText}>Новые события по заказам и столам появятся здесь.</Text>
                    </View>
                ) : (
                    notifications.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.85}
                            style={[styles.card, !item.read && styles.cardUnread]}
                            onPress={() => markAsRead(item.id)}
                        >
                            <View style={[styles.iconCircle, item.type === 'WAITER_CALL' && styles.iconCircleAlert]}>
                                <MaterialIcons
                                    name={item.type === 'WAITER_CALL' ? 'room-service' : 'receipt-long'}
                                    size={22}
                                    color={item.type === 'WAITER_CALL' ? '#F7B731' : COLORS.primary}
                                />
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardText}>{item.message}</Text>
                                <Text style={styles.cardMeta}>{formatDateTime(item.createdAt)}</Text>
                            </View>
                            {!item.read && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    ))
                )}

                {notifications.length > 0 && (
                    <TouchableOpacity style={styles.clearBtn} onPress={clearNotifications}>
                        <MaterialIcons name="delete-outline" size={18} color="#EE5A6F" />
                        <Text style={styles.clearBtnText}>Очистить список</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    content: {
        padding: 16,
        gap: 12,
    },
    emptyCard: {
        alignItems: 'center',
        padding: 28,
        borderRadius: 24,
        backgroundColor: COLORS.white,
    },
    emptyTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    emptyText: {
        marginTop: 6,
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardUnread: {
        borderColor: 'rgba(255, 107, 107, 0.22)',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.12)',
    },
    iconCircleAlert: {
        backgroundColor: 'rgba(247, 183, 49, 0.14)',
    },
    cardBody: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    cardText: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textDark,
    },
    cardMeta: {
        marginTop: 8,
        fontSize: 12,
        color: COLORS.textMuted,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginTop: 6,
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    clearBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EE5A6F',
    },
});
