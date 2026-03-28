import AsyncStorage from '@react-native-async-storage/async-storage';
import {DriveSession, AppSettings, DEFAULT_SETTINGS} from '../types';

type SettingsListener = (settings: AppSettings) => void;

const KEYS = {
  SESSIONS: 'drive_sessions',
  SETTINGS: 'app_settings',
  ACTIVE_SESSION: 'active_session',
};

const settingsListeners = new Set<SettingsListener>();

function normalizeSensitivity(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(1, Math.max(0, value));
  }

  if (value === 'Low') return 0.2;
  if (value === 'Medium') return 0.5;
  if (value === 'High') return 0.8;
  if (value === 'Max') return 1;

  return DEFAULT_SETTINGS.sensitivity;
}

function normalizeSettings(raw: unknown): AppSettings {
  const source =
    raw && typeof raw === 'object'
      ? (raw as Partial<AppSettings> & {sensitivity?: unknown})
      : {};

  return {
    sensitivity: normalizeSensitivity(source.sensitivity),
    speedThresholdEnabled:
      typeof source.speedThresholdEnabled === 'boolean'
        ? source.speedThresholdEnabled
        : DEFAULT_SETTINGS.speedThresholdEnabled,
    minSpeedMph:
      typeof source.minSpeedMph === 'number' && Number.isFinite(source.minSpeedMph)
        ? source.minSpeedMph
        : DEFAULT_SETTINGS.minSpeedMph,
  };
}

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
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      return normalizeSettings(JSON.parse(raw));
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const normalized = normalizeSettings(settings);
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(normalized));
    settingsListeners.forEach(listener => listener(normalized));
  },

  subscribeSettings(listener: SettingsListener): () => void {
    settingsListeners.add(listener);
    return () => {
      settingsListeners.delete(listener);
    };
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
