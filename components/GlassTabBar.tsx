import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import { SFSymbol } from 'react-native-sfsymbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabKey = 'home' | 'map' | 'info' | 'settings';

interface Tab {
  key: TabKey;
  label: string;
  symbol: string;
}

const TABS: Tab[] = [
  { key: 'home', label: 'Home', symbol: 'house.fill' },
  { key: 'map', label: 'Map', symbol: 'map.fill' },
  { key: 'info', label: 'Info', symbol: 'info.circle.fill' },
  { key: 'settings', label: 'Settings', symbol: 'gearshape.fill' },
];

const ROUTE_TO_TAB: Record<string, TabKey> = {
  Home: 'home',
  Map: 'map',
  Info: 'info',
  Settings: 'settings',
};

const TAB_TO_ROUTE: Record<TabKey, string> = {
  home: 'Home',
  map: 'Map',
  info: 'Info',
  settings: 'Settings',
};

function TabItem({
  tab,
  isActive,
  onPress,
  accessibilityLabel,
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const glow = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(glow, {
      toValue: isActive ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [glow, isActive]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      damping: 12,
      stiffness: 300,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 10,
      stiffness: 260,
      mass: 1,
      useNativeDriver: true,
    }).start();

    onPress();
  };

  const pillOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const pillScaleX = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const labelOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  const labelTranslateY = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 0],
  });

  const iconScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const iconTranslateY = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
  });

  return (
    <Animated.View style={[styles.tabItem, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={isActive ? { selected: true } : {}}
        accessibilityLabel={accessibilityLabel}
        style={styles.touchInner}
      >
        <Animated.View
          style={[
            styles.activePill,
            { opacity: pillOpacity, transform: [{ scaleX: pillScaleX }] },
          ]}
        />

        <Animated.View
          style={[
            styles.icon,
            {
              transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
            },
          ]}
        >
          <SFSymbol
            name={tab.symbol}
            size={21}
            weight="semibold"
            scale="medium"
            color={
              isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.60)'
            }
            style={styles.symbolIcon}
          />
        </Animated.View>

        <Animated.Text
          style={[
            styles.label,
            isActive && styles.labelActive,
            {
              opacity: labelOpacity,
              transform: [{ translateY: labelTranslateY }],
            },
          ]}
        >
          {tab.label}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const activeRoute = state.routes[state.index];
  const activeTab = ROUTE_TO_TAB[activeRoute.name] ?? 'home';

  const handleTabPress = (key: TabKey) => {
    const routeName = TAB_TO_ROUTE[key];
    const route = state.routes.find(item => item.name === routeName);

    if (!route) {
      return;
    }

    const isFocused = route.key === activeRoute.key;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.outerShell}>
        <BlurView
          blurType="dark"
          blurAmount={Platform.OS === 'ios' ? 30 : 18}
          reducedTransparencyFallbackColor="rgba(10,10,30,0.7)"
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.specularEdge} pointerEvents="none" />
        <View style={styles.tintOverlay} pointerEvents="none" />
        <View style={styles.bottomGlow} pointerEvents="none" />

        <View style={styles.tabRow}>
          {TABS.map(tab => {
            const routeName = TAB_TO_ROUTE[tab.key];
            const route = state.routes.find(item => item.name === routeName);
            const accessibilityLabel = route
              ? descriptors[route.key]?.options.tabBarAccessibilityLabel
              : undefined;

            return (
              <TabItem
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                accessibilityLabel={accessibilityLabel}
                onPress={() => handleTabPress(tab.key)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const NAVBAR_WIDTH = Math.min(SCREEN_WIDTH - 40, 400);
const NAVBAR_HEIGHT = 70;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  outerShell: {
    width: NAVBAR_WIDTH,
    height: NAVBAR_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  specularEdge: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.65)',
    zIndex: 10,
  },

  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,30,0.28)',
  },

  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(120,140,255,0.30)',
    zIndex: 10,
  },

  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 5,
  },

  tabItem: {
    flex: 1,
    height: NAVBAR_HEIGHT,
  },

  touchInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },

  activePill: {
    position: 'absolute',
    top: '18%',
    bottom: '18%',
    left: 6,
    right: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },

  icon: {
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  symbolIcon: {
    width: 21,
    height: 21,
  },

  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.38)',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Rounded' : undefined,
  },

  labelActive: {
    color: 'rgba(255,255,255,0.92)',
  },
});
