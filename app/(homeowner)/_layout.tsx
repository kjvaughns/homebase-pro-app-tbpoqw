
import React from 'react';
import { Stack } from 'expo-router';

export default function HomeownerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="homes" />
      <Stack.Screen name="my-providers" />
      <Stack.Screen name="subscriptions" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
