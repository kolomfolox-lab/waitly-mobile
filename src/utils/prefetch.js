import { useEffect } from 'react';
import { getOrders, getTables, getTodayBookings } from '../api/apiService';
import { coffeeBaristaOrders } from '../services/coffeeApi';

const CACHE = {};

export function getCached(key) {
  return CACHE[key] || null;
}

function setCache(key, data) {
  CACHE[key] = { data, ts: Date.now() };
}

export function isCacheFresh(key, ttlMs = 30000) {
  const entry = CACHE[key];
  if (!entry) return false;
  return Date.now() - entry.ts < ttlMs;
}

export async function prefetchUserData(user) {
  const slug = user?.restaurant?.slug;
  const promises = [];

  if (user?.role === 'BARISTA' && slug) {
    promises.push(
      coffeeBaristaOrders(slug).then(d => setCache('barista_orders', d)).catch(() => {}),
    );
  }

  if (['WAITER', 'HEAD_WAITER', 'HOSTESS'].includes(user?.role)) {
    promises.push(
      Promise.all([
        getOrders().then(d => setCache('orders', d)).catch(() => {}),
        getTables().then(d => setCache('tables', d)).catch(() => {}),
        getTodayBookings().then(d => setCache('bookings', d)).catch(() => {}),
      ]),
    );
  }

  if (['CHEF', 'COOK', 'HEAD_CHEF', 'KITCHEN_MANAGER'].includes(user?.role)) {
    promises.push(
      getOrders({ page_size: 100 }).then(d => setCache('kitchen_orders', d)).catch(() => {}),
    );
  }

  await Promise.allSettled(promises);
}

export function usePrefetch(user) {
  useEffect(() => {
    if (user) {
      prefetchUserData(user);
    }
  }, [user]);
}
