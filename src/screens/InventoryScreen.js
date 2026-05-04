import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { inventoryAPI } from '../services/inventoryService';

const COLORS = {
  primary: '#ff7a59',
  primaryLight: 'rgba(255, 122, 89, 0.14)',
  success: '#10b981',
  background: '#f8fafc',
  white: '#FFFFFF',
  textDark: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

const getIngredientName = (item) => item.ingredient?.name || item.ingredient_name || 'Ingredient';
const getIngredientUnit = (item) => item.ingredient?.unit || item.unit || '';

export default function InventoryScreen() {
  const [stock, setStock] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [stockRes, ingredientsRes] = await Promise.all([
        inventoryAPI.getStock(),
        inventoryAPI.getIngredients(),
      ]);
      setStock(stockRes || []);
      setIngredients(ingredientsRes || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Inventory unavailable', 'Could not load stock. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedIngredient(null);
    setQuantity('');
  };

  const handleAddIncoming = async () => {
    if (!selectedIngredient || !quantity) {
      Alert.alert('Missing data', 'Choose an ingredient and enter quantity.');
      return;
    }

    const parsedQuantity = Number.parseFloat(quantity.replace(',', '.'));
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid quantity', 'Quantity must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await inventoryAPI.addIncoming(selectedIngredient, parsedQuantity);
      closeModal();
      loadData();
      Alert.alert('Saved', 'Stock receipt was added.');
    } catch (error) {
      console.error('Error saving inventory receipt:', error);
      Alert.alert('Save failed', 'Could not add stock receipt.');
    } finally {
      setSaving(false);
    }
  };

  const renderStockItem = ({ item }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockInfo}>
        <Text style={styles.ingredientName}>{getIngredientName(item)}</Text>
        <Text style={styles.unitText}>Unit: {getIngredientUnit(item) || '-'}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityText}>
          {item.quantity} {getIngredientUnit(item)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Inventory</Text>
          <Text style={styles.title}>Stock control</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <MaterialIcons name="add" size={26} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={stock}
        renderItem={renderStockItem}
        keyExtractor={(item, index) => String(item.id || item.ingredient?.id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No stock records yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add stock receipt</Text>

            <Text style={styles.label}>Ingredient</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ingredientChips}
            >
              {ingredients.length === 0 && (
                <Text style={styles.emptyChipText}>Create ingredients in owner dashboard first.</Text>
              )}
              {ingredients.map((ingredient) => {
                const active = selectedIngredient === ingredient.id;
                return (
                  <TouchableOpacity
                    key={ingredient.id}
                    style={[styles.ingredientChip, active && styles.ingredientChipActive]}
                    onPress={() => setSelectedIngredient(ingredient.id)}
                  >
                    <Text style={[styles.ingredientChipText, active && styles.ingredientChipTextActive]}>
                      {ingredient.name} ({ingredient.unit})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0.000"
              keyboardType="decimal-pad"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
                onPress={handleAddIncoming}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save receipt'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  stockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  stockInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  unitText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  quantityContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  ingredientChips: {
    gap: 8,
    paddingBottom: 16,
  },
  ingredientChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  ingredientChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  ingredientChipText: {
    color: COLORS.textDark,
    fontWeight: '600',
  },
  ingredientChipTextActive: {
    color: COLORS.primary,
  },
  emptyChipText: {
    color: COLORS.textMuted,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: COLORS.textDark,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
  },
  cancelButtonText: {
    color: COLORS.textDark,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
