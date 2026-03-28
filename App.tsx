/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlassTabBar from './components/GlassTabBar';
import HomeScreen from './screens/HomeScreen';
import InfoScreen from './screens/InfoScreen';
import MapScreen from './screens/MapScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const renderGlassTabBar = (props: Parameters<typeof GlassTabBar>[0]) => (
  <GlassTabBar {...props} />
);

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <View style={styles.appContainer}>
          <View style={styles.glowOrbTop} />
          <View style={styles.glowOrbBottom} />
          <Tab.Navigator
            initialRouteName="Home"
            tabBar={renderGlassTabBar}
            screenOptions={{
              headerShown: false,
              sceneStyle: styles.scene,
              tabBarHideOnKeyboard: true,
            }}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Map" component={MapScreen} />
            <Tab.Screen name="Info" component={InfoScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
