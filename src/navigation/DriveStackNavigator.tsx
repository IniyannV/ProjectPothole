import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen as DriveHomeScreen } from '../screens/HomeScreen';
import { HistoryScreen as DriveHistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen as DriveSettingsScreen } from '../screens/SettingsScreen';

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
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="DriveHome"
        component={DriveHomeScreen}
        options={{ title: 'Start Drive' }}
      />
      <Stack.Screen
        name="DriveHistory"
        component={DriveHistoryScreen}
        options={{ title: 'Drive History' }}
      />
      <Stack.Screen
        name="DriveSettings"
        component={DriveSettingsScreen}
        options={{ title: 'Drive Settings' }}
      />
    </Stack.Navigator>
  );
}
