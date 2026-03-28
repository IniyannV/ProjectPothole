import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { User } from 'firebase/auth';
import {
  CommunityHotspot,
  DEFAULT_USER_SETTINGS,
  UserAppData,
  UserSettings,
  ensureUserDataInitialized,
  listCommunityHotspots,
  updateUserSettings,
} from '../services/userData';
import { syncReviewedSessionToFirestore } from '../services/detectionSync';
import { DriveSession } from '../src/types';

type AppDataContextValue = {
  userData: UserAppData | null;
  communityHotspots: CommunityHotspot[];
  isAppDataLoading: boolean;
  appDataError: string | null;
  refreshUserData: () => Promise<void>;
  saveSettings: (next: UserSettings) => Promise<void>;
  syncReviewedSession: (session: DriveSession) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(
  undefined,
);

type AppDataProviderProps = {
  user: User;
  children: React.ReactNode;
};

export function AppDataProvider({ user, children }: AppDataProviderProps) {
  const [userData, setUserData] = useState<UserAppData | null>(null);
  const [communityHotspots, setCommunityHotspots] = useState<
    CommunityHotspot[]
  >([]);
  const [isAppDataLoading, setIsAppDataLoading] = useState(true);
  const [appDataError, setAppDataError] = useState<string | null>(null);

  const refreshUserData = useCallback(async () => {
    setIsAppDataLoading(true);
    setAppDataError(null);
    try {
      const [data, hotspots] = await Promise.all([
        ensureUserDataInitialized(user),
        listCommunityHotspots(),
      ]);
      setUserData(data);
      setCommunityHotspots(hotspots);
    } catch (error) {
      const fallback = 'Unable to load your account data.';
      const message = error instanceof Error ? error.message : fallback;
      setAppDataError(message || fallback);
    } finally {
      setIsAppDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const saveSettings = useCallback(
    async (next: UserSettings) => {
      await updateUserSettings(user.uid, next);
      setUserData(prev => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          settings: next,
          updatedAtMs: Date.now(),
        };
      });
    },
    [user.uid],
  );

  const syncReviewedSession = useCallback(
    async (session: DriveSession) => {
      const settings = userData?.settings ?? DEFAULT_USER_SETTINGS;

      await syncReviewedSessionToFirestore(user.uid, session, settings);
      await refreshUserData();
    },
    [refreshUserData, user.uid, userData?.settings],
  );

  const value = useMemo(
    () => ({
      userData,
      communityHotspots,
      isAppDataLoading,
      appDataError,
      refreshUserData,
      saveSettings,
      syncReviewedSession,
    }),
    [
      userData,
      communityHotspots,
      isAppDataLoading,
      appDataError,
      refreshUserData,
      saveSettings,
      syncReviewedSession,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return value;
}
