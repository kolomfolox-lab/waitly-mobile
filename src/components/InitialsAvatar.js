import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const COLORS = [
    '#ff6b6b', '#f59e0b', '#22c55e', '#3b82f6',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
    '#e11d48', '#d946ef', '#6366f1', '#06b6d4',
];

function getColor(name) {
    if (!name) return COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return (parts[0][0] || '?').toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function InitialsAvatar({ name, photoUrl, size = 40, style }) {
    const color = getColor(name);

    if (photoUrl) {
        return (
            <Image
                source={{ uri: photoUrl }}
                style={[styles.image, { width: size, height: size, borderRadius: size / 2 }, style]}
            />
        );
    }

    return (
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}>
            <Text style={[styles.initials, { fontSize: size * 0.42 }]}>
                {getInitials(name)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    circle: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        color: '#fff',
        fontWeight: '700',
    },
    image: {
        resizeMode: 'cover',
    },
});
