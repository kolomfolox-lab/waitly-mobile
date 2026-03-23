import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
};

export default function AboutScreen({ navigation }) {
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>О приложении</Text>
                <View style={styles.backBtn} />
            </View>

            <View style={styles.content}>
                <View style={styles.heroCard}>
                    <MaterialIcons name="restaurant" size={42} color={COLORS.primary} />
                    <Text style={styles.appName}>Waitly</Text>
                    <Text style={styles.version}>Версия {appVersion}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Назначение</Text>
                    <Text style={styles.infoText}>
                        Приложение помогает официантам работать со столами, заказами и уведомлениями по сервису в ресторане.
                    </Text>
                </View>
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
        gap: 16,
    },
    heroCard: {
        alignItems: 'center',
        padding: 28,
        borderRadius: 24,
        backgroundColor: COLORS.white,
    },
    appName: {
        marginTop: 12,
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textDark,
    },
    version: {
        marginTop: 4,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    infoCard: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: COLORS.white,
    },
    infoTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textDark,
    },
    infoText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 21,
        color: COLORS.textDark,
    },
});
