import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
};

const LANGUAGES = [
    { code: 'ru', label: 'Русский' },
    { code: 'uz', label: "O'zbekcha" },
    { code: 'en', label: 'English' },
];

export default function LanguageScreen({ navigation }) {
    const { i18n } = useTranslation();

    const handleChangeLanguage = async (language) => {
        await i18n.changeLanguage(language);
        await AsyncStorage.setItem('app_language', language);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Язык</Text>
                <View style={styles.backBtn} />
            </View>

            <View style={styles.content}>
                {LANGUAGES.map((language) => {
                    const isActive = i18n.language === language.code;
                    return (
                        <TouchableOpacity
                            key={language.code}
                            style={[styles.card, isActive && styles.cardActive]}
                            onPress={() => handleChangeLanguage(language.code)}
                        >
                            <Text style={styles.cardLabel}>{language.label}</Text>
                            {isActive && <MaterialIcons name="check-circle" size={22} color={COLORS.primary} />}
                        </TouchableOpacity>
                    );
                })}
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
        borderRadius: 18,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardActive: {
        borderColor: 'rgba(255, 107, 107, 0.24)',
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textDark,
    },
});
