import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DetectionAlert from '../components/DetectionAlert';
import UserStats from '../components/UserStats';
import { useAppData } from '../context/AppDataContext';
import { DEFAULT_USER_STATS } from '../services/userData';

export default function HomeScreen() {
  const { userData, isAppDataLoading, appDataError } = useAppData();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const detections = userData?.recentDetections ?? [];
  const stats = userData?.stats ?? DEFAULT_USER_STATS;

  const visible = useMemo(
    () => detections.filter(d => !dismissed.includes(d.id)),
    [detections, dismissed],
  );

  const dismiss = (id: string) => setDismissed(prev => [...prev, id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Recent Insights</Text>

        <UserStats
          reports={stats.reports}
          coins={stats.coins}
          detections={stats.detections}
          repairs={stats.repairs}
        />

        {appDataError ? (
          <Text style={styles.errorText}>{appDataError}</Text>
        ) : null}

        <View style={styles.cardList}>
          {isAppDataLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Loading your detections...</Text>
            </View>
          ) : null}

          {visible.map(detection => (
            <DetectionAlert
              key={detection.id}
              locationName={detection.locationName}
              address={detection.address}
              onConfirm={() => dismiss(detection.id)}
              onDeny={() => dismiss(detection.id)}
            />
          ))}

          {!isAppDataLoading && visible.length === 0 && (
            <Text style={styles.emptyText}>No pending detections</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
  cardList: {
    gap: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 32,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 13,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
});
