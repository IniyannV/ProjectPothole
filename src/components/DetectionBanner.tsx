import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {DetectionEvent, EventType, EVENT_LABELS} from '../types';
import {colors} from '../theme/colors';

const EVENT_COLOR: Record<EventType, string> = {
  POTHOLE: colors.pothole,
  SPEED_BUMP: colors.speedBump,
  HARD_BRAKING: colors.hardBraking,
};

const EVENT_ICON: Record<EventType, string> = {
  POTHOLE: '⚠',
  SPEED_BUMP: '▲',
  HARD_BRAKING: '■',
};

interface Props {
  event: DetectionEvent | null;
  onDismiss: () => void;
}

export function DetectionBanner({event, onDismiss}: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (event) {
      if (timerRef.current) clearTimeout(timerRef.current);

      Animated.parallel([
        Animated.spring(translateY, {toValue: 0, useNativeDriver: true, tension: 80, friction: 10}),
        Animated.timing(opacity, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();

      timerRef.current = setTimeout(() => dismiss(), 4000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {toValue: -120, duration: 250, useNativeDriver: true}),
      Animated.timing(opacity, {toValue: 0, duration: 250, useNativeDriver: true}),
    ]).start(() => onDismiss());
  };

  if (!event) return null;

  const accentColor = EVENT_COLOR[event.type];

  return (
    <Animated.View style={[styles.container, {transform: [{translateY}], opacity}]}>
      <View style={[styles.banner, {borderLeftColor: accentColor}]}>
        <View style={styles.row}>
          <Text style={[styles.icon, {color: accentColor}]}>{EVENT_ICON[event.type]}</Text>
          <View style={styles.textContainer}>
            <Text style={[styles.title, {color: accentColor}]}>{EVENT_LABELS[event.type]} Detected</Text>
            <Text style={styles.subtitle}>
              {event.magnitude.toFixed(1)} m/s² · {new Date(event.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          <TouchableOpacity onPress={dismiss} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: 56,
  },
  banner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  close: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '600',
  },
});
