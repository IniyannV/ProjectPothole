import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';

interface DetectionAlertProps {
  locationName: string;
  address: string;
  logo?: ImageSourcePropType;
  onConfirm: () => void;
  onDeny: () => void;
}

export default function DetectionAlert({
  locationName,
  address,
  logo,
  onConfirm,
  onDeny,
}: DetectionAlertProps) {
  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{locationName}</Text>
          <Text style={styles.address}>{address}</Text>
        </View>
        {logo && (
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        )}
      </View>

      <View style={styles.divider} />

      {/* Prompt */}
      <Text style={styles.prompt}>Accurate Detection?</Text>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={onConfirm}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={onDeny}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 260,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    marginRight: 10,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#6b7280',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  prompt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  denyButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
