
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ColorModeProvider } from '@/contexts/ColorModeContext';
import { RoleGuard } from '@/components/RoleGuard';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <ColorModeProvider>
      <ToastProvider>
        <AuthProvider>
          <RoleGuard>
            <ThemedStack />
          </RoleGuard>
        </AuthProvider>
      </ToastProvider>
    </ColorModeProvider>
  );
}

function ThemedStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="auth/role-selection" />
      <Stack.Screen name="(provider)" />
      <Stack.Screen name="(homeowner)" />
    </Stack>
  );
}
