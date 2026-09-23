import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert, RefreshControl, Modal, Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTelegram } from '../../telegram/TelegramProvider';
import api from '../../api/client';
import { getBookingQrImage } from '../../api/hostess';

const QR_REFRESH_MS = 150000;

function BookingQrModal({ booking, onClose }) {
  const [qrSrc, setQrSrc] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(180);

  const load = useCallback(async () => {
    try {
      const src = await getBookingQrImage(booking.id);
      setQrSrc((prev) => {
        if (typeof prev === 'string' && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return src;
      });
      setSecondsLeft(180);
    } catch {
      Alert.alert('Ошибка', 'Не удалось получить QR');
      onClose();
    }
  }, [booking, onClose]);

  useEffect(() => {
    load();
    const timer = setInterval(load, QR_REFRESH_MS);
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      clearInterval(timer);
      clearInterval(tick);
      setQrSrc((prev) => {
        if (typeof prev === 'string' && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [load]);

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.qrWrap}>
        <View style={styles.qrModal}>
          <Text style={styles.qrTitle}>Покажите хостес</Text>
          <Text style={styles.qrSub}>Стол {booking.table_number} · {booking.booking_time}</Text>
          {qrSrc ? (
            <Image source={typeof qrSrc === 'string' ? { uri: qrSrc } : qrSrc} style={styles.qrImage} resizeMode="contain" />
          ) : (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 60 }} />
          )}
          <Text style={styles.qrTimer}>Обновится через {secondsLeft} с</Text>
          <TouchableOpacity style={styles.bookNowBtn} onPress={onClose}>
            <Text style={styles.bookNowText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
  blue: '#3b82f6',
};

const STATUS_MAP = {
  PENDING: { label: 'Ожидает', color: COLORS.orange, icon: 'hourglass-empty' },
  CONFIRMED: { label: 'Подтверждена', color: COLORS.green, icon: 'check-circle' },
  SEATED: { label: 'Гость на месте', color: COLORS.blue, icon: 'event-seat' },
  COMPLETED: { label: 'Завершена', color: COLORS.textMuted, icon: 'done-all' },
  CANCELLED: { label: 'Отменена', color: COLORS.red, icon: 'cancel' },
};

function formatDate(iso) {
  const d = new Date(iso);
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function MyBookingsScreen({ navigation }) {
  const { user } = useAuth();
  const { telegramUser } = useTelegram();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneFilter] = useState('');

  const slug = user?.restaurant_slug;
  const telegramId = telegramUser?.id ? String(telegramUser.id) : null;

  const fetchBookings = useCallback(async () => {
    try {
      const params = {};
      if (phoneFilter) params.phone = phoneFilter;
      else if (telegramId) params.telegram_id = telegramId;

      const response = await api.get(`/booking/${slug}/my/`, { params });
      setBookings(response.data.bookings || []);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить брони');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug, phoneFilter, telegramId]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchBookings();
  }, [fetchBookings]));

  const handleCancel = (booking) => {
    Alert.alert(
      'Отменить бронь?',
      `${booking.table_number}, ${booking.booking_time}, ${formatDate(booking.booking_date)}`,
      [
        { text: 'Нет', style: 'cancel' },
        {
          text: 'Да, отменить',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/booking/${slug}/my/${booking.id}/`, {
                data: { client_phone: booking.client_phone },
              });
              fetchBookings();
            } catch (err) {
              Alert.alert('Ошибка', err.response?.data?.error || 'Не удалось отменить');
            }
          },
        },
      ]
    );
  };

  const upcoming = bookings.filter(
    (b) => b.status === 'PENDING' || b.status === 'CONFIRMED'
  );
  const past = bookings.filter(
    (b) => b.status === 'SEATED' || b.status === 'COMPLETED' || b.status === 'CANCELLED'
  );

  const renderBooking = (booking) => {
    const st = STATUS_MAP[booking.status] || { label: booking.status, color: COLORS.textMuted, icon: 'help' };
    return (
      <View key={booking.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.tableBadge}>
            <MaterialIcons name="table-restaurant" size={18} color={COLORS.text} />
            <Text style={styles.tableText}>Стол {booking.table_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
            <MaterialIcons name={st.icon} size={14} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={16} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{formatDate(booking.booking_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="access-time" size={16} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{booking.booking_time}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="people" size={16} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{booking.guest_count} гостей</Text>
          </View>
          {booking.occasion ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="celebration" size={16} color={COLORS.textMuted} />
              <Text style={styles.infoText}>{booking.occasion}</Text>
            </View>
          ) : null}
          {booking.notes ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="notes" size={16} color={COLORS.textMuted} />
              <Text style={styles.infoText}>{booking.notes}</Text>
            </View>
          ) : null}
        </View>
        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
          <>
            <TouchableOpacity style={styles.qrBtn} onPress={() => setQrBooking(booking)}>
              <MaterialIcons name="qr-code-2" size={18} color={COLORS.primary} />
              <Text style={styles.qrText}>QR для входа</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(booking)}>
              <MaterialIcons name="close" size={18} color={COLORS.red} />
              <Text style={styles.cancelText}>Отменить</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const [qrBooking, setQrBooking] = useState(null);

  return (
    <SafeAreaView style={styles.container}>
      {qrBooking && <BookingQrModal booking={qrBooking} onClose={() => setQrBooking(null)} />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />}
      >
        <Text style={styles.title}>Мои брони</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Предстоящие</Text>
                {upcoming.map(renderBooking)}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>История</Text>
                {past.map(renderBooking)}
              </>
            )}
            {bookings.length === 0 && (
              <View style={styles.empty}>
                <MaterialIcons name="event-busy" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Нет броней</Text>
                <Text style={styles.emptySub}>Ваши брони появятся здесь</Text>
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => navigation.navigate('Booking')}
                >
                  <Text style={styles.bookNowText}>Забронировать столик</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  sectionTitle: {
    fontSize: 17, fontWeight: '600', color: COLORS.text,
    marginTop: 24, marginBottom: 12,
  },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, marginTop: 6, marginBottom: 24 },
  bookNowBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  bookNowText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tableBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tableText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: COLORS.text, flex: 1 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.red + '30',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: COLORS.red },
  qrBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.primary + '14',
  },
  qrText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  qrWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 },
  qrModal: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, alignItems: 'center' },
  qrTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  qrSub: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, marginBottom: 12 },
  qrImage: { width: 220, height: 220 },
  qrTimer: { fontSize: 13, color: COLORS.textMuted, marginTop: 10, marginBottom: 14 },
});
