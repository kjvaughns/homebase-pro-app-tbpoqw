
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router, useSegments } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (loading) {
        return;
      }

      const storedRole = await AsyncStorage.getItem('user_role');
      const currentRole = profile?.role || storedRole || 'homeowner';

      // Ensure role is valid
      if (!['provider', 'homeowner'].includes(currentRole)) {
        console.error('RoleGuard: Invalid role detected:', currentRole);
        await AsyncStorage.setItem('user_role', 'homeowner');
      }

      console.log('RoleGuard: checking route', {
        segments,
        isAuthenticated,
        currentRole,
        profileRole: profile?.role,
      });

      if (!isAuthenticated) {
        const inAuthGroup = segments[0] === 'auth';
        if (!inAuthGroup) {
          console.log('RoleGuard: Not authenticated, redirecting to login');
          router.replace('/auth/login');
        }
        setInitializing(false);
        return;
      }

      const inAuthGroup = segments[0] === 'auth';
      const inProviderGroup = segments[0] === '(provider)';
      const inHomeownerGroup = segments[0] === '(homeowner)';

      if (inAuthGroup) {
        console.log('RoleGuard: In auth group, redirecting to dashboard');
        if (currentRole === 'provider') {
          router.replace('/(provider)/(tabs)');
        } else {
          router.replace('/(homeowner)/(tabs)');
        }
        setInitializing(false);
        return;
      }

      if (currentRole === 'provider' && inHomeownerGroup) {
        console.log('RoleGuard: Provider in homeowner group, redirecting');
        router.replace('/(provider)/(tabs)');
        setInitializing(false);
        return;
      }

      if (currentRole === 'homeowner' && inProviderGroup) {
        console.log('RoleGuard: Homeowner in provider group, redirecting');
        router.replace('/(homeowner)/(tabs)');
        setInitializing(false);
        return;
      }

      setInitializing(false);
    };

    checkAndRedirect();
  }, [isAuthenticated, profile, loading, segments]);

  if (loading || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
