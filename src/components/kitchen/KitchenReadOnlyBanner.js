import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    surface: '#fff7ed',
    border: '#fdba74',
    text: '#9a3412',
    accent: '#f97316',
};

export default function KitchenReadOnlyBanner() {
    return (
        <View style={styles.banner}>
            <MaterialIcons name="lock-outline" size={18} color={COLORS.accent} />
            <Text style={styles.text}>
                Subscription expired. Queue is visible, but kitchen actions are locked.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    text: {
        flex: 1,
        color: COLORS.text,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },
});
