export type EventType = 'POTHOLE' | 'SPEED_BUMP' | 'HARD_BRAKING';

export interface DetectionEvent {
  id: string;
  timestamp: number;
  type: EventType;
  magnitude: number;
  speedMph?: number;
  coord?: [number, number];
  confirmed: boolean | null; // null = pending review
  correctedType?: EventType;
}

export interface DriveSession {
  id: string;
  startTime: number;
  endTime: number | null;
  events: DetectionEvent[];
  reviewed: boolean;
}

export interface AppSettings {
  sensitivity: number;       // 0.0 (low) to 1.0 (high)
  speedThresholdEnabled: boolean;
  minSpeedMph: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  sensitivity: 0.5,
  speedThresholdEnabled: false,
  minSpeedMph: 10,
};

export const EVENT_LABELS: Record<EventType, string> = {
  POTHOLE: 'Pothole',
  SPEED_BUMP: 'Speed Bump',
  HARD_BRAKING: 'Hard Braking',
};
