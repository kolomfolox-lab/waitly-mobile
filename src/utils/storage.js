import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const webStorage = {
  getItem: async (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: async (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem: async (key) => {
    try { localStorage.removeItem(key); } catch {}
  },
  multiRemove: async (keys) => {
    try { keys.forEach(k => localStorage.removeItem(k)); } catch {}
  },
};

const Storage = isWeb ? webStorage : AsyncStorage;
export default Storage;
