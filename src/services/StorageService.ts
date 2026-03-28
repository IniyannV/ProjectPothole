import AsyncStorage from '@react-native-async-storage/async-storage';
import {DriveSession, AppSettings, DEFAULT_SETTINGS} from '../types';

const KEYS = {
  SESSIONS: 'drive_sessions',
  SETTINGS: 'app_settings',
  ACTIVE_SESSION: 'active_session',
};

export const StorageService = {
  async getSessions(): Promise<DriveSession[]> {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  },

  async saveSession(session: DriveSession): Promise<void> {
    const sessions = await StorageService.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  async deleteSession(id: string): Promise<void> {
    const sessions = await StorageService.getSessions();
    const filtered = sessions.filter(s => s.id !== id);
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(filtered));
  },

  async getSettings(): Promise<AppSettings> {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? {...DEFAULT_SETTINGS, ...JSON.parse(raw)} : DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async setActiveSession(session: DriveSession | null): Promise<void> {
    if (session) {
      await AsyncStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(KEYS.ACTIVE_SESSION);
    }
  },

  async getActiveSession(): Promise<DriveSession | null> {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  },
};
