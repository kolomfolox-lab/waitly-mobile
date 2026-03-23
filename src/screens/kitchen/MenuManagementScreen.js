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
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Switch } from 'react-native-gesture-handler';
import {
    getCategories,
    getDishes,
    createDish,
    deleteDish,
    createCategory,
    toggleDishAvailability,
} from '../../api/apiService';

const COLORS = {
    primary: '#FF6B6B',
    backgroundLight: '#F8F9FA',
    success: '#52D681',
    warning: '#F7B731',
    white: '#FFFFFF',
    textDark: '#0B1527',
    textMuted: '#8F9BB3',
    slate100: '#F1F5F9',
    soldOutBg: '#E2E8F0',
    soldOutBadgeBg: '#FFA4A4',
};

export default function MenuManagementScreen() {
    const [dishes, setDishes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Dish Add Modal State
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newDishName, setNewDishName] = useState('');
    const [newDishPrice, setNewDishPrice] = useState('');
    const [newDishTime, setNewDishTime] = useState('25');
    const [isCreatingDish, setIsCreatingDish] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchMenu = useCallback(async () => {
        try {
            const [catData, dishData] = await Promise.all([
                getCategories(),
                getDishes(),
            ]);
            setCategories(catData.results || catData || []);
            setDishes(dishData.results || dishData || []);
        } catch (e) {
            console.log('Menu fetch failed:', e.message);
        } finally { setLoading(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetchMenu(); }, [fetchMenu]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMenu();
        setRefreshing(false);
    }, [fetchMenu]);

    const handleAddCategory = () => {
        Alert.prompt('Новая категория', 'Введите название', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Создать', onPress: async (name) => {
                    if (!name) return;
                    try {
                        await createCategory({ name });
                        Alert.alert('Успех', 'Категория создана');
                        fetchMenu();
                    } catch (e) {
                        console.log('Category Create Error:', e.response?.data || e.message);
                        Alert.alert('Ошибка', e.response?.data?.name?.[0] || e.response?.data?.detail || 'Не удалось создать категорию: ' + e.message);
                    }
                }
            }
        ], 'plain-text');
    };

    const submitNewDish = async () => {
        if (!newDishName || !newDishPrice) {
            Alert.alert('Ошибка', 'Введите название и цену');
            return;
        }
        setIsCreatingDish(true);
        try {
            const formData = new FormData();
            formData.append('name', newDishName);
            formData.append('price', newDishPrice);
            if (activeCategory !== 'all') {
                formData.append('category', activeCategory);
            }
            await createDish(formData);
            fetchMenu();
            setIsAddModalVisible(false);
            setNewDishName('');
            setNewDishPrice('');
        } catch (e) {
            Alert.alert('Ошибка', e.response?.data?.detail || 'Не удалось добавить блюдо');
        } finally {
            setIsCreatingDish(false);
        }
    };

    const handleDeleteDish = (dish) => {
        Alert.alert('Удалить блюдо?', dish.name, [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить', style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDish(dish.id);
                        fetchMenu();
                    } catch (e) {
                        Alert.alert('Ошибка', 'Не удалось удалить');
                    }
                }
            }
        ]);
    };

    const handleToggle = async (dishId) => {
        try {
            await toggleDishAvailability(dishId);
            setDishes(prev => prev.map(d =>
                d.id === dishId ? { ...d, is_available: !d.is_available } : d
            ));
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось изменить доступность');
        }
    };

    const formatCurrency = (val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return Math.round(num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
    };

    const filteredDishes = activeCategory === 'all' ? dishes : dishes.filter(d => d.category === activeCategory);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Управление меню</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalVisible(true)}>
                        <MaterialIcons name="add" size={18} color={COLORS.white} />
                        <Text style={styles.addBtnText}>Добавить</Text>
                    </TouchableOpacity>
                </View>

                {/* Text Tabs row */}
                <View style={styles.tabsRowContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveCategory('all')}>
                            <Text style={[styles.tabText, activeCategory === 'all' && styles.tabTextActive]}>Все</Text>
                            {activeCategory === 'all' && <View style={styles.tabIndicator} />}
                        </TouchableOpacity>

                        {categories.map(cat => (
                            <TouchableOpacity key={cat.id} style={styles.tabItem} onPress={() => setActiveCategory(cat.id)}>
                                <Text style={[styles.tabText, activeCategory === cat.id && styles.tabTextActive]}>{cat.name}</Text>
                                {activeCategory === cat.id && <View style={styles.tabIndicator} />}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={styles.tabItemAdd} onPress={handleAddCategory}>
                            <MaterialIcons name="add" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Dish List */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredDishes.map((dish) => {
                        const isAvailable = dish.is_available !== false;

                        return (
                            <View key={dish.id} style={styles.dishCard}>
                                <View style={styles.dishImageWrap}>
                                    <Image
                                        source={{ uri: dish.image || 'https://via.placeholder.com/150' }}
                                        style={[styles.dishImage, !isAvailable && { opacity: 0.3, grayscale: 1 }]}
                                    />
                                    {!isAvailable && (
                                        <View style={styles.soldOutBadge}>
                                            <Text style={styles.soldOutText}>Нет в наличии</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.dishContent}>
                                    <View style={styles.dishHeaderRow}>
                                        <Text style={styles.dishName} numberOfLines={1}>{dish.name}</Text>
                                        <TouchableOpacity onPress={() => handleDeleteDish(dish)}>
                                            <MaterialIcons name="delete-outline" size={20} color={COLORS.textMuted} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.dishDesc} numberOfLines={1}>
                                        {dish.category_name || 'Вкусное блюдо'}
                                    </Text>

                                    <View style={styles.dishFooterRow}>
                                        <Text style={[styles.dishPrice, !isAvailable && { color: COLORS.textMuted }]}>
                                            {formatCurrency(dish.price)}
                                        </Text>
                                        <View style={styles.dishTimeWrap}>
                                            <MaterialIcons name="schedule" size={12} color={COLORS.textMuted} />
                                            <Text style={styles.dishTimeTxt}>20 MIN</Text>
                                        </View>

                                        <View style={{ flex: 1 }} />

                                        <Switch
                                            value={isAvailable}
                                            onValueChange={() => handleToggle(dish.id)}
                                            trackColor={{ false: COLORS.soldOutBg, true: COLORS.success }}
                                            thumbColor={COLORS.white}
                                            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                                        />
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {filteredDishes.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="restaurant-menu" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Блюда не найдены</Text>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>

            {/* Add Dish Modal Mimicking image copy 4 */}
            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : null}
                >
                    <View style={styles.modalHeader}>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsAddModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Новое блюдо</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>

                        <Text style={styles.fieldLabel}>Фото блюда</Text>
                        <TouchableOpacity style={styles.photoUploadArea}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop' }}
                                style={[StyleSheet.absoluteFill, { borderRadius: 24, opacity: 0.4 }]}
                            />
                            <View style={styles.cameraIconWrap}>
                                <MaterialIcons name="photo-camera" size={28} color={COLORS.primary} />
                            </View>
                            <Text style={styles.photoUploadText}>Нажмите чтобы выбрать</Text>
                        </TouchableOpacity>

                        <Text style={styles.sectionHeaderTxt}>Детали блюда</Text>

                        <Text style={styles.fieldLabel}>Название</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                style={styles.input}
                                placeholder="Например: Спагетти Карбонара"
                                placeholderTextColor={COLORS.textMuted}
                                value={newDishName}
                                onChangeText={setNewDishName}
                            />
                        </View>

                        <View style={styles.twoColRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.fieldLabel}>Категория</Text>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        value={activeCategory !== 'all' ? categories.find(c => c.id === activeCategory)?.name : 'Любая'}
                                        editable={false}
                                    />
                                    <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                                </View>
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.fieldLabel}>Цена (сум)</Text>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="45000"
                                        placeholderTextColor={COLORS.textMuted}
                                        keyboardType="numeric"
                                        value={newDishPrice}
                                        onChangeText={setNewDishPrice}
                                    />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.fieldLabel}>Время готовки (мин)</Text>
                        <View style={styles.inputWrap}>
                            <MaterialIcons name="schedule" size={20} color={COLORS.textMuted} style={{ marginLeft: 16, marginRight: 8 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="25"
                                placeholderTextColor={COLORS.textMuted}
                                keyboardType="numeric"
                                value={newDishTime}
                                onChangeText={setNewDishTime}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.saveMenuBtn, isCreatingDish && { opacity: 0.6 }]}
                            onPress={submitNewDish}
                            disabled={isCreatingDish}
                        >
                            {isCreatingDish ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <MaterialIcons name="restaurant-menu" size={20} color={COLORS.white} />
                                    <Text style={styles.saveMenuTxt}>Сохранить в меню</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundLight },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, gap: 4
    },
    addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

    tabsRowContainer: { borderBottomWidth: 1, borderBottomColor: COLORS.slate100, marginBottom: 8 },
    tabsScrollContent: { paddingHorizontal: 24, paddingBottom: 0, flexDirection: 'row', alignItems: 'center' },
    tabItem: { marginRight: 24, paddingVertical: 12, position: 'relative' },
    tabText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
    tabTextActive: { color: COLORS.primary, fontWeight: '700' },
    tabIndicator: {
        position: 'absolute', bottom: -1, left: 0, right: 0,
        height: 3, backgroundColor: COLORS.primary, borderTopLeftRadius: 3, borderTopRightRadius: 3
    },
    tabItemAdd: { paddingVertical: 12, opacity: 0.6 },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 },
    dishCard: {
        flexDirection: 'row', backgroundColor: COLORS.white,
        borderRadius: 24, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2,
    },
    dishImageWrap: { width: 80, height: 80, borderRadius: 16, position: 'relative', overflow: 'hidden' },
    dishImage: { width: '100%', height: '100%' },
    soldOutBadge: {
        position: 'absolute', top: 8, left: -6, backgroundColor: COLORS.soldOutBadgeBg,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, transform: [{ rotate: '-10deg' }]
    },
    soldOutText: { color: COLORS.white, fontSize: 8, fontWeight: '800' },

    dishContent: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    dishHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    dishName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, flexShrink: 1 },
    dishDesc: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },

    dishFooterRow: { flexDirection: 'row', alignItems: 'center' },
    dishPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
    dishTimeWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 12 },
    dishTimeTxt: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginTop: 12 },

    // Modal Styles matching image copy 4
    modalContainer: { flex: 1, backgroundColor: COLORS.backgroundLight },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
    modalCloseBtn: { padding: 4 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark },
    modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },

    photoUploadArea: {
        width: '100%', height: 180, backgroundColor: COLORS.white, borderRadius: 24,
        borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.primary + '40',
        justifyContent: 'center', alignItems: 'center', marginBottom: 32, position: 'relative', overflow: 'hidden'
    },
    cameraIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    photoUploadText: { fontSize: 13, fontWeight: '600', color: COLORS.textDark, marginTop: 12 },

    sectionHeaderTxt: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: 16 },
    fieldLabel: { fontSize: 13, color: COLORS.textDark, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
        borderRadius: 16, borderWidth: 1, borderColor: COLORS.slate100, marginBottom: 16
    },
    input: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.textDark },
    inputIcon: { marginRight: 16 },
    twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },

    modalFooter: { padding: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.slate100 },
    saveMenuBtn: {
        backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6
    },
    saveMenuTxt: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
