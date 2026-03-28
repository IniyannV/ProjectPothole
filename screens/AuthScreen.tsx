import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type AuthScreenProps = {
  isSigningIn: boolean;
  errorMessage: string | null;
  onGoogleSignIn: () => void;
};

const AuthScreen: React.FC<AuthScreenProps> = ({
  isSigningIn,
  errorMessage,
  onGoogleSignIn,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />

        <View style={styles.content}>
          <Text style={styles.kicker}>Project Pothole</Text>
          <Text style={styles.title}>Create your account to get started</Text>
          <Text style={styles.subtitle}>
            Sign up with Google to sync your detections, points, and road
            reports.
          </Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.googleButton,
              pressed && !isSigningIn ? styles.googleButtonPressed : null,
              isSigningIn ? styles.googleButtonDisabled : null,
            ]}
            onPress={onGoogleSignIn}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#0f1a2a" />
            ) : (
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            )}
          </Pressable>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05070b',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#05070b',
  },
  orbTop: {
    position: 'absolute',
    top: -140,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -140,
    left: -90,
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: 'rgba(14, 165, 233, 0.14)',
  },
  content: {
    backgroundColor: 'rgba(10, 14, 24, 0.92)',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  kicker: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#cbd5e1',
  },
  googleButton: {
    marginTop: 28,
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
  },
  googleButtonPressed: {
    opacity: 0.9,
  },
  googleButtonDisabled: {
    opacity: 0.8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  errorText: {
    marginTop: 14,
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 19,
  },
});

export default AuthScreen;
