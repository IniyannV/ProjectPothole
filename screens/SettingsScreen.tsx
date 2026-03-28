import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type SettingToggleProps = {
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  icon: string;
  accentColor?: string;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  sublabel,
  value,
  onValueChange,
  icon,
  accentColor = '#FF6B35',
}) => (
  <View style={styles.settingRow}>
    <View style={[styles.settingIcon, { backgroundColor: accentColor + '20' }]}>
      <Text style={styles.settingIconText}>{icon}</Text>
    </View>
    <View style={styles.settingText}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sublabel ? <Text style={styles.settingSubLabel}>{sublabel}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#2A2A2A', true: accentColor }}
      thumbColor={value ? '#FFFFFF' : '#888888'}
      ios_backgroundColor="#2A2A2A"
    />
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
  const [sensingDriving, setSensingDriving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [debugMode, setDebugMode] = useState(true);
  const [modelTraining, setModelTraining] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoReport, setAutoReport] = useState(false);

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
      { text: 'Sign Out', style: 'default', onPress: () => {} },
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
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v2.4.1</Text>
            </View>
          </View>
        </View>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>AM</Text>
              </View>
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Aarnav Munji</Text>
            <Text style={styles.profileRole}>Road Contributor · Level 4</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>247</Text>
                <Text style={styles.statLbl}>Potholes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>18.2k</Text>
                <Text style={styles.statLbl}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>94%</Text>
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
              icon="🚗"
              label="Sense while driving"
              sublabel="Auto-detect potholes via accelerometer"
              value={sensingDriving}
              onValueChange={setSensingDriving}
              accentColor="#FF6B35"
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="📤"
              label="Auto-report detections"
              sublabel="Submit flagged events without confirmation"
              value={autoReport}
              onValueChange={setAutoReport}
              accentColor="#FF6B35"
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="📳"
              label="Haptic feedback"
              sublabel="Vibrate on pothole detection"
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              accentColor="#FF6B35"
            />
          </View>
        </View>

        {/* ── App Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.card}>
            <SettingToggle
              icon="🔔"
              label="Notifications"
              sublabel="Alerts for nearby road hazards"
              value={notifications}
              onValueChange={setNotifications}
              accentColor="#3B82F6"
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="🧠"
              label="Model training"
              sublabel="Contribute to improving AI detection"
              value={modelTraining}
              onValueChange={setModelTraining}
              accentColor="#3B82F6"
            />
            <View style={styles.divider} />
            <SettingToggle
              icon="🐛"
              label="Debug mode"
              sublabel="Show sensor data overlay on map"
              value={debugMode}
              onValueChange={setDebugMode}
              accentColor="#A855F7"
            />
          </View>
        </View>

        {/* ── Sensitivity Selector ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETECTION SENSITIVITY</Text>
          <View style={styles.card}>
            <View style={styles.sensitivityRow}>
              {['Low', 'Medium', 'High', 'Max'].map((level, i) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.sensitivityBtn,
                    i === 2 && styles.sensitivityBtnActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sensitivityBtnText,
                      i === 2 && styles.sensitivityBtnTextActive,
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
              <Text style={styles.deleteBtnText}>🗑  Delete Account</Text>
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

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {[
          { icon: '⚙️', label: 'Settings', active: true },
          { icon: '🏠', label: 'Home', active: false },
          { icon: '🗺️', label: 'Map', active: false },
          { icon: 'ℹ️', label: 'Info', active: false },
        ].map(tab => (
          <TouchableOpacity key={tab.label} style={styles.tabItem} activeOpacity={0.7}>
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.active && <View style={styles.tabActiveDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const ORANGE = '#FF6B35';
const BLUE = '#3B82F6';
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
    marginBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingIconText: {
    fontSize: 18,
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
    backgroundColor: ORANGE,
    borderColor: ORANGE,
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

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: 24,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    color: TEXT_SECONDARY,
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: ORANGE,
    fontWeight: '700',
  },
  tabActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ORANGE,
    marginTop: 1,
  },
});

export default SettingsScreen;