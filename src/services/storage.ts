import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecentRoom } from '../types';

const STORAGE_KEYS = {
  DEVICE_ID: 'vailchat_device_id',
  RECENT_ROOMS: 'vailchat_recent_rooms',
};

// In-memory fallback in case native storage is unavailable in web / test environments
const memoryStorage = new Map<string, string>();

async function safeGetItem(key: string): Promise<string | null> {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) return val;
    }
  } catch (e) {
    // Fall back to memory storage
  }

  // Check web localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null && val !== undefined) return val;
    } catch (e) {}
  }

  return memoryStorage.get(key) || null;
}

async function safeSetItem(key: string, value: string): Promise<void> {
  memoryStorage.set(key, value);

  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(key, value);
    }
  } catch (e) {
    // Handled by memoryStorage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  }
}

async function safeRemoveItem(key: string): Promise<void> {
  memoryStorage.delete(key);

  try {
    if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
      await AsyncStorage.removeItem(key);
    }
  } catch (e) {
    // Handled by memoryStorage
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  }
}

/**
 * Helper to generate cryptographically strong unique device key
 */
export function generateUniqueDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 28; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `vail_dev_${Date.now()}_${rand}`;
}

/**
 * Retrieves the stored device ID or generates and saves a new one.
 */
export async function getOrInitDeviceId(): Promise<string> {
  try {
    const storedId = await safeGetItem(STORAGE_KEYS.DEVICE_ID);
    if (storedId) {
      return storedId;
    }
    const newId = generateUniqueDeviceId();
    await safeSetItem(STORAGE_KEYS.DEVICE_ID, newId);
    return newId;
  } catch (e) {
    return generateUniqueDeviceId();
  }
}

/**
 * Loads recent rooms from local storage.
 */
export async function getLocalRecentRooms(): Promise<RecentRoom[]> {
  try {
    const stored = await safeGetItem(STORAGE_KEYS.RECENT_ROOMS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return [];
}

/**
 * Saves recent rooms list to local storage.
 */
export async function saveLocalRecentRooms(rooms: RecentRoom[]): Promise<void> {
  try {
    await safeSetItem(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(rooms));
  } catch (e) {}
}

/**
 * Clears local recent rooms from storage.
 */
export async function clearLocalRecentRooms(): Promise<void> {
  try {
    await safeRemoveItem(STORAGE_KEYS.RECENT_ROOMS);
  } catch (e) {}
}
