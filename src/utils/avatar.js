import AsyncStorage from '@react-native-async-storage/async-storage';

export const AVATAR_STORAGE_KEY = 'waitly_profile_avatar_preset';

export const AVATAR_PRESETS = [
    { id: 'chef-red', icon: 'restaurant', backgroundColor: '#fee2e2', iconColor: '#ef4444' },
    { id: 'waiter-blue', icon: 'room-service', backgroundColor: '#dbeafe', iconColor: '#2563eb' },
    { id: 'manager-amber', icon: 'badge', backgroundColor: '#fef3c7', iconColor: '#d97706' },
    { id: 'hostess-pink', icon: 'person', backgroundColor: '#fce7f3', iconColor: '#db2777' },
    { id: 'kitchen-green', icon: 'outdoor-grill', backgroundColor: '#dcfce7', iconColor: '#16a34a' },
    { id: 'delivery-violet', icon: 'delivery-dining', backgroundColor: '#ede9fe', iconColor: '#7c3aed' },
];

export const getAvatarPresetById = (avatarId) => (
    AVATAR_PRESETS.find((preset) => preset.id === avatarId) || null
);

export const loadStoredAvatarPreset = async () => {
    try {
        return await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
    } catch (error) {
        return null;
    }
};

export const saveStoredAvatarPreset = async (avatarId) => {
    if (!avatarId) {
        await AsyncStorage.removeItem(AVATAR_STORAGE_KEY);
        return null;
    }

    await AsyncStorage.setItem(AVATAR_STORAGE_KEY, avatarId);
    return avatarId;
};

export const getUserInitials = (fullName) => {
    if (!fullName) {
        return '?';
    }

    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }

    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
};
