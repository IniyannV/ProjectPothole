import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseApp } from './firebaseAuth';

type AuthUserIdentity = Pick<User, 'uid' | 'displayName' | 'email'>;

export type DetectionItem = {
  id: string;
  locationName: string;
  address: string;
};

export type HotspotType = 'pothole' | 'rough' | 'good' | 'monitored';

export type MapHotspot = {
  id: number;
  name: string;
  type: HotspotType;
  severity: 'low' | 'medium' | 'high';
  reports: number;
  cost: string;
  color: string;
  coord: [number, number];
};

export type UserSettings = {
  sensingDriving: boolean;
  notifications: boolean;
  debugMode: boolean;
  modelTraining: boolean;
  hapticFeedback: boolean;
  autoReport: boolean;
  sensitivity: 'Low' | 'Medium' | 'High' | 'Max';
};

export type UserStats = {
  reports: number;
  coins: number;
  detections: number;
  repairs: number;
  potholes: number;
  points: number;
  accuracy: number;
};

export type UserAppData = {
  uid: string;
  name: string;
  email: string;
  profileRole: string;
  createdAtMs: number;
  updatedAtMs: number;
  settings: UserSettings;
  stats: UserStats;
  recentDetections: DetectionItem[];
  mapHotspots: MapHotspot[];
};

const db = getFirestore(getFirebaseApp());

const COLLECTION_USERS = 'users';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  sensingDriving: false,
  notifications: true,
  debugMode: true,
  modelTraining: true,
  hapticFeedback: true,
  autoReport: false,
  sensitivity: 'High',
};

export const DEFAULT_USER_STATS: UserStats = {
  reports: 0,
  coins: 0,
  detections: 0,
  repairs: 0,
  potholes: 0,
  points: 0,
  accuracy: 0,
};

const DEFAULT_PROFILE_ROLE = 'Road Contributor · Level 1';

function getUserDocRef(uid: string) {
  return doc(db, COLLECTION_USERS, uid);
}

function sanitizeDetectionItem(value: unknown): DetectionItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<DetectionItem>;
  if (
    typeof item.id !== 'string' ||
    typeof item.locationName !== 'string' ||
    typeof item.address !== 'string'
  ) {
    return null;
  }

  return {
    id: item.id,
    locationName: item.locationName,
    address: item.address,
  };
}

function sanitizeHotspot(value: unknown): MapHotspot | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Partial<MapHotspot>;
  if (
    typeof item.id !== 'number' ||
    typeof item.name !== 'string' ||
    (item.type !== 'pothole' &&
      item.type !== 'rough' &&
      item.type !== 'good' &&
      item.type !== 'monitored') ||
    (item.severity !== 'low' && item.severity !== 'medium' && item.severity !== 'high') ||
    typeof item.reports !== 'number' ||
    typeof item.cost !== 'string' ||
    typeof item.color !== 'string' ||
    !Array.isArray(item.coord) ||
    item.coord.length !== 2 ||
    typeof item.coord[0] !== 'number' ||
    typeof item.coord[1] !== 'number'
  ) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    type: item.type,
    severity: item.severity,
    reports: item.reports,
    cost: item.cost,
    color: item.color,
    coord: [item.coord[0], item.coord[1]],
  };
}

function buildDefaultUserData(authUser: AuthUserIdentity): UserAppData {
  const now = Date.now();
  const fallbackName =
    authUser.displayName ||
    authUser.email?.split('@')[0] ||
    'Road Contributor';

  return {
    uid: authUser.uid,
    name: fallbackName,
    email: authUser.email || '',
    profileRole: DEFAULT_PROFILE_ROLE,
    createdAtMs: now,
    updatedAtMs: now,
    settings: { ...DEFAULT_USER_SETTINGS },
    stats: { ...DEFAULT_USER_STATS },
    recentDetections: [],
    mapHotspots: [],
  };
}

