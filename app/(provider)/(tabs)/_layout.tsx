
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function ProviderTabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(provider)/(tabs)/',
      icon: 'home',
      label: 'Dashboard',
    },
    {
      name: 'schedule',
      route: '/(provider)/(tabs)/schedule',
      icon: 'calendar',
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
      icon: 'settings',
      label: 'Settings',
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
        <Stack.Screen name="schedule" />
        <Stack.Screen name="clients" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
