import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen as DriveHomeScreen } from '../screens/HomeScreen';
import { HistoryScreen as DriveHistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen as DriveSettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/colors';

export type DriveStackParamList = {
  DriveHome: undefined;
  DriveHistory: undefined;
  DriveSettings: undefined;
};

const Stack = createNativeStackNavigator<DriveStackParamList>();

export function DriveStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DriveHome"
      screenOptions={{
        headerTransparent: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.white,
        headerShadowVisible: false,
        headerTitle: '',
        headerBackTitleVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="DriveHome"
        component={DriveHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriveHistory"
        component={DriveHistoryScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="DriveSettings"
        component={DriveSettingsScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
