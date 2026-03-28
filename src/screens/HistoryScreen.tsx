import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { DriveSession, EventType } from '../types';
import { StorageService } from '../services/StorageService';
import { colors } from '../theme/colors';

const EVENT_COLOR: Record<EventType, string> = {
  POTHOLE: colors.pothole,
  SPEED_BUMP: colors.speedBump,
  HARD_BRAKING: colors.hardBraking,
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(start: number, end: number | null): string {
  if (!end) return '—';
  const mins = Math.round((end - start) / 60000);
  return mins < 1 ? '< 1 min' : `${mins} min`;
}

interface SessionCardProps {
  session: DriveSession;
  onDelete: (id: string) => void;
}

function SessionCard({ session, onDelete }: SessionCardProps) {
  const confirmed = session.events.filter(e => e.confirmed !== false);
  const counts = confirmed.reduce((acc, e) => {
    const type = e.correctedType ?? e.type;
    return { ...acc, [type]: (acc[type] ?? 0) + 1 };
  }, {} as Record<string, number>);

  const handleDelete = () => {
    Alert.alert('Delete Drive', 'Remove this drive from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(session.id),
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardDate}>{formatDate(session.startTime)}</Text>
          <Text style={styles.cardTime}>
            {formatTime(session.startTime)} ·{' '}
            {formatDuration(session.startTime, session.endTime)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteIcon}>⊖</Text>
        </TouchableOpacity>
      </View>

      {/* Event summary */}
      {confirmed.length === 0 ? (
        <Text style={styles.noEvents}>No confirmed events</Text>
      ) : (
        <View style={styles.countRow}>
          {(Object.entries(counts) as [EventType, number][]).map(
            ([type, count]) => (
              <View key={type} style={styles.countChip}>
                <View
                  style={[
                    styles.countDot,
                    { backgroundColor: EVENT_COLOR[type] },
                  ]}
                />
                <Text style={styles.countText}>{count}</Text>
                <Text style={styles.countLabel}>
                  {type === 'POTHOLE'
                    ? 'Pothole'
                    : type === 'SPEED_BUMP'
                    ? 'Speed Bump'
                    : 'Hard Braking'}
                </Text>
              </View>
            ),
          )}
        </View>
      )}

      {!session.reviewed && (
        <View style={styles.unreviewedBadge}>
          <Text style={styles.unreviewedText}>Unreviewed</Text>
        </View>
      )}
    </View>
  );
}

export function HistoryScreen() {
  const [sessions, setSessions] = useState<DriveSession[]>([]);

  const loadSessions = useCallback(async () => {
    const data = await StorageService.getSessions();
    setSessions(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const handleDelete = async (id: string) => {
    await StorageService.deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          {sessions.length} drive{sessions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <SessionCard session={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◎</Text>
            <Text style={styles.emptyTitle}>No Drives Yet</Text>
            <Text style={styles.emptyText}>
              Start a drive from the home tab to begin tracking.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  cardTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteIcon: {
    fontSize: 18,
    color: colors.textTertiary,
  },
  noEvents: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  countLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreviewedBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.warning + '22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.warning + '44',
  },
  unreviewedText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
