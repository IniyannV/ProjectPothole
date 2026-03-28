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
    backgroundColor: '#eaf1fb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: '#eaf1fb',
  },
  orbTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(151, 205, 255, 0.45)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  kicker: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  googleButton: {
    marginTop: 28,
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
  },
  googleButtonPressed: {
    opacity: 0.92,
  },
  googleButtonDisabled: {
    opacity: 0.8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  errorText: {
    marginTop: 14,
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 19,
  },
});

export default AuthScreen;
