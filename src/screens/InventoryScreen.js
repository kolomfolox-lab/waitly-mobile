import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator, Alert, Modal, RefreshControl, SafeAreaView,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getMobileInventorySummary } from '../api/apiService';
import client from '../api/client';

const C = {
    primary: '#ff6b6b', primarySoft: 'rgba(255,107,107,0.12)',
    bg: '#f8f5f5', card: '#ffffff', border: '#e2e8f0',
    text: '#0f172a', muted: '#94a3b8', success: '#52D681',
    warning: '#F7B731', accent: '#667eea',
};

export default function InventoryScreen() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [writeOffModal, setWriteOffModal] = useState(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState('all');

    const load = useCallback(async () => {
        try {
            const inv = await getMobileInventorySummary();
            setItems(inv?.results || inv || []);
        } catch { /* silent */ }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const warehouseTypes = useMemo(() => {
        const types = new Set(items.map(i => i.warehouse_type || 'Общий'));
        return ['all', ...Array.from(types)];
    }, [items]);

    const filtered = useMemo(() => {
        if (selectedWarehouse === 'all') return items;
        return items.filter(i => (i.warehouse_type || 'Общий') === selectedWarehouse);
    }, [items, selectedWarehouse]);

    const lowCount = useMemo(() => items.filter(i => i.is_low || i.is_empty).length, [items]);

    const handleSupply = async () => {
        setShowModal(true);
    };

    const submitSupply = async (ingredientId, qty) => {
        try {
            await client.post('/inventory/stock/incoming/', { ingredient_id: ingredientId, quantity: qty });
            Alert.alert('Готово', 'Поставка добавлена');
            load();
        } catch {
            Alert.alert('Ошибка', 'Не удалось добавить поставку');
        }
    };

    const submitWriteOff = async () => {
        if (!writeOffModal) return;
        try {
            await client.post('/api/v1/mobile/inventory/write-off/', {
                ingredient_id: writeOffModal.ingredient_id,
                quantity: writeOffModal.quantity,
                note: writeOffModal.note || '',
            });
            Alert.alert('Готово', 'Списание выполнено');
            setWriteOffModal(null);
            load();
        } catch {
            Alert.alert('Ошибка', 'Не удалось списать');
        }
    };

    const getStatusIcon = (item) => {
        if (item.is_empty) return { icon: 'error', color: C.primary };
        if (item.is_low) return { icon: 'warning', color: C.warning };
        return { icon: 'check-circle', color: C.success };
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.kicker}>Inventory</Text>
                    <Text style={styles.title}>Склад</Text>
                    <Text style={styles.subtitle}>{(items || []).length} позиций · {lowCount} тревог</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={handleSupply}>
                    <MaterialIcons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                {warehouseTypes.map(type => (
                    <TouchableOpacity key={type} onPress={() => setSelectedWarehouse(type)}
                        style={[styles.chip, selectedWarehouse === type && styles.chipActive]}>
                        <Text style={[styles.chipText, selectedWarehouse === type && styles.chipActiveText]}>
                            {type === 'all' ? 'Все' : type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filtered}
                keyExtractor={(item, idx) => item.ingredient_id || idx.toString()}
                contentContainerStyle={{ padding: 16, gap: 8 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
                renderItem={({ item }) => {
                    const { icon, color } = getStatusIcon(item);
                    return (
                        <TouchableOpacity style={styles.item} onLongPress={() => {
                            if (!item.is_empty) setWriteOffModal({
                                ingredient_id: item.ingredient_id,
                                ingredient_name: item.ingredient_name,
                                quantity: 0,
                                note: '',
                            });
                        }}>
                            <MaterialIcons name={icon} size={20} color={color} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.itemName}>{item.ingredient_name}</Text>
                                <Text style={styles.itemMeta}>
                                    {item.quantity} {item.unit}
                                    {item.warehouse_name ? ` · ${item.warehouse_name}` : ''}
                                </Text>
                            </View>
                            {item.minimum_quantity && Number(item.quantity) < Number(item.minimum_quantity) && (
                                <Text style={styles.minLabel}>мин {item.minimum_quantity}</Text>
                            )}
                            <TouchableOpacity style={styles.writeOffBtn} onPress={() => submitSupply(item.ingredient_id, 1)}>
                                <MaterialIcons name="add" size={16} color={C.accent} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <MaterialIcons name="inventory-2" size={48} color={C.muted} />
                        <Text style={{ color: C.muted, marginTop: 8 }}>Нет ингредиентов на складе</Text>
                    </View>
                }
            />

            <Modal visible={showModal} transparent animationType="slide">
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>Быстрая поставка</Text>
                        <Text style={styles.modalNote}>Добавьте количество к ингредиенту</Text>
                        {items.slice(0, 20).map(item => (
                            <TouchableOpacity key={item.ingredient_id} style={styles.quickItem}
                                onPress={() => {
                                    Alert.prompt('Количество', `${item.ingredient_name}:`, (val) => {
                                        if (val && Number(val) > 0) submitSupply(item.ingredient_id, Number(val));
                                    }, 'plain-text', '1', 'decimal');
                                }}>
                                <Text style={styles.quickName}>{item.ingredient_name}</Text>
                                <Text style={styles.quickQty}>{item.quantity} {item.unit}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                            <Text style={styles.closeBtnText}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={!!writeOffModal} transparent animationType="fade">
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={styles.writeOffSheet}>
                        <Text style={styles.modalTitle}>Списание</Text>
                        <Text style={styles.modalNote}>{writeOffModal?.ingredient_name}</Text>
                        <TextInput
                            value={writeOffModal?.quantity?.toString()}
                            onChangeText={v => setWriteOffModal(prev => ({ ...prev, quantity: Number(v) || 0 }))}
                            placeholder="Количество"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                        <TextInput
                            value={writeOffModal?.note}
                            onChangeText={v => setWriteOffModal(prev => ({ ...prev, note: v }))}
                            placeholder="Причина"
                            style={styles.input}
                        />
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setWriteOffModal(null)}>
                                <Text style={{ color: C.muted, fontWeight: '700' }}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={submitWriteOff}>
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Списать</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    kicker: { color: '#8bd8ff', fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
    title: { color: C.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    subtitle: { color: C.muted, fontSize: 13, marginTop: 2 },
    addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    chipActive: { backgroundColor: C.accent, borderColor: C.accent },
    chipText: { fontSize: 13, fontWeight: '700', color: C.muted },
    chipActiveText: { color: '#fff' },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
    itemName: { color: C.text, fontSize: 14, fontWeight: '700' },
    itemMeta: { color: C.muted, fontSize: 11, marginTop: 2 },
    minLabel: { color: C.warning, fontSize: 10, fontWeight: '700', marginRight: 8 },
    writeOffBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(102,126,234,0.12)', alignItems: 'center', justifyContent: 'center' },
    modalSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
    modalTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    modalNote: { color: C.muted, fontSize: 13, marginTop: 4, marginBottom: 16 },
    quickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    quickName: { color: C.text, fontWeight: '700' },
    quickQty: { color: C.muted, fontSize: 12 },
    closeBtn: { marginTop: 16, padding: 14, backgroundColor: C.bg, borderRadius: 14, alignItems: 'center' },
    closeBtnText: { color: C.muted, fontWeight: '700' },
    writeOffSheet: { width: '85%', backgroundColor: C.card, borderRadius: 24, padding: 24 },
    input: { borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, marginTop: 12 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.bg },
    confirmBtn: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: C.primary },
});
