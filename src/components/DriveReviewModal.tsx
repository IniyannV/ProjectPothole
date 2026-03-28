import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {DriveSession, DetectionEvent, EventType, EVENT_LABELS} from '../types';
import {colors} from '../theme/colors';

const EVENT_COLOR: Record<EventType, string> = {
  POTHOLE: colors.pothole,
  SPEED_BUMP: colors.speedBump,
  HARD_BRAKING: colors.hardBraking,
};

const ALL_TYPES: EventType[] = ['POTHOLE', 'SPEED_BUMP', 'HARD_BRAKING'];

interface Props {
  session: DriveSession;
  onConfirm: (reviewed: DriveSession) => void;
  onDismiss: () => void;
}

export function DriveReviewModal({session, onConfirm, onDismiss}: Props) {
  const [events, setEvents] = useState<DetectionEvent[]>(
    session.events.map(e => ({...e, confirmed: true})),
  );

  const toggleConfirm = (id: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === id ? {...e, confirmed: !e.confirmed} : e)),
    );
  };

  const setType = (id: string, type: EventType) => {
    setEvents(prev =>
      prev.map(e => (e.id === id ? {...e, correctedType: type} : e)),
    );
  };

  const handleConfirm = () => {
    onConfirm({...session, events, reviewed: true});
  };

  const confirmedCount = events.filter(e => e.confirmed).length;
  const driveMins = session.endTime
    ? Math.round((session.endTime - session.startTime) / 60000)
    : 0;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Review Drive</Text>
            <Text style={styles.headerSub}>
              {driveMins} min · {session.events.length} event{session.events.length !== 1 ? 's' : ''} detected
            </Text>
          </View>
          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instruction}>
          Confirm which events were real. Tap the type to correct the label.
        </Text>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No events detected this drive.</Text>
            </View>
          ) : (
            events.map((event, idx) => (
              <View key={event.id} style={[styles.eventCard, !event.confirmed && styles.eventCardDimmed]}>
                <View style={styles.eventCardHeader}>
                  <Text style={styles.eventIndex}>#{idx + 1}</Text>
                  <Text style={styles.eventTime}>
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.eventMag}>{event.magnitude.toFixed(1)} m/s²</Text>
                  <TouchableOpacity
                    style={[styles.confirmToggle, event.confirmed && styles.confirmToggleActive]}
                    onPress={() => toggleConfirm(event.id)}>
                    <Text style={[styles.confirmToggleText, event.confirmed && styles.confirmToggleTextActive]}>
                      {event.confirmed ? '✓' : '✗'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Type selector */}
                <View style={styles.typeRow}>
                  {ALL_TYPES.map(type => {
                    const active = (event.correctedType ?? event.type) === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeChip,
                          active && {backgroundColor: EVENT_COLOR[type] + '22', borderColor: EVENT_COLOR[type]},
                        ]}
                        onPress={() => setType(event.id, type)}
                        disabled={!event.confirmed}>
                        <Text style={[styles.typeChipText, active && {color: EVENT_COLOR[type]}]}>
                          {EVENT_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerNote}>{confirmedCount} of {events.length} confirmed</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.8}>
            <Text style={styles.confirmButtonText}>Save Drive</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dismissBtn: {
    paddingVertical: 4,
    paddingLeft: 16,
  },
  dismissText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  instruction: {
    fontSize: 13,
    color: colors.textTertiary,
    paddingHorizontal: 24,
    marginBottom: 16,
    lineHeight: 18,
  },
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  eventCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventCardDimmed: {
    opacity: 0.4,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  eventIndex: {
    fontSize: 12,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  eventTime: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  eventMag: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  confirmToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmToggleActive: {
    borderColor: colors.success,
    backgroundColor: colors.success + '22',
  },
  confirmToggleText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '700',
  },
  confirmToggleTextActive: {
    color: colors.success,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeChipText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 12,
  },
  footerNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
