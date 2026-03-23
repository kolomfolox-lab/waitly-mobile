import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Animated,
    RefreshControl,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStaff, createStaff, deleteStaff } from '../../api/apiService';

const COLORS = {
    primary: '#FF6B6B',
    backgroundLight: '#F8F9FA',
    success: '#52D681',
    info: '#4EA8DE',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0B1527',
    textMuted: '#8F9BB3',
    slate100: '#F1F5F9',
    roleTagBg: '#FFE8EA',
    roleTagText: '#FF6B6B',
};

// Simplified to fit the 'Все, Официанты, Повара, Шеф-повара' filter style in Figma
const FILTER_TABS = [
    { id: 'ALL', label: 'Все' },
    { id: 'WAITER', label: 'Официанты' },
    { id: 'COOK', label: 'Повара' },
    { id: 'CHEF', label: 'Шеф-повара' }
];

const getRoleLabel = (role) => {
    const roles = {
        'HEAD_WAITER': 'СТАРШИЙ ОФИЦИАНТ',
        'WAITER': 'ОФИЦИАНТ',
        'HOSTESS': 'ХОСТЕС',
        'CHEF': 'ШЕФ-ПОВАР',
        'COOK': 'ПОВАР'
    };
    return roles[role] || role;
};

export default function StaffScreen() {
    const { user } = useAuth();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchStaff = useCallback(async () => {
        try {
            const data = await getOwnerStaff();
            const list = Array.isArray(data) ? data : (data?.results || data?.staff || []);
            setStaff(list);
        } catch (e) {
            console.log('Staff fetch failed:', e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchStaff(); }, [fetchStaff]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStaff();
        setRefreshing(false);
    }, [fetchStaff]);

    const handleAddStaff = () => {
        Alert.prompt('Имя сотрудника', 'Введите полное имя', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Далее', onPress: (fullName) => {
                    if (!fullName) return;
                    Alert.prompt('Номер телефона', '+998...', [
                        { text: 'Отмена', style: 'cancel' },
                        {
                            text: 'Далее', onPress: (phone) => {
                                if (!phone) return;
                                showRolePicker(fullName, phone);
                            }
                        }
                    ], 'plain-text', '+998');
                }
            }
        ], 'plain-text');
    };

    const showRolePicker = (fullName, phone) => {
        const roles = ['WAITER', 'HEAD_WAITER', 'HOSTESS', 'CHEF', 'COOK'];
        Alert.alert('Выберите роль', '', [
            ...roles.map(r => ({
                text: getRoleLabel(r),
                onPress: () => submitNewStaff(fullName, phone, r),
            })),
            { text: 'Отмена', style: 'cancel' },
        ]);
    };

    const submitNewStaff = async (fullName, phone, role) => {
        try {
            await createStaff({
                full_name: fullName,
                phone_number: phone,
                role: role,
                password: 'waitly123',
            });
            Alert.alert('Готово', `${fullName} добавлен как ${getRoleLabel(role)}`);
            fetchStaff();
        } catch (e) {
            Alert.alert('Ошибка', e.response?.data?.detail || 'Не удалось добавить сотрудника');
        }
    };

    const handleDeleteStaff = (member) => {
        Alert.alert(
            'Удалить сотрудника?',
            `${member.full_name || member.username} будет удалён`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить', style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteStaff(member.id);
                            fetchStaff();
                        } catch (e) {
                            Alert.alert('Ошибка', 'Не удалось удалить');
                        }
                    }
                }
            ]
        );
    };

    const filteredStaff = staff.filter(s => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'WAITER') return s.role === 'WAITER' || s.role === 'HEAD_WAITER';
        if (activeFilter === 'COOK') return s.role === 'COOK';
        if (activeFilter === 'CHEF') return s.role === 'CHEF';
        return true;
    });

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const restaurantName = user?.restaurant_name || 'Ресторан Sezam';
    const networkName = user?.network_name || 'Сеть Sezam';

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

                {/* Header matching image copy 7 */}
                <View style={styles.header}>
                    <View style={styles.headerTitleRow}>
                        <View style={styles.logoIcon}>
                            <MaterialIcons name="people" size={24} color={COLORS.white} />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Персонал</Text>
                            <Text style={styles.headerSub}>{networkName} • {restaurantName}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddStaff}>
                        <MaterialIcons name="add" size={18} color={COLORS.white} />
                        <Text style={styles.addBtnText}>Добавить</Text>
                    </TouchableOpacity>
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, gap: 10 }}>
                        {FILTER_TABS.map(tab => {
                            const isActive = activeFilter === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.filterBtn, isActive ? styles.filterBtnActive : styles.filterBtnInactive]}
                                    onPress={() => setActiveFilter(tab.id)}
                                >
                                    <Text style={[styles.filterBtnText, isActive ? styles.filterBtnTextActive : styles.filterBtnTextInactive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.sectionHeader}>НА СМЕНЕ</Text>

                    {filteredStaff.map((member, index) => {
                        // Mocking data based on image copy 7
                        const isOnline = index % 3 !== 2; // Fake online status 
                        const ordersCount = isOnline ? 12 : 0;
                        const rating = isOnline ? 4.7 : 4.9;

                        return (
                            <View key={member.id} style={styles.staffCard}>
                                <View style={styles.avatarContainer}>
                                    <Image
                                        source={{ uri: `https://i.pravatar.cc/150?u=${member.id}` }}
                                        style={[styles.avatarImg, !isOnline && { opacity: 0.3, grayscale: 1 }]}
                                    />
                                    <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textMuted }]} />
                                </View>

                                <View style={styles.staffInfo}>
                                    <View style={styles.staffTopRow}>
                                        <Text style={styles.staffName} numberOfLines={1}>{member.full_name || member.username}</Text>
                                        <View style={styles.roleTag}>
                                            <Text style={styles.roleTagText}>{getRoleLabel(member.role)}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.staffPhone}>{member.phone_number || '+7 (900) 000-00-00'}</Text>

                                    <View style={styles.staffBottomRow}>
                                        <View style={styles.statChip}>
                                            <MaterialIcons name="receipt-long" size={14} color={COLORS.primary} />
                                            <Text style={styles.statChipText}>{ordersCount} заказов</Text>
                                        </View>
                                        <View style={styles.statChip}>
                                            <MaterialIcons name="star" size={14} color={COLORS.warning} />
                                            <Text style={styles.statChipText}>{rating}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.staffActions}>
                                    <TouchableOpacity style={styles.actionBtn}>
                                        <MaterialIcons name="edit" size={18} color={COLORS.textMuted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteStaff(member)}>
                                        <MaterialIcons name="delete" size={18} color={COLORS.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}

                    {filteredStaff.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="people" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Нет сотрудников</Text>
                        </View>
                    )}

                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundLight },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoIcon: {
        width: 36, height: 36, backgroundColor: COLORS.primary, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
    headerSub: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 4
    },
    addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

    filtersContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.slate100, paddingBottom: 8 },
    filterBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    filterBtnActive: { backgroundColor: COLORS.primary },
    filterBtnInactive: { backgroundColor: COLORS.slate100 },
    filterBtnText: { fontSize: 13, fontWeight: '600' },
    filterBtnTextActive: { color: COLORS.white },
    filterBtnTextInactive: { color: COLORS.textDark },

    scrollContent: { paddingBottom: 60 },
    sectionHeader: {
        fontSize: 12, fontWeight: '800', color: COLORS.textMuted,
        paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, letterSpacing: 1
    },

    staffCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: 24, padding: 16, marginHorizontal: 24, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2,
    },
    avatarContainer: { width: 64, height: 64, borderRadius: 32, position: 'relative' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: COLORS.slate100 },
    statusDot: {
        position: 'absolute', bottom: 0, right: 0, width: 14, height: 14,
        borderRadius: 7, borderWidth: 2, borderColor: COLORS.white
    },

    staffInfo: { flex: 1, marginLeft: 16 },
    staffTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    staffName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, flexShrink: 1 },
    roleTag: { backgroundColor: COLORS.roleTagBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleTagText: { fontSize: 9, fontWeight: '800', color: COLORS.roleTagText, letterSpacing: 0.5 },

    staffPhone: { fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },

    staffBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statChipText: { fontSize: 12, color: COLORS.textDark, fontWeight: '600' },

    staffActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 8 },
    actionBtn: { padding: 4 },

    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginTop: 12 },
});
