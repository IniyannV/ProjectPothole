import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { signOutFromFirebase } from '../services/firebaseAuth';
import {
  DEFAULT_USER_SETTINGS,
  DEFAULT_USER_STATS,
  UserSettings,
} from '../services/userData';

// ─── Types ───────────────────────────────────────────────────────────────────

type SettingToggleProps = {
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  icon: string;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  sublabel,
  value,
  onValueChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon,
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingText}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sublabel ? <Text style={styles.settingSubLabel}>{sublabel}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#2A2A2A', true: BLUE }}
      thumbColor={value ? '#FFFFFF' : '#888888'}
      ios_backgroundColor="#2A2A2A"
    />
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const { userData, isAppDataLoading, appDataError, saveSettings } =
    useAppData();

  const settings = userData?.settings ?? DEFAULT_USER_SETTINGS;
  const stats = userData?.stats ?? DEFAULT_USER_STATS;
  const displayName = userData?.name ?? 'Loading Profile';
  const profileRole = userData?.profileRole ?? 'Road Contributor · Level 1';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

  const setSetting = (key: keyof UserSettings) => async (value: boolean) => {
    const nextSettings: UserSettings = {
      ...settings,
      [key]: value,
    };

    try {
      await saveSettings(nextSettings);
    } catch {
      Alert.alert('Save Failed', 'Unable to update setting right now.');
    }
  };

  const setSensitivity = async (sensitivity: UserSettings['sensitivity']) => {
    try {
      await saveSettings({
        ...settings,
        sensitivity,
      });
    } catch {
      Alert.alert('Save Failed', 'Unable to update sensitivity right now.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently remove your data and pothole contribution history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'default',
        onPress: async () => {
          try {
            await signOutFromFirebase();
          } catch {
            Alert.alert('Sign Out Failed', 'Please try again in a moment.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials || 'RC'}</Text>
              </View>
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            {isAppDataLoading ? (
              <View style={styles.profileLoadingRow}>
                <ActivityIndicator size="small" color={BLUE} />
                <Text style={styles.profileLoadingText}>
                  Syncing profile...
                </Text>
              </View>
            ) : null}
            {appDataError ? (
              <Text style={styles.profileErrorText}>{appDataError}</Text>
            ) : null}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.potholes}</Text>
                <Text style={styles.statLbl}>Potholes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.points}</Text>
                <Text style={styles.statLbl}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{stats.accuracy}%</Text>
                <Text style={styles.statLbl}>Accuracy</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Detection Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETECTION</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="SD"
              label="Sense while driving"
              sublabel="Auto-detect potholes via accelerometer"
              value={settings.sensingDriving}
              onValueChange={setSetting('sensingDriving')}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="AR"
              label="Auto-report detections"
              sublabel="Submit flagged events without confirmation"
              value={settings.autoReport}
              onValueChange={setSetting('autoReport')}
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="HF"
              label="Haptic feedback"
              sublabel="Vibrate on pothole detection"
              value={settings.hapticFeedback}
              onValueChange={setSetting('hapticFeedback')}
            />
          </View>
        </View>

        {/* ── App Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="NT"
              label="Notifications"
              sublabel="Alerts for nearby road hazards"
              value={settings.notifications}
              onValueChange={setSetting('notifications')}
            />
            <View style={styles.divider} />
            <View style={styles.divider} />
            <SettingToggle
              icon="DB"
              label="Debug mode"
              sublabel="Show sensor data overlay on map"
              value={settings.debugMode}
              onValueChange={setSetting('debugMode')}
            />
          </View>
        </View>

        {/* ── Sensitivity Selector ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETECTION SENSITIVITY</Text>
          <View style={styles.card}>
            <View style={styles.sensitivityRow}>
              {['Low', 'Medium', 'High', 'Max'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.sensitivityBtn,
                    settings.sensitivity === level &&
                      styles.sensitivityBtnActive,
                  ]}
                  onPress={() =>
                    setSensitivity(level as UserSettings['sensitivity'])
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sensitivityBtnText,
                      settings.sensitivity === level &&
                        styles.sensitivityBtnTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sensitivityHint}>
              Higher sensitivity may increase false positives on rough roads.
            </Text>
          </View>
        </View>

        {/* ── Account Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>
          PotholeAI · Road Safety Initiative
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const ORANGE = '#FF6B35';
const BLUE = '#2563EB';
const BG = '#0E0E0F';
const CARD = '#1A1A1C';
const BORDER = '#2C2C2E';
const TEXT_PRIMARY = '#F5F5F5';
const TEXT_SECONDARY = '#888890';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  versionBadge: {
    backgroundColor: ORANGE + '25',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ORANGE + '40',
  },
  versionText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ORANGE,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ORANGE + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: ORANGE,
    fontSize: 20,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: CARD,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileRole: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  profileLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  profileLoadingText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  profileErrorText: {
    color: '#F87171',
    fontSize: 12,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
  statLbl: {
    color: TEXT_SECONDARY,
    fontSize: 10,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: BORDER,
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BLUE + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: BLUE,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '500',
  },
  settingSubLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 66,
  },

  // Sensitivity
  sensitivityRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  sensitivityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#232325',
    borderWidth: 1,
    borderColor: BORDER,
  },
  sensitivityBtnActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  sensitivityBtnText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
  sensitivityBtnTextActive: {
    color: '#FFFFFF',
  },
  sensitivityHint: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    paddingHorizontal: 16,
    paddingBottom: 14,
    lineHeight: 16,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  signOutBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  signOutBtnText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },

  // Footer
  footerText: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 0.3,
  },
});

export default SettingsScreen;
