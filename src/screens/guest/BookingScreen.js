import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, TextInput, Alert, Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTelegram } from '../../telegram/TelegramProvider';
import api from '../../api/client';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#ff6b6b',
  background: '#f8f5f5',
  white: '#FFFFFF',
  text: '#1a1a2e',
  textMuted: '#94a3b8',
  cardShadow: 'rgba(0,0,0,0.06)',
  border: '#f0ecec',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
};

function formatDateDisplay(date) {
  const d = new Date(date);
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function getWeekday(date) {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[new Date(date).getDay()];
}

export default function BookingScreen({ navigation }) {
  const { user } = useAuth();
  const { telegramUser } = useTelegram();

  const [available, setAvailable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [guestCount, setGuestCount] = useState(2);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(telegramUser?.first_name || '');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const slug = user?.restaurant_slug;

  const fetchAvailability = useCallback(async (date, guests) => {
    try {
      setLoading(true);
      const params = { date };
      if (guests) params.guests = guests;
      const response = await api.get(`/booking/${slug}/availability/`, { params });
      setAvailable(response.data);
      if (!selectedDate) setSelectedDate(response.data.selected_date);
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.message || 'Не удалось загрузить доступность');
    } finally {
      setLoading(false);
    }
  }, [slug, selectedDate]);

  useFocusEffect(useCallback(() => {
    if (slug) {
      const today = new Date().toISOString().split('T')[0];
      fetchAvailability(today, null);
    }
  }, [slug]));

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowForm(false);
    fetchAvailability(date, guestCount || null);
  };

  const handleGuestsChange = (val) => {
    const g = Math.max(1, Math.min(20, parseInt(val) || 1));
    setGuestCount(g);
    if (selectedDate) fetchAvailability(selectedDate, g);
  };

  const handleSlotSelect = (slot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Ошибка', 'Имя и телефон обязательны');
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.post(`/booking/${slug}/`, {
        booking_date: selectedDate,
        booking_time: selectedSlot.time,
        guest_count: guestCount,
        client_name: name.trim(),
        client_phone: phone.trim(),
        client_telegram: telegramUser?.id ? String(telegramUser.id) : null,
        occasion: occasion.trim(),
        notes: notes.trim(),
      });
      Alert.alert(
        'Столик забронирован!',
        `${response.data.booking.table_number}\n${selectedSlot.time}, ${formatDateDisplay(selectedDate)}\nНа ${guestCount} гостей`,
        [{ text: 'OK', onPress: () => navigation.navigate('MyBookings') }]
      );
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error || 'Не удалось создать бронь');
    } finally {
      setSubmitting(false);
    }
  };

  if (!slug) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <MaterialIcons name="error-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>Ресторан не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Бронирование столика</Text>

        {available && !available.enabled && (
          <View style={styles.disabledBanner}>
            <MaterialIcons name="block" size={24} color={COLORS.textMuted} />
            <Text style={styles.disabledText}>Бронирование временно недоступно</Text>
          </View>
        )}

        {available?.enabled && (
          <>
            {/* Guest Count */}
            <View style={styles.guestsRow}>
              <Text style={styles.label}>Гостей</Text>
              <View style={styles.guestsControl}>
                <TouchableOpacity
                  style={styles.guestBtn}
                  onPress={() => handleGuestsChange(guestCount - 1)}
                >
                  <MaterialIcons name="remove" size={20} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.guestCount}>{guestCount}</Text>
                <TouchableOpacity
                  style={styles.guestBtn}
                  onPress={() => handleGuestsChange(guestCount + 1)}
                >
                  <MaterialIcons name="add" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Picker */}
            <Text style={styles.label}>Дата</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {available.dates?.map((d) => {
                const isSelected = selectedDate === d.date;
                return (
                  <TouchableOpacity
                    key={d.date}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                    onPress={() => handleDateChange(d.date)}
                  >
                    <Text style={[styles.dateWeekday, isSelected && styles.dateWeekdaySelected]}>
                      {d.weekday}
                    </Text>
                    <Text style={[styles.dateLabel, isSelected && styles.dateLabelSelected]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
            ) : (
              <View style={styles.slotsGrid}>
                {available.slots?.map((slot) => (
                  <TouchableOpacity
                    key={slot.time}
                    style={[
                      styles.slotCard,
                      !slot.is_available && styles.slotDisabled,
                      selectedSlot?.time === slot.time && styles.slotSelected,
                    ]}
                    onPress={() => handleSlotSelect(slot)}
                    disabled={!slot.is_available}
                  >
                    <Text style={[
                      styles.slotTime,
                      !slot.is_available && styles.slotTimeDisabled,
                      selectedSlot?.time === slot.time && styles.slotTimeSelected,
                    ]}>
                      {slot.time}
                    </Text>
                    <Text style={[
                      styles.slotCount,
                      !slot.is_available && styles.slotCountDisabled,
                    ]}>
                      {slot.is_available
                        ? `${slot.available_tables_count} стол.`
                        : 'Занято'}
                    </Text>
                  </TouchableOpacity>
                ))}
                {available.slots?.length === 0 && (
                  <Text style={styles.noSlots}>Нет доступных слотов на эту дату</Text>
                )}
              </View>
            )}

            {/* Booking Form */}
            {showForm && selectedSlot && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {selectedSlot.time}, {formatDateDisplay(selectedDate)}, {guestCount} гостей
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ваше имя"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Телефон"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Повод (необязательно)"
                  placeholderTextColor={COLORS.textMuted}
                  value={occasion}
                  onChangeText={setOccasion}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Пожелания (необязательно)"
                  placeholderTextColor={COLORS.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitText}>Забронировать</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.myBookingsFab}
        onPress={() => navigation.navigate('MyBookings')}
      >
        <MaterialIcons name="event-note" size={20} color={COLORS.white} />
        <Text style={styles.myBookingsText}>Мои брони</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textMuted, marginTop: 12 },
  disabledBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 24, backgroundColor: COLORS.white, borderRadius: 16, gap: 8,
  },
  disabledText: { fontSize: 15, color: COLORS.textMuted },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  guestsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  guestsControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  guestCount: { fontSize: 20, fontWeight: '700', color: COLORS.text, minWidth: 32, textAlign: 'center' },
  dateScroll: { marginBottom: 8 },
  dateChip: {
    width: 56, height: 72, borderRadius: 14, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  dateChipSelected: { backgroundColor: COLORS.primary },
  dateWeekday: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  dateWeekdaySelected: { color: COLORS.white },
  dateLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  dateLabelSelected: { color: COLORS.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  slotCard: {
    width: (width - 42) / 3, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.white,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  slotDisabled: { backgroundColor: '#f5f5f5', opacity: 0.6 },
  slotSelected: { backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#e55a5a' },
  slotTime: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  slotTimeDisabled: { color: COLORS.textMuted },
  slotTimeSelected: { color: COLORS.white },
  slotCount: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  slotCountDisabled: { color: '#cbd5e1' },
  noSlots: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', width: '100%', marginTop: 24 },
  form: {
    marginTop: 24, backgroundColor: COLORS.white, borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  formTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  input: {
    height: 48, backgroundColor: COLORS.background, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: COLORS.text, marginBottom: 10,
  },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  submitBtn: {
    height: 52, backgroundColor: COLORS.primary, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  myBookingsFab: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.text, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
  },
  myBookingsText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
});
