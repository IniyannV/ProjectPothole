import { DriveSession, DetectionEvent, EventType } from '../src/types';
import { getFirebaseApp } from './firebaseAuth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { CommunityHotspot, HotspotType } from './userData';

const HOTSPOTS_COLLECTION = 'hotspots';
const USERS_COLLECTION = 'users';
const GROUPING_DISTANCE_METERS = 35;

type Severity = 'low' | 'medium' | 'high';

type EventWithCoord = DetectionEvent & { coord: [number, number] };

type SessionGroup = {
  coord: [number, number];
  reports: number;
  severity: Severity;
  type: HotspotType;
};

type ExistingHotspot = {
  id: string;
  coord: [number, number];
  reports: number;
  severity: Severity;
  type: HotspotType;
};

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: [number, number], b: [number, number]): number {
  const earthRadius = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const haversine =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function severityRank(value: Severity): number {
  if (value === 'high') {
    return 3;
  }

  if (value === 'medium') {
    return 2;
  }

  return 1;
}

function strongestSeverity(a: Severity, b: Severity): Severity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

function eventToSeverity(type: EventType): Severity {
  if (type === 'POTHOLE') {
    return 'high';
  }

  if (type === 'SPEED_BUMP') {
    return 'medium';
  }

  return 'low';
}

function eventToHotspotType(type: EventType): HotspotType {
  if (type === 'POTHOLE') {
    return 'pothole';
  }

  if (type === 'SPEED_BUMP') {
    return 'rough';
  }

  return 'monitored';
}

function severityToColor(severity: Severity): string {
  if (severity === 'high') {
    return '#E24B4A';
  }

  if (severity === 'medium') {
    return '#EF9F27';
  }

  return '#378ADD';
}

function buildGroups(events: EventWithCoord[]): SessionGroup[] {
  const groups: SessionGroup[] = [];

  events.forEach(event => {
    const effectiveType = event.correctedType ?? event.type;
    const severity = eventToSeverity(effectiveType);
    const hotspotType = eventToHotspotType(effectiveType);

    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;

    groups.forEach((group, index) => {
      const distance = distanceMeters(group.coord, event.coord);
      if (distance <= GROUPING_DISTANCE_METERS && distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex === -1) {
      groups.push({
        coord: event.coord,
        reports: 1,
        severity,
        type: hotspotType,
      });
      return;
    }

    const target = groups[nearestIndex];
    const nextReports = target.reports + 1;

    target.coord = [
      (target.coord[0] * target.reports + event.coord[0]) / nextReports,
      (target.coord[1] * target.reports + event.coord[1]) / nextReports,
    ];
    target.reports = nextReports;
    const targetSeverityRank = severityRank(target.severity);
    target.severity = strongestSeverity(target.severity, severity);
    target.type =
      severityRank(severity) > targetSeverityRank
        ? hotspotType
        : target.type;
  });

  return groups;
}

function makeHotspotName(type: HotspotType, severity: Severity): string {
  const typeLabel =
    type === 'pothole'
      ? 'Pothole'
      : type === 'rough'
      ? 'Rough Road'
      : type === 'good'
      ? 'Smooth Patch'
      : 'Monitored Zone';

  const severityLabel =
    severity === 'high' ? 'High' : severity === 'medium' ? 'Medium' : 'Low';

  return `${severityLabel} ${typeLabel}`;
}

function toRecentLabel(type: EventType): string {
  if (type === 'POTHOLE') {
    return 'Pothole report';
  }
  if (type === 'SPEED_BUMP') {
    return 'Rough road report';
  }
  return 'Monitored braking event';
}

function toEventWithCoord(event: DetectionEvent): EventWithCoord | null {
  if (
    !Array.isArray(event.coord) ||
    event.coord.length !== 2 ||
    typeof event.coord[0] !== 'number' ||
    typeof event.coord[1] !== 'number'
  ) {
    return null;
  }

  return {
    ...event,
    coord: [event.coord[0], event.coord[1]],
  };
}

export async function syncReviewedSessionToFirestore(
  uid: string,
  session: DriveSession,
): Promise<void> {
  const db = getFirestore(getFirebaseApp());
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const sessionDocRef = doc(db, USERS_COLLECTION, uid, 'sessions', session.id);

  const confirmedEvents = session.events
    .filter(event => event.confirmed === true)
    .map(toEventWithCoord)
    .filter((event): event is EventWithCoord => event != null);

  const groups = buildGroups(confirmedEvents);

  const hotspotSnapshot = await getDocs(collection(db, HOTSPOTS_COLLECTION));
  const existing: ExistingHotspot[] = hotspotSnapshot.docs
    .map(item => {
      const raw = item.data() as Partial<CommunityHotspot>;
      if (
        !raw ||
        !Array.isArray(raw.coord) ||
        raw.coord.length !== 2 ||
        typeof raw.coord[0] !== 'number' ||
        typeof raw.coord[1] !== 'number' ||
        typeof raw.reports !== 'number' ||
        (raw.severity !== 'low' &&
          raw.severity !== 'medium' &&
          raw.severity !== 'high') ||
        (raw.type !== 'pothole' &&
          raw.type !== 'rough' &&
          raw.type !== 'good' &&
          raw.type !== 'monitored')
      ) {
        return null;
      }

      return {
        id: item.id,
        coord: [raw.coord[0], raw.coord[1]] as [number, number],
        reports: raw.reports,
        severity: raw.severity,
        type: raw.type,
      };
    })
    .filter((item): item is ExistingHotspot => item != null);

  await runTransaction(db, async transaction => {
    const existingSession = await transaction.get(sessionDocRef);
    if (existingSession.exists()) {
      return;
    }

    const now = Date.now();

    transaction.set(
      sessionDocRef,
      {
        ...session,
        reviewed: true,
        syncedAtMs: now,
        confirmedEventCount: confirmedEvents.length,
      },
      { merge: true },
    );

    if (groups.length > 0) {
      const mutableHotspots: ExistingHotspot[] = [...existing];

      groups.forEach(group => {
        let nearestIndex = -1;
        let nearestDistance = Number.POSITIVE_INFINITY;

        mutableHotspots.forEach((hotspot, index) => {
          const distance = distanceMeters(hotspot.coord, group.coord);
          if (distance <= GROUPING_DISTANCE_METERS && distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        if (nearestIndex >= 0) {
          const target = mutableHotspots[nearestIndex];
          const nextReports = target.reports + group.reports;
          const nextCoord: [number, number] = [
            (target.coord[0] * target.reports + group.coord[0] * group.reports) /
              nextReports,
            (target.coord[1] * target.reports + group.coord[1] * group.reports) /
              nextReports,
          ];

          const nextSeverity = strongestSeverity(target.severity, group.severity);
          const nextType =
            severityRank(group.severity) > severityRank(target.severity)
              ? group.type
              : target.type;

          const hotspotRef = doc(db, HOTSPOTS_COLLECTION, target.id);
          transaction.set(
            hotspotRef,
            {
              coord: nextCoord,
              reports: increment(group.reports),
              severity: nextSeverity,
              type: nextType,
              name: makeHotspotName(nextType, nextSeverity),
              color: severityToColor(nextSeverity),
              updatedAtMs: now,
            },
            { merge: true },
          );

          target.coord = nextCoord;
          target.reports = nextReports;
          target.severity = nextSeverity;
          target.type = nextType;
          return;
        }

        const newDocRef = doc(collection(db, HOTSPOTS_COLLECTION));
        transaction.set(newDocRef, {
          name: makeHotspotName(group.type, group.severity),
          type: group.type,
          severity: group.severity,
          reports: group.reports,
          cost: '$2.3k',
          color: severityToColor(group.severity),
          coord: group.coord,
          updatedAtMs: now,
          createdAtMs: now,
          createdBy: uid,
        });

        mutableHotspots.push({
          id: newDocRef.id,
          coord: group.coord,
          reports: group.reports,
          severity: group.severity,
          type: group.type,
        });
      });
    }

    const potholeDetections = confirmedEvents.filter(event => {
      const effectiveType = event.correctedType ?? event.type;
      return effectiveType === 'POTHOLE';
    }).length;

    const recentDetections = confirmedEvents
      .slice(-5)
      .reverse()
      .map(event => {
        const effectiveType = event.correctedType ?? event.type;
        return {
          id: `${session.id}-${event.id}`,
          locationName: toRecentLabel(effectiveType),
          address: `${event.coord[1].toFixed(5)}, ${event.coord[0].toFixed(5)}`,
        };
      });

    transaction.set(
      userDocRef,
      {
        updatedAtMs: now,
        stats: {
          reports: increment(confirmedEvents.length),
          detections: increment(confirmedEvents.length),
          potholes: increment(potholeDetections),
          points: increment(confirmedEvents.length * 5),
        },
        recentDetections,
      },
      { merge: true },
    );
  });
}
