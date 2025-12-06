
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function HomeownerTabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(homeowner)/(tabs)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'marketplace',
      route: '/(homeowner)/(tabs)/marketplace',
      icon: 'search',
      label: 'Browse',
    },
    {
      name: 'bookings',
      route: '/(homeowner)/(tabs)/bookings',
      icon: 'calendar-today',
      label: 'Bookings',
    },
    {
      name: 'settings',
      route: '/(homeowner)/(tabs)/settings',
      icon: 'more-horiz',
      label: 'More',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="marketplace" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
