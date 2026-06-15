import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Storage from '../../../src/utils/storage';
import { useTranslation } from 'react-i18next';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    white: '#FFFFFF',
    textDark: '#0f172a',
    textMuted: '#94a3b8',
};

export default function LanguageScreen({ navigation }) {
    const { i18n, t } = useTranslation();

    const LANGUAGES = [
        { code: 'ru', short: t('language_short_ru'), label: t('language_name_ru') },
        { code: 'en', short: t('language_short_en'), label: t('language_name_en') },
        { code: 'uz', short: t('language_short_uz'), label: t('language_name_uz') },
    ];

    const handleChangeLanguage = async (language) => {
        await i18n.changeLanguage(language);
        await Storage.setItem('app_language', language);
    };

    const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0].toLowerCase();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('language_title')}</Text>
                <View style={styles.backBtn} />
            </View>

            <View style={styles.content}>
                {LANGUAGES.map((language) => {
                    const isActive = activeLanguage === language.code;
                    return (
                        <TouchableOpacity
                            key={language.code}
                            style={[styles.card, isActive && styles.cardActive]}
                            onPress={() => handleChangeLanguage(language.code)}
                        >
                            <View style={styles.languageInfo}>
                                <View style={[styles.shortBadge, isActive && styles.shortBadgeActive]}>
                                    <Text style={[styles.shortBadgeText, isActive && styles.shortBadgeTextActive]}>{language.short}</Text>
                                </View>
                                <Text style={styles.cardLabel}>{language.label}</Text>
                            </View>
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
    languageInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shortBadge: {
        minWidth: 54,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: COLORS.backgroundLight,
        marginRight: 12,
    },
    shortBadgeActive: {
        backgroundColor: 'rgba(255, 107, 107, 0.12)',
    },
    shortBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.textMuted,
        letterSpacing: 0.3,
    },
    shortBadgeTextActive: {
        color: COLORS.primary,
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
