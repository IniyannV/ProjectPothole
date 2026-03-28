import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {useFocusEffect} from '@react-navigation/native';
import {AppSettings} from '../types';
import {StorageService} from '../services/StorageService';
import {sensitivityToThreshold} from '../services/DetectionService';
import {colors} from '../theme/colors';

const SENSITIVITY_LABELS = ['Low', 'Medium', 'High'];

function getSensitivityLabel(val: number): string {
  if (val < 0.33) return SENSITIVITY_LABELS[0];
  if (val < 0.67) return SENSITIVITY_LABELS[1];
  return SENSITIVITY_LABELS[2];
}

interface RowProps {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Row({label, subtitle, children}: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useFocusEffect(
    useCallback(() => {
      StorageService.getSettings().then(setSettings);
    }, []),
  );

  const update = async (patch: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = {...settings, ...patch};
    setSettings(updated);
    await StorageService.saveSettings(updated);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear All History',
      'This will permanently delete all saved drives. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const sessions = await StorageService.getSessions();
            await Promise.all(sessions.map(s => StorageService.deleteSession(s.id)));
            Alert.alert('Done', 'All drive history cleared.');
          },
        },
      ],
    );
  };

  if (!settings) return null;

  const threshold = sensitivityToThreshold(settings.sensitivity).toFixed(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Detection */}
        <Text style={styles.sectionHeader}>Detection</Text>
        <View style={styles.group}>
          <View style={styles.sensitivityContainer}>
            <View style={styles.sensitivityHeader}>
              <Text style={styles.rowLabel}>Sensitivity</Text>
              <Text style={styles.sensitivityValue}>
                {getSensitivityLabel(settings.sensitivity)}
                <Text style={styles.sensitivityThreshold}> · {threshold} m/s²</Text>
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={settings.sensitivity}
              onValueChange={val => setSettings(prev => prev ? {...prev, sensitivity: val} : prev)}
              onSlidingComplete={val => update({sensitivity: val})}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.white}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Low</Text>
              <Text style={styles.sliderLabelText}>Medium</Text>
              <Text style={styles.sliderLabelText}>High</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Row
            label="Speed Threshold"
            subtitle={
              settings.speedThresholdEnabled
                ? `Detect only above ${settings.minSpeedMph} mph`
                : 'Detect at any speed'
            }>
            <Switch
              value={settings.speedThresholdEnabled}
              onValueChange={val => update({speedThresholdEnabled: val})}
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor={colors.white}
            />
          </Row>
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>Detection Logic</Text>
        <View style={styles.group}>
          <View style={styles.infoBlock}>
            <InfoRow icon="◉" label="Pothole" desc="Short vertical spike < 350ms" color={colors.pothole} />
            <InfoRow icon="▲" label="Speed Bump" desc="Sustained vertical lift ≥ 350ms" color={colors.speedBump} />
            <InfoRow icon="■" label="Hard Braking" desc="Dominant longitudinal deceleration" color={colors.hardBraking} />
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.rowSubtitle}>Debounce</Text>
            <Text style={styles.rowSubtitle}>2 seconds between events</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.rowSubtitle}>Sample rate</Text>
            <Text style={styles.rowSubtitle}>50 Hz</Text>
          </View>
        </View>

        {/* Data */}
        <Text style={styles.sectionHeader}>Data</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearHistory} activeOpacity={0.7}>
            <Text style={styles.dangerText}>Clear All Drive History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({icon, label, desc, color}: {icon: string; label: string; desc: string; color: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoIcon, {color}]}>{icon}</Text>
      <Text style={[styles.infoLabel, {color}]}>{label}</Text>
      <Text style={styles.infoDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
  },
  group: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sensitivityContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sensitivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sensitivityValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  sensitivityThreshold: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  infoBlock: {
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoIcon: {
    fontSize: 12,
    width: 16,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 100,
  },
  infoDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  dangerText: {
    fontSize: 15,
    color: colors.danger,
    fontWeight: '500',
  },
});
