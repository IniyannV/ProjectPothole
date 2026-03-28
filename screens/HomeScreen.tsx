import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DetectionAlert from '../components/DetectionAlert';
import UserStats from '../components/UserStats';

interface Detection {
  id: string;
  locationName: string;
  address: string;
}

const MOCK_DETECTIONS: Detection[] = [
  { id: '1', locationName: 'Coppell High School', address: '938-940 W Bethel Rd' },
  { id: '2', locationName: 'Coppell High School', address: '938-940 W Bethel Rd' },
  { id: '3', locationName: 'Town Center Park',    address: '768 W Main St'        },
];

export default function HomeScreen() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = MOCK_DETECTIONS.filter(d => !dismissed.includes(d.id));
  const dismiss = (id: string) => setDismissed(prev => [...prev, id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Recent Insights</Text>

        <UserStats reports={100} coins={100} detections={100} repairs={100} />

        <View style={styles.cardList}>
          {visible.map(detection => (
            <DetectionAlert
              key={detection.id}
              locationName={detection.locationName}
              address={detection.address}
              onConfirm={() => dismiss(detection.id)}
              onDeny={() => dismiss(detection.id)}
            />
          ))}

          {visible.length === 0 && (
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
});
