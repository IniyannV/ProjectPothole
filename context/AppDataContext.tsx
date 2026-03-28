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
  UserAppData,
  UserSettings,
  ensureUserDataInitialized,
  updateUserSettings,
} from '../services/userData';

type AppDataContextValue = {
  userData: UserAppData | null;
  isAppDataLoading: boolean;
  appDataError: string | null;
  refreshUserData: () => Promise<void>;
  saveSettings: (next: UserSettings) => Promise<void>;
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
  const [isAppDataLoading, setIsAppDataLoading] = useState(true);
  const [appDataError, setAppDataError] = useState<string | null>(null);

  const refreshUserData = useCallback(async () => {
    setIsAppDataLoading(true);
    setAppDataError(null);
    try {
      const data = await ensureUserDataInitialized(user);
      setUserData(data);
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

  const value = useMemo(
    () => ({
      userData,
      isAppDataLoading,
      appDataError,
      refreshUserData,
      saveSettings,
    }),
    [userData, isAppDataLoading, appDataError, refreshUserData, saveSettings],
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
