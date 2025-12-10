
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { remindersService, Reminder } from '@/services/RemindersService';

export default function HomeownerDashboardScreen() {
  const { user, profile } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const remindersData = await remindersService.fetchReminders();
      setReminders(remindersData.reminders || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome home,</Text>
          <Text style={styles.name}>{user?.name || 'Homeowner'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(homeowner)/ai-assistant')}>
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto-awesome"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <GlassView style={styles.statCard}>
          <IconSymbol
            ios_icon_name="house"
            android_material_icon_name="home"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>My Homes</Text>
        </GlassView>

        <GlassView style={styles.statCard}>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="event"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </GlassView>

        <GlassView style={styles.statCard}>
          <IconSymbol
            ios_icon_name="star"
            android_material_icon_name="star"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </GlassView>
      </View>

      {/* Reminders Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Home Reminders</Text>
          <IconSymbol
            ios_icon_name="bell"
            android_material_icon_name="notifications"
            size={20}
            color={colors.primary}
          />
        </View>

        {loading ? (
          <GlassView style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </GlassView>
        ) : reminders.length === 0 ? (
          <GlassView style={styles.emptyCard}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.emptyText}>All set!</Text>
            <Text style={styles.emptySubtext}>No pending reminders</Text>
          </GlassView>
        ) : (
          reminders.slice(0, 3).map((reminder) => (
            <GlassView key={reminder.id} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(reminder.priority) }]} />
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
              </View>
              <Text style={styles.reminderDescription}>{reminder.description}</Text>
              <View style={styles.reminderFooter}>
                <View style={styles.reminderMeta}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="event"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.reminderDate}>
                    {new Date(reminder.due_date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.reminderType, { color: getPriorityColor(reminder.priority) }]}>
                  {reminder.type}
                </Text>
              </View>
            </GlassView>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}>
          <GlassView style={styles.actionCard}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={32}
              color={colors.primary}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Find Providers</Text>
              <Text style={styles.actionSubtitle}>Browse trusted service professionals</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(homeowner)/homes/add')}>
          <GlassView style={styles.actionCard}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={32}
              color={colors.primary}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Add Home</Text>
              <Text style={styles.actionSubtitle}>Add a property to manage</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(homeowner)/(tabs)/bookings')}>
          <GlassView style={styles.actionCard}>
            <IconSymbol
              ios_icon_name="calendar.badge.clock"
              android_material_icon_name="schedule"
              size={32}
              color={colors.primary}
            />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Bookings</Text>
              <Text style={styles.actionSubtitle}>Check your scheduled services</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </TouchableOpacity>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reminderCard: {
    padding: 16,
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  reminderDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reminderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reminderType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    marginBottom: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
