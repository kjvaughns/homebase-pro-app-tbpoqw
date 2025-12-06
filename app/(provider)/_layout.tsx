
import React from 'react';
import { Stack } from 'expo-router';

export default function ProviderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding/business-basics" />
      <Stack.Screen name="onboarding/business-description" />
      <Stack.Screen name="onboarding/services-setup" />
      <Stack.Screen name="onboarding/logo-upload" />
    </Stack>
  );
}
