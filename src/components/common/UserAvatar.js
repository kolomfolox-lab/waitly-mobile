import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAvatarPresetById, getUserInitials } from '../../utils/avatar';

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

export default function UserAvatar({
    fullName,
    avatarPresetId,
    photoUrl,
    size = 44,
    fallbackBackgroundColor,
    fallbackTextColor = '#ffffff',
}) {
    if (photoUrl) {
        return (
            <Image
                source={{ uri: photoUrl }}
                style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
            />
        );
    }

    const preset = avatarPresetId ? getAvatarPresetById(avatarPresetId) : null;

    if (preset) {
        return (
            <View
                style={[
                    styles.avatar,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: preset.backgroundColor,
                    },
                ]}
            >
                <MaterialIcons
                    name={preset.icon}
                    size={size * 0.46}
                    color={preset.iconColor}
                />
            </View>
        );
    }

    const bgColor = fallbackBackgroundColor || getColor(fullName);

    return (
        <View
            style={[
                styles.avatar,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: bgColor,
                },
            ]}
        >
            <Text style={[styles.initials, { color: fallbackTextColor, fontSize: size * 0.38 }]}>
                {getUserInitials(fullName)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    initials: {
        fontWeight: '800',
        letterSpacing: -0.4,
    },
});
