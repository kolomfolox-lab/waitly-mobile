import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import KitchenReadOnlyBanner from './KitchenReadOnlyBanner';

const COLORS = {
    background: '#ffffff',
    panel: '#ffffff',
    text: '#111827',
    muted: '#64748b',
    border: '#e2e8f0',
};

export default function KitchenScaffold({
    title,
    subtitle,
    readOnly = false,
    onBack,
    headerRight,
    children,
}) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    {onBack ? (
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                            <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
                        </TouchableOpacity>
                    ) : null}
                    <View style={styles.titleBlock}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle ? (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        ) : null}
                    </View>
                    {headerRight ? (
                        <View style={styles.headerRight}>
                            {headerRight}
                        </View>
                    ) : null}
                </View>
            </View>

            {readOnly ? <KitchenReadOnlyBanner /> : null}

            <View style={styles.content}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#f8fafc',
        marginRight: 12,
    },
    titleBlock: {
        flex: 1,
    },
    title: {
        color: COLORS.text,
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.8,
    },
    subtitle: {
        marginTop: 4,
        color: COLORS.muted,
        fontSize: 13,
        fontWeight: '600',
    },
    headerRight: {
        marginLeft: 12,
    },
    content: {
        flex: 1,
    },
});
