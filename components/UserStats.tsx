import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface StatItem {
  icon: string;
  value: number | string;
}

interface UserStatsProps {
  reports?: number | string;
  coins?: number | string;
  detections?: number | string;
  repairs?: number | string;
}

export default function UserStats({
  reports = 0,
  coins = 0,
  detections = 0,
  repairs = 0,
}: UserStatsProps) {
  const stats: StatItem[] = [
    { icon: 'person',         value: reports    },
    { icon: 'cash',           value: coins      },
    { icon: 'document-text',  value: detections },
    { icon: 'construct',      value: repairs    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <View style={styles.iconCircle}>
            <Ionicons name={stat.icon} size={22} color="#ffffff" />
          </View>
          <Text style={styles.value}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#e8eaed',
    borderRadius: 40,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3d3d3d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
});
