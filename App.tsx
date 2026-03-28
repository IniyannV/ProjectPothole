/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { User } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlassTabBar from './components/GlassTabBar';
import { AppDataProvider } from './context/AppDataContext';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import SettingsScreen from './screens/SettingsScreen';
import { DriveStackNavigator } from './src/navigation/DriveStackNavigator';
import {
  configureGoogleSignIn,
  observeAuthState,
  signInWithGoogle,
} from './services/firebaseAuth';

const Tab = createBottomTabNavigator();
const renderGlassTabBar = (props: Parameters<typeof GlassTabBar>[0]) => (
  <GlassTabBar {...props} />
);

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    configureGoogleSignIn();

    const unsubscribe = observeAuthState(nextUser => {
      setUser(nextUser);
      setIsAuthInitializing(false);
      if (nextUser) {
        setAuthError(null);
      }
    });

    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const fallback = 'Unable to sign in with Google. Please try again.';
      const message = error instanceof Error ? error.message : fallback;
      setAuthError(message || fallback);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isAuthInitializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AuthScreen
          isSigningIn={isSigningIn}
          errorMessage={authError}
          onGoogleSignIn={handleGoogleSignIn}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppDataProvider user={user}>
        <NavigationContainer>
          <View style={styles.appContainer}>
            <View style={styles.glowOrbTop} />
            <View style={styles.glowOrbBottom} />
            <Tab.Navigator
              initialRouteName="Driving"
              tabBar={renderGlassTabBar}
              screenOptions={{
                headerShown: false,
                sceneStyle: styles.scene,
                tabBarHideOnKeyboard: true,
              }}
            >
              <Tab.Screen name="Driving" component={DriveStackNavigator} />
              <Tab.Screen name="Map" component={MapScreen} />
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          </View>
        </NavigationContainer>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaf1fb',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#eaf1fb',
  },
  scene: {
    backgroundColor: 'transparent',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(151, 205, 255, 0.45)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});

export default App;
