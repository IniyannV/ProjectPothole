import {useState, useEffect, useRef, useCallback} from 'react';
import {accelerometer, setUpdateIntervalForType, SensorTypes} from 'react-native-sensors';
import Geolocation from '@react-native-community/geolocation';
import {Subscription} from 'rxjs';
import {DriveSession, DetectionEvent, AppSettings} from '../types';
import {DetectionEngine, sensitivityToThreshold} from '../services/DetectionService';
import {StorageService} from '../services/StorageService';
import {HapticService} from '../services/HapticService';

const SAMPLE_INTERVAL_MS = 20; // ~50Hz

export function useDriveSession() {
  const [activeSession, setActiveSession] = useState<DriveSession | null>(null);
  const [lastEvent, setLastEvent] = useState<DetectionEvent | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);

  const engineRef = useRef(new DetectionEngine());
  const subscriptionRef = useRef<Subscription | null>(null);
  const sessionRef = useRef<DriveSession | null>(null);
  const geoWatchRef = useRef<number | null>(null);
  const speedRef = useRef<number>(0);
  const coordRef = useRef<[number, number] | null>(null);
  const settingsRef = useRef<AppSettings | null>(null);

  useEffect(() => {
    StorageService.getSettings().then(s => {
      setSettings(s);
      settingsRef.current = s;
    });
    const unsubscribeSettings = StorageService.subscribeSettings(next => {
      setSettings(next);
      settingsRef.current = next;
    });
    StorageService.getActiveSession().then(s => {
      if (s) {
        setActiveSession(s);
        sessionRef.current = s;
        startAccelerometer();
      }
    });
    return () => {
      unsubscribeSettings();
      stopAccelerometer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSettings = useCallback(async () => {
    const s = await StorageService.getSettings();
    setSettings(s);
    settingsRef.current = s;
  }, []);

  const startAccelerometer = useCallback(() => {
    engineRef.current.reset();
    setUpdateIntervalForType(SensorTypes.accelerometer, SAMPLE_INTERVAL_MS);

    subscriptionRef.current = accelerometer.subscribe(({x, y, z}) => {
      const s = settingsRef.current;
      if (!s) return;

      // Speed gate
      if (s.speedThresholdEnabled) {
        const speedMs = speedRef.current * 0.44704; // mph → m/s
        if (speedMs < s.minSpeedMph * 0.44704) return;
      }

      const threshold = sensitivityToThreshold(s.sensitivity);
      const result = engineRef.current.process(x, y, z, threshold);

      if (result && sessionRef.current) {
        const event: DetectionEvent = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          confirmed: null,
          speedMph: Number.isFinite(speedRef.current) ? speedRef.current : 0,
          coord: coordRef.current ?? undefined,
          ...result,
        };

        const updated: DriveSession = {
          ...sessionRef.current,
          events: [...sessionRef.current.events, event],
        };
        sessionRef.current = updated;
        setActiveSession({...updated});
        setLastEvent(event);
        StorageService.setActiveSession(updated);
        HapticService.impact();
      }
    });
  }, []);

  const stopAccelerometer = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    if (geoWatchRef.current !== null) {
      Geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }
  }, []);

  const startLocationWatch = useCallback(() => {
    Geolocation.requestAuthorization();
    geoWatchRef.current = Geolocation.watchPosition(
      pos => {
        const mph = (pos.coords.speed ?? 0) * 2.23694;
        speedRef.current = mph;
        coordRef.current = [pos.coords.longitude, pos.coords.latitude];
        setCurrentSpeed(mph);
      },
      _err => {},
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 500,
      },
    );
  }, []);

  const startSession = useCallback(async () => {
    const session: DriveSession = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      endTime: null,
      events: [],
      reviewed: false,
    };
    sessionRef.current = session;
    setActiveSession(session);
    setLastEvent(null);
    await StorageService.setActiveSession(session);
    await refreshSettings();
    startLocationWatch();
    startAccelerometer();
  }, [startAccelerometer, startLocationWatch, refreshSettings]);

  const endSession = useCallback(async (): Promise<DriveSession | null> => {
    stopAccelerometer();
    if (!sessionRef.current) return null;

    const finished: DriveSession = {
      ...sessionRef.current,
      endTime: Date.now(),
    };
    sessionRef.current = null;
    setActiveSession(null);
    await StorageService.setActiveSession(null);
    return finished;
  }, [stopAccelerometer]);

  const confirmSession = useCallback(async (session: DriveSession) => {
    const reviewed = {...session, reviewed: true};
    await StorageService.saveSession(reviewed);
  }, []);

  const dismissLastEvent = useCallback(() => setLastEvent(null), []);

  return {
    activeSession,
    lastEvent,
    settings,
    currentSpeed,
    startSession,
    endSession,
    confirmSession,
    refreshSettings,
    dismissLastEvent,
  };
}
