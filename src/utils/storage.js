import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

const KEY_PREFIX = 'waitly_';

const secureStorage = {
  getItem: async (key) => {
    try { return await SecureStore.getItemAsync(KEY_PREFIX + key); } catch { return null; }
  },
  setItem: async (key, value) => {
    try { await SecureStore.setItemAsync(KEY_PREFIX + key, value); } catch {}
  },
  removeItem: async (key) => {
    try { await SecureStore.deleteItemAsync(KEY_PREFIX + key); } catch {}
  },
  multiRemove: async (keys) => {
    for (const key of keys) {
      try { await SecureStore.deleteItemAsync(KEY_PREFIX + key); } catch {}
    }
  },
  multiSet: async (pairs) => {
    for (const [key, value] of pairs) {
      try { await SecureStore.setItemAsync(KEY_PREFIX + key, value); } catch {}
    }
  },
};

const webStorage = {
  // localStorage, НЕ sessionStorage: вход один раз (регистрация),
  // дальше месяцы тихих входов. sessionStorage умирал вместе с вкладкой
  // мини-аппа — персонал вынужден был регаться КАЖДЫЙ ДЕНЬ.
  // Refresh-токен живёт 30 дней (JWT_REFRESH_DAYS) и ротируется,
  // кнопка «Выйти» чистит всё вручную.
  getItem: async (key) => {
    try { return localStorage.getItem(KEY_PREFIX + key); } catch { return null; }
  },
  setItem: async (key, value) => {
    try { localStorage.setItem(KEY_PREFIX + key, value); } catch {}
  },
  removeItem: async (key) => {
    try { localStorage.removeItem(KEY_PREFIX + key); } catch {}
  },
  multiRemove: async (keys) => {
    try { keys.forEach(k => localStorage.removeItem(KEY_PREFIX + k)); } catch {}
  },
  multiSet: async (pairs) => {
    try { pairs.forEach(([k, v]) => localStorage.setItem(KEY_PREFIX + k, v)); } catch {}
  },
};

const Storage = isWeb ? webStorage : secureStorage;
export default Storage;
