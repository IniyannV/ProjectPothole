import {EventType, DetectionEvent} from '../types';

const GRAVITY = 9.81;
const EMA_ALPHA = 0.05;       // slow EMA for gravity estimation
const SMOOTH_ALPHA = 0.3;     // fast EMA for spike smoothing
const DEBOUNCE_MS = 2000;
const SPIKE_WINDOW_MS = 600;  // window to measure spike duration

// Maps sensitivity [0, 1] → threshold in m/s² (inverted: high sensitivity = low threshold)
export function sensitivityToThreshold(sensitivity: number): number {
  return 4.5 - sensitivity * 3.5; // range: 4.5 (low) → 1.0 (high)
}

interface EMAState {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  initialized: boolean;
}

interface SpikeState {
  active: boolean;
  startTime: number;
  peakMagnitude: number;
  dominantAxis: {dx: number; dy: number; dz: number};
}

export class DetectionEngine {
  private gravity: EMAState = {x: 0, y: 0, z: GRAVITY, magnitude: 0, initialized: false};
  private smoothMagnitude = 0;
  private lastDetectionTime = 0;
  private spike: SpikeState = {
    active: false,
    startTime: 0,
    peakMagnitude: 0,
    dominantAxis: {dx: 0, dy: 0, dz: 0},
  };

  reset(): void {
    this.gravity = {x: 0, y: 0, z: GRAVITY, magnitude: 0, initialized: false};
    this.smoothMagnitude = 0;
    this.lastDetectionTime = 0;
    this.spike = {active: false, startTime: 0, peakMagnitude: 0, dominantAxis: {dx: 0, dy: 0, dz: 0}};
  }

  process(
    x: number,
    y: number,
    z: number,
    threshold: number,
  ): Omit<DetectionEvent, 'id' | 'confirmed'> | null {
    const now = Date.now();

    // Initialize gravity estimate on first sample
    if (!this.gravity.initialized) {
      this.gravity = {x, y, z, magnitude: 0, initialized: true};
      this.smoothMagnitude = 0;
      return null;
    }

    // Slow EMA tracks gravity component
    this.gravity.x = EMA_ALPHA * x + (1 - EMA_ALPHA) * this.gravity.x;
    this.gravity.y = EMA_ALPHA * y + (1 - EMA_ALPHA) * this.gravity.y;
    this.gravity.z = EMA_ALPHA * z + (1 - EMA_ALPHA) * this.gravity.z;

    // Dynamic (non-gravity) acceleration
    const dx = x - this.gravity.x;
    const dy = y - this.gravity.y;
    const dz = z - this.gravity.z;
    const rawMag = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Fast EMA for noise smoothing
    this.smoothMagnitude = SMOOTH_ALPHA * rawMag + (1 - SMOOTH_ALPHA) * this.smoothMagnitude;
    const magnitude = this.smoothMagnitude;

    // Track spike start
    if (!this.spike.active && magnitude > threshold) {
      this.spike = {
        active: true,
        startTime: now,
        peakMagnitude: magnitude,
        dominantAxis: {dx, dy, dz},
      };
    }

    // Update peak during active spike
    if (this.spike.active) {
      if (magnitude > this.spike.peakMagnitude) {
        this.spike.peakMagnitude = magnitude;
        this.spike.dominantAxis = {dx, dy, dz};
      }

      const spikeDuration = now - this.spike.startTime;

      // Spike ended (magnitude dropped below threshold or window expired)
      if (magnitude < threshold * 0.4 || spikeDuration > SPIKE_WINDOW_MS * 2) {
        this.spike.active = false;

        // Debounce check
        if (now - this.lastDetectionTime < DEBOUNCE_MS) {
          return null;
        }
        this.lastDetectionTime = now;

        const type = this.classifyEvent(
          this.spike.dominantAxis.dx,
          this.spike.dominantAxis.dy,
          this.spike.dominantAxis.dz,
          spikeDuration,
        );

        return {
          timestamp: now,
          type,
          magnitude: this.spike.peakMagnitude,
        };
      }
    }

    return null;
  }

  private classifyEvent(dx: number, dy: number, dz: number, durationMs: number): EventType {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const absDz = Math.abs(dz);

    // Hard braking: dominant in X axis (longitudinal) and significant negative dx
    if (absDx > absDz * 1.3 && absDx > absDy * 1.3 && dx < -1.0) {
      return 'HARD_BRAKING';
    }

    // Vertical event: Z dominant
    if (absDz > absDx && absDz > absDy) {
      // Short duration = pothole, longer = speed bump
      return durationMs < 350 ? 'POTHOLE' : 'SPEED_BUMP';
    }

    // Default to pothole for ambiguous cases
    return 'POTHOLE';
  }
}
