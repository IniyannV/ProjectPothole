import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ICONS: Record<string, { focused: string; unfocused: string }> = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Map: { focused: 'map', unfocused: 'map-outline' },
  Info: { focused: 'information-circle', unfocused: 'information-circle-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={20}
            reducedTransparencyFallbackColor="rgba(255,255,255,0.85)"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconSet = ICONS[route.name] ?? { focused: 'ellipse', unfocused: 'ellipse-outline' };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {isFocused && <View style={styles.activeIndicator} />}
              <Ionicons
                name={isFocused ? iconSet.focused : iconSet.unfocused}
                size={26}
                color={isFocused ? '#1a3a6e' : '#9aa3b0'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    width: '100%',
  },
  androidBackground: {
    backgroundColor: 'rgba(240, 243, 248, 0.92)',
    borderRadius: 36,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  activeIndicator: {
    position: 'absolute',
    top: 10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a3a6e',
  },
});
