import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl,
  ScrollView, Animated, Easing, Dimensions, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import { SkeletonDashboard, SkeletonOrderCard } from '../../components/common/Skeleton';
import { coffeeBaristaOrders, coffeeAcceptOrder, coffeeReadyOrder } from '../../services/coffeeApi';

const COLORS = {
  primary: '#ff6b6b',
  primaryLight: 'rgba(255, 107, 107, 0.15)',
  backgroundLight: '#f8f5f5',
  success: '#52D681',
  info: '#4EA8DE',
  warning: '#F7B731',
  white: '#FFFFFF',
  textDark: '#0f172a',
  textMuted: '#94a3b8',
  slate800: '#1e293b',
  slate700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
};

const { width } = Dimensions.get('window');

export default function BaristaDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const pollingRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const slug = user?.restaurant?.slug || 'brew-coffee';
      const data = await coffeeBaristaOrders(slug);
      setOrders(data);
    } catch (e) {
      console.log('Fetch orders failed:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    pollingRef.current = setInterval(fetchOrders, 5000);
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') fetchOrders();
      appState.current = nextState;
    });
    return () => { clearInterval(pollingRef.current); sub?.remove(); };
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  const handleAccept = async (id) => {
    try {
      await coffeeAcceptOrder(id);
      fetchOrders();
    } catch (e) { /* ignore */ }
  };

  const handleReady = async (id) => {
    try {
      await coffeeReadyOrder(id);
      fetchOrders();
    } catch (e) { /* ignore */ }
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Только что';
    if (diff < 60) return `${diff} мин назад`;
    return `${Math.floor(diff / 60)} ч назад`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const activeOrders = orders.filter(o => o.status !== 'PICKED_UP' && o.status !== 'CANCELLED');
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Бариста'}!</Text>
            <Text style={styles.timeText}>
              {activeOrders.length > 0
                ? `${activeOrders.length} активных заказа`
                : 'Новых заказов нет'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity style={styles.logoutIconBtn} onPress={logout}>
              <MaterialIcons name="logout" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('ProfileTab')}>
              <UserAvatar
                fullName={user?.full_name}
                size={44}
                fallbackBackgroundColor={COLORS.primary}
                fallbackTextColor={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats bar */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{orders.length}</Text>
              <Text style={styles.statLabel}>Сегодня</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: COLORS.warning }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Ожидают</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: COLORS.success }]}>
                {orders.filter(o => o.status === 'PREPARING').length}
              </Text>
              <Text style={styles.statLabel}>Готовятся</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: COLORS.info }]}>
                {orders.filter(o => o.status === 'READY').length}
              </Text>
              <Text style={styles.statLabel}>Готово</Text>
            </View>
          </View>
        </Animated.View>

        {/* Orders list */}
        <View style={styles.ordersSection}>
          <Text style={styles.sectionTitle}>Активные заказы</Text>

          {loading ? (
            <View style={{ paddingTop: 8 }}>
              <SkeletonOrderCard />
              <SkeletonOrderCard />
              <SkeletonOrderCard />
            </View>
          ) : activeOrders.length === 0 ? (
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <MaterialIcons name="coffee" size={64} color={COLORS.slate200} />
              <Text style={styles.emptyTitle}>Все заказы готовы!</Text>
              <Text style={styles.emptyText}>Новые заказы появятся здесь автоматически</Text>
            </Animated.View>
          ) : (
            activeOrders.map((item) => {
              const isPreparing = item.status === 'PREPARING';
              return (
                <Animated.View key={item.id} style={{ opacity: fadeAnim }}>
                  <LinearGradient
                    colors={isPreparing ? ['#fff9e6', '#fff'] : [COLORS.white, '#fafafa']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.orderCard}
                  >
                    <View style={styles.orderHeader}>
                      <View style={styles.orderDishRow}>
                        <View style={[styles.statusDot, { backgroundColor: isPreparing ? COLORS.warning : COLORS.primary }]} />
                        <Text style={styles.orderDish}>{item.dish_name}</Text>
                        <View style={styles.qtyBadge}>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                        </View>
                      </View>
                      <Text style={styles.orderTime}>{getTimeAgo(item.created_at)}</Text>
                    </View>

                    {item.modifiers?.length > 0 && (
                      <View style={styles.modifiersRow}>
                        {item.modifiers.map((m, i) => (
                          <View key={i} style={styles.modBadge}>
                            <Text style={styles.modText}>{m.option || m.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {item.guest_name && (
                      <View style={styles.guestRow}>
                        <MaterialIcons name="person" size={14} color={COLORS.slate400} />
                        <Text style={styles.guestName}>{item.guest_name}</Text>
                      </View>
                    )}

                    <View style={styles.orderActions}>
                      {!isPreparing ? (
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)} activeOpacity={0.8}>
                          <LinearGradient
                            colors={[COLORS.primary, '#ff8a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionGradient}
                          >
                            <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
                            <Text style={styles.actionText}>Принять</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.readyBtn} onPress={() => handleReady(item.id)} activeOpacity={0.8}>
                          <LinearGradient
                            colors={['#F7B731', '#f5a623']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionGradient}
                          >
                            <MaterialIcons name="coffee" size={20} color={COLORS.white} />
                            <Text style={styles.actionText}>Готово</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  </LinearGradient>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  greeting: { fontSize: 26, fontWeight: '800', color: COLORS.textDark, letterSpacing: -0.5 },
  timeText: { fontSize: 14, color: COLORS.textMuted, marginTop: 4, fontWeight: '500' },
  avatarBtn: { borderRadius: 22, overflow: 'hidden' },
  logoutIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.slate100,
    justifyContent: 'center', alignItems: 'center',
  },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    backgroundColor: COLORS.white, borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statNumber: { fontSize: 22, fontWeight: '800', color: COLORS.textDark },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },

  ordersSection: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 12 },

  orderCard: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderDishRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  orderDish: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  qtyBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 1, marginLeft: 8,
  },
  qtyText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  orderTime: { fontSize: 12, color: COLORS.textMuted },

  modifiersRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  modBadge: {
    backgroundColor: COLORS.slate100, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 4,
    borderWidth: 1, borderColor: COLORS.slate200,
  },
  modText: { fontSize: 12, color: COLORS.slate500, fontWeight: '500' },

  guestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  guestName: { fontSize: 13, color: COLORS.slate500, marginLeft: 4, fontWeight: '500' },

  orderActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  readyBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  actionGradient: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, gap: 6,
  },
  actionText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginTop: 16 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 6, textAlign: 'center' },
});
