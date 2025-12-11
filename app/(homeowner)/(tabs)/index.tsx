
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { BookingCard } from '@/components/BookingCard';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from '@/components/GlassView';
import { supabase } from '@/app/integrations/supabase/client';

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  service_name: string;
  status: string;
  organization_id: string;
  organizations?: {
    business_name: string;
  };
}

export default function HomeownerDashboard() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Task 2.1 & 2.3: Wrap in try/catch/finally, memoize with useCallback
  const loadDashboardData = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Homeowner Dashboard: Loading data for profile:', profile.id);

      const today = new Date().toISOString().split('T')[0];

      // Task 3.1 & 3.2: Add limits and use parallel queries
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, organizations(business_name)')
        .eq('homeowner_id', profile.id)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(10);

      // Task 3.3: Handle errors explicitly
      if (bookingsError) {
        console.error('Homeowner Dashboard: Bookings error:', bookingsError);
        throw bookingsError;
      }

      setBookings(bookingsData || []);
      console.log('Homeowner Dashboard: Loaded', bookingsData?.length || 0, 'bookings');
    } catch (error: any) {
      console.error('Homeowner Dashboard: Error loading data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      // Task 2.1: Always reset loading in finally
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadDashboardData();
      }
    }, [loadDashboardData, loading])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
  }, [loadDashboardData]);

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');

  // Task 2.2: Loading state
  if (loading && !refreshing) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Task 2.2: Error state with retry
  if (error && !refreshing) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <GlassView style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="error"
            size={64}
            color={colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </GlassView>
      </View>
    );
  }

  return (
    <ScrollView 
      style={commonStyles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{user?.name || 'Homeowner'}</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] || 'H'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[commonStyles.glassCard, styles.searchCard]}
        onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
      >
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <Text style={styles.searchText}>Search for services...</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {[
            { name: 'Handyman', icon: '🔧', color: colors.primary },
            { name: 'Cleaning', icon: '🧹', color: colors.accent },
            { name: 'Plumbing', icon: '🚰', color: '#4A90E2' },
            { name: 'Electrical', icon: '⚡', color: '#F5A623' },
            { name: 'HVAC', icon: '❄️', color: '#7ED321' },
            { name: 'Lawn Care', icon: '🌱', color: '#50E3C2' },
          ].map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[commonStyles.glassCard, styles.categoryCard]}
              onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => router.push('/(homeowner)/(tabs)/bookings')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingBookings.length > 0 ? (
          upcomingBookings.slice(0, 2).map((booking, index) => (
            <GlassView key={index} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingDate}>
                  {new Date(booking.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.bookingTime}>{booking.scheduled_time}</Text>
              </View>
              <Text style={styles.bookingService}>{booking.service_name}</Text>
              <Text style={styles.bookingProvider}>
                {booking.organizations?.business_name || 'Provider'}
              </Text>
            </GlassView>
          ))
        ) : (
          <View style={[commonStyles.glassCard, styles.emptyState]}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  categories: {
    paddingLeft: 20,
  },
  categoryCard: {
    width: 100,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  bookingCard: {
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bookingTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  bookingService: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bookingProvider: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
