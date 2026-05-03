import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAvatarPresetById, getUserInitials } from '../../utils/avatar';

export default function UserAvatar({
    fullName,
    avatarPresetId,
    size = 44,
    fallbackBackgroundColor = '#ff6b6b',
    fallbackTextColor = '#ffffff',
}) {
    const preset = getAvatarPresetById(avatarPresetId);

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

    return (
        <View
            style={[
                styles.avatar,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: fallbackBackgroundColor,
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
