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
};

const webStorage = {
  getItem: async (key) => {
    try { return sessionStorage.getItem(KEY_PREFIX + key); } catch { return null; }
  },
  setItem: async (key, value) => {
    try { sessionStorage.setItem(KEY_PREFIX + key, value); } catch {}
  },
  removeItem: async (key) => {
    try { sessionStorage.removeItem(KEY_PREFIX + key); } catch {}
  },
  multiRemove: async (keys) => {
    try { keys.forEach(k => sessionStorage.removeItem(KEY_PREFIX + k)); } catch {}
  },
};

const Storage = isWeb ? webStorage : secureStorage;
export default Storage;
