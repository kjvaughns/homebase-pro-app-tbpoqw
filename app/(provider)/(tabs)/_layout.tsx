
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import FloatingActionButton from '@/components/FloatingActionButton';

export default function ProviderTabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(provider)/(tabs)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'schedule',
      route: '/(provider)/(tabs)/schedule',
      icon: 'calendar-today',
      label: 'Schedule',
    },
    {
      name: 'clients',
      route: '/(provider)/(tabs)/clients',
      icon: 'people',
      label: 'Clients',
    },
    {
      name: 'settings',
      route: '/(provider)/(tabs)/settings',
      icon: 'more-horiz',
      label: 'More',
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
        <Stack.Screen name="schedule" />
        <Stack.Screen name="clients" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingActionButton />
      <FloatingTabBar tabs={tabs} />
    </React.Fragment>
  );
}
