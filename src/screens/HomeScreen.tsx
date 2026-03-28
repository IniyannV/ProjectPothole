import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriveSession } from '../hooks/useDriveSession';
import { DetectionBanner } from '../components/DetectionBanner';
import { DriveReviewModal } from '../components/DriveReviewModal';
import { DriveSession, EventType, EVENT_LABELS } from '../types';
import { colors } from '../theme/colors';
import { DriveStackParamList } from '../navigation/DriveStackNavigator';

const EVENT_COLOR: Record<EventType, string> = {
  POTHOLE: colors.pothole,
  SPEED_BUMP: colors.speedBump,
  HARD_BRAKING: colors.hardBraking,
};

function formatDuration(startTime: number): string {
  const secs = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<DriveStackParamList>>();
  const {
    activeSession,
    lastEvent,
    currentSpeed,
    startSession,
    endSession,
    confirmSession,
    dismissLastEvent,
  } = useDriveSession();

  const [elapsed, setElapsed] = React.useState('00:00');
  const [pendingSession, setPendingSession] = useState<DriveSession | null>(
    null,
  );

  React.useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(
      () => setElapsed(formatDuration(activeSession.startTime)),
      1000,
    );
    return () => clearInterval(timer);
  }, [activeSession]);

  const handleStart = async () => {
    try {
      await startSession();
    } catch {
      Alert.alert('Error', 'Could not start session. Check permissions.');
    }
  };

  const handleStop = async () => {
    Alert.alert('End Drive', 'Stop tracking and review detected events?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Drive',
        style: 'destructive',
        onPress: async () => {
          const finished = await endSession();
          if (finished) setPendingSession(finished);
        },
      },
    ]);
  };

  const eventCounts = activeSession
    ? activeSession.events.reduce(
        (acc, e) => ({ ...acc, [e.type]: (acc[e.type] ?? 0) + 1 }),
        {} as Record<string, number>,
      )
    : {};

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <DetectionBanner event={lastEvent} onDismiss={dismissLastEvent} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.appTitle}> </Text>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('DriveHistory')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionText}>Drive History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('DriveSettings')}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionText}>Drive Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Session Status */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: activeSession
                  ? colors.success
                  : colors.textTertiary,
              },
            ]}
          />
          <Text style={styles.statusText}>
            {activeSession ? 'Drive Active' : 'Ready'}
          </Text>
          {activeSession && (
            <Text style={styles.speedBadge}>{currentSpeed.toFixed(0)} mph</Text>
          )}
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{activeSession ? elapsed : '00:00'}</Text>
          <Text style={styles.timerLabel}>Drive Duration</Text>
        </View>

        {/* Event Count Pills */}
        {activeSession && (
          <View style={styles.pillRow}>
            {(['POTHOLE', 'SPEED_BUMP', 'HARD_BRAKING'] as EventType[]).map(
              type => (
                <View
                  key={type}
                  style={[styles.pill, { borderColor: EVENT_COLOR[type] }]}
                >
                  <Text
                    style={[styles.pillCount, { color: EVENT_COLOR[type] }]}
                  >
                    {eventCounts[type] ?? 0}
                  </Text>
                  <Text style={styles.pillLabel}>{EVENT_LABELS[type]}</Text>
                </View>
              ),
            )}
          </View>
        )}

        {/* Recent Events */}
        {activeSession && activeSession.events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            {[...activeSession.events]
              .reverse()
              .slice(0, 5)
              .map(event => (
                <View key={event.id} style={styles.eventRow}>
                  <View
                    style={[
                      styles.eventDot,
                      { backgroundColor: EVENT_COLOR[event.type] },
                    ]}
                  />
                  <Text style={styles.eventType}>
                    {EVENT_LABELS[event.type]}
                  </Text>
                  <Text style={styles.eventMeta}>
                    {event.magnitude.toFixed(1)} m/s²
                  </Text>
                  <Text style={styles.eventTime}>
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* CTA */}
        <View
          style={[styles.ctaContainer, { paddingBottom: insets.bottom + 88 }]}
        >
          {!activeSession ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Start Drive</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStop}
              activeOpacity={0.8}
            >
              <Text style={styles.stopButtonText}>End Drive</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {pendingSession && (
        <DriveReviewModal
          session={pendingSession}
          onConfirm={async reviewed => {
            await confirmSession(reviewed);
            setPendingSession(null);
          }}
          onDismiss={() => setPendingSession(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickActionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  speedBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  timer: {
    fontSize: 72,
    fontWeight: '200',
    color: colors.white,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
    justifyContent: 'center',
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surfaceElevated,
  },
  pillCount: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pillLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 10,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventType: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  eventMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventTime: {
    fontSize: 12,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  ctaContainer: {
    marginTop: 8,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.3,
  },
  stopButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  stopButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.danger,
    letterSpacing: 0.3,
  },
});
