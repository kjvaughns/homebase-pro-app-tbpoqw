
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function HomeownerTabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(homeowner)/(tabs)/',
      icon: 'home',
      label: 'Dashboard',
    },
    {
      name: 'marketplace',
      route: '/(homeowner)/(tabs)/marketplace',
      icon: 'search',
      label: 'Marketplace',
    },
    {
      name: 'bookings',
      route: '/(homeowner)/(tabs)/bookings',
      icon: 'calendar-today',
      label: 'Schedule',
    },
    {
      name: 'history',
      route: '/(homeowner)/(tabs)/history',
      icon: 'history',
      label: 'History',
    },
    {
      name: 'settings',
      route: '/(homeowner)/(tabs)/settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  return (
    <React.Fragment>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="marketplace" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </React.Fragment>
  );
}
