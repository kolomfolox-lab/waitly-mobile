import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationsContext';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
};

export default function SettingsScreen({ navigation }) {
    const { settings, updateSettings } = useNotifications();

    const ITEMS = [
        {
            key: 'orderReady',
            title: 'Готовность заказа',
            description: 'Показывать уведомление, когда кухня завершила заказ.',
        },
        {
            key: 'waiterCalls',
            title: 'Вызов к столику',
            description: 'Показывать уведомление, если столик зовет официанта.',
        },
        {
            key: 'inAppAlerts',
            title: 'Всплывающие уведомления',
            description: 'Показывать всплывающий алерт внутри приложения.',
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Параметры</Text>
                <View style={styles.backBtn} />
            </View>

            <View style={styles.content}>
                {ITEMS.map((item) => (
                    <View key={item.key} style={styles.card}>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </View>
                        <Switch
                            value={Boolean(settings[item.key])}
                            onValueChange={(value) => updateSettings({ [item.key]: value })}
                            trackColor={{ false: '#dbe4ee', true: 'rgba(255, 107, 107, 0.35)' }}
                            thumbColor={settings[item.key] ? COLORS.primary : '#ffffff'}
                        />
                    </View>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundLight },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    backBtn: {
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
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        gap: 16,
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    cardDesc: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 19,
        color: COLORS.textMuted,
    },
});
