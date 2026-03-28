import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {enableVibrateFallback: false, ignoreAndroidSystemSettings: false};

export const HapticService = {
  impact(): void {
    ReactNativeHapticFeedback.trigger('impactHeavy', options);
  },
  notification(): void {
    ReactNativeHapticFeedback.trigger('notificationWarning', options);
  },
  selection(): void {
    ReactNativeHapticFeedback.trigger('selection', options);
  },
};
