import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

let mmkvInstance: any = null;

try {
  const { createMMKV } = require('react-native-mmkv');
  mmkvInstance = createMMKV({ id: 'genesis-store' });
} catch {
  // MMKV not available (Expo Go) — fall back to AsyncStorage
}

export const mmkvStorage: StateStorage = mmkvInstance
  ? {
      getItem: (name: string) => {
        const value = mmkvInstance.getString(name);
        return value ?? null;
      },
      setItem: (name: string, value: string) => {
        mmkvInstance.set(name, value);
      },
      removeItem: (name: string) => {
        mmkvInstance.remove(name);
      },
    }
  : {
      getItem: async (name: string) => {
        return (await AsyncStorage.getItem(name)) ?? null;
      },
      setItem: async (name: string, value: string) => {
        await AsyncStorage.setItem(name, value);
      },
      removeItem: async (name: string) => {
        await AsyncStorage.removeItem(name);
      },
    };