function normalizeUserData(authUser: AuthUserIdentity, raw: unknown): UserAppData {
  const fallback = buildDefaultUserData(authUser);
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const source = raw as Partial<UserAppData>;
  const sourceSettings = source.settings as Partial<UserSettings> | undefined;
  const sourceStats = source.stats as Partial<UserStats> | undefined;

  const recentDetections = Array.isArray(source.recentDetections)
    ? source.recentDetections
        .map(sanitizeDetectionItem)
        .filter((item): item is DetectionItem => item != null)
    : [];

  const mapHotspots = Array.isArray(source.mapHotspots)
    ? source.mapHotspots
        .map(sanitizeHotspot)
        .filter((item): item is MapHotspot => item != null)
    : [];

  return {
    uid: authUser.uid,
    name:
      typeof source.name === 'string' && source.name.trim().length > 0
        ? source.name
        : fallback.name,
    email:
      typeof source.email === 'string'
        ? source.email
        : fallback.email,
    profileRole:
      typeof source.profileRole === 'string' && source.profileRole.trim().length > 0
        ? source.profileRole
        : fallback.profileRole,
    createdAtMs:
      typeof source.createdAtMs === 'number'
        ? source.createdAtMs
        : fallback.createdAtMs,
    updatedAtMs: Date.now(),
    settings: {
      sensingDriving:
        typeof sourceSettings?.sensingDriving === 'boolean'
          ? sourceSettings.sensingDriving
          : DEFAULT_USER_SETTINGS.sensingDriving,
      notifications:
        typeof sourceSettings?.notifications === 'boolean'
          ? sourceSettings.notifications
          : DEFAULT_USER_SETTINGS.notifications,
      debugMode:
        typeof sourceSettings?.debugMode === 'boolean'
          ? sourceSettings.debugMode
          : DEFAULT_USER_SETTINGS.debugMode,
      modelTraining:
        typeof sourceSettings?.modelTraining === 'boolean'
          ? sourceSettings.modelTraining
          : DEFAULT_USER_SETTINGS.modelTraining,
      hapticFeedback:
        typeof sourceSettings?.hapticFeedback === 'boolean'
          ? sourceSettings.hapticFeedback
          : DEFAULT_USER_SETTINGS.hapticFeedback,
      autoReport:
        typeof sourceSettings?.autoReport === 'boolean'
          ? sourceSettings.autoReport
          : DEFAULT_USER_SETTINGS.autoReport,
      sensitivity:
        sourceSettings?.sensitivity === 'Low' ||
        sourceSettings?.sensitivity === 'Medium' ||
        sourceSettings?.sensitivity === 'High' ||
        sourceSettings?.sensitivity === 'Max'
          ? sourceSettings.sensitivity
          : DEFAULT_USER_SETTINGS.sensitivity,
    },
    stats: {
      reports:
        typeof sourceStats?.reports === 'number'
          ? sourceStats.reports
          : DEFAULT_USER_STATS.reports,
      coins:
        typeof sourceStats?.coins === 'number'
          ? sourceStats.coins
          : DEFAULT_USER_STATS.coins,
      detections:
        typeof sourceStats?.detections === 'number'
          ? sourceStats.detections
          : DEFAULT_USER_STATS.detections,
      repairs:
        typeof sourceStats?.repairs === 'number'
          ? sourceStats.repairs
          : DEFAULT_USER_STATS.repairs,
      potholes:
        typeof sourceStats?.potholes === 'number'
          ? sourceStats.potholes
          : DEFAULT_USER_STATS.potholes,
      points:
        typeof sourceStats?.points === 'number'
          ? sourceStats.points
          : DEFAULT_USER_STATS.points,
      accuracy:
        typeof sourceStats?.accuracy === 'number'
          ? sourceStats.accuracy
          : DEFAULT_USER_STATS.accuracy,
    },
    recentDetections,
    mapHotspots,
  };
}

export async function ensureUserDataInitialized(authUser: User): Promise<UserAppData> {
  const ref = getUserDocRef(authUser.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const fresh = buildDefaultUserData(authUser);
    await setDoc(ref, fresh);
    return fresh;
  }

  const raw = snapshot.data();
  const normalized = normalizeUserData(authUser, raw);
  await setDoc(ref, normalized, { merge: true });

  return normalized;
}

export async function getUserData(uid: string): Promise<UserAppData | null> {
  const ref = getUserDocRef(uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }

  const fallbackAuthLike: AuthUserIdentity = {
    uid,
    displayName: null,
    email: null,
  };

  return normalizeUserData(fallbackAuthLike, snapshot.data());
}

export async function updateUserSettings(
  uid: string,
  nextSettings: UserSettings,
): Promise<void> {
  const ref = getUserDocRef(uid);
  await setDoc(
    ref,
    {
      settings: nextSettings,
      updatedAtMs: Date.now(),
    },
    { merge: true },
  );
}
