
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Booking } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

export default function ScheduleScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.accent;
      case 'in_progress': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const mockBookings: Booking[] = [
    {
      id: '1',
      organization_id: '1',
      client_id: '1',
      service_name: 'General Repairs',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      duration: 60,
      address: '123 Main St',
      status: 'confirmed',
      price: 75,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      organization_id: '1',
      client_id: '2',
      service_name: 'Furniture Assembly',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '14:00',
      duration: 45,
      address: '456 Oak Ave',
      status: 'pending',
      price: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(provider)/schedule/create-job')}
          >
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity 
            style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.viewModeText, viewMode === 'day' && styles.viewModeTextActive]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.viewModeText, viewMode === 'week' && styles.viewModeTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.viewModeText, viewMode === 'month' && styles.viewModeTextActive]}>Month</Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity style={styles.navButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity style={styles.navButton}>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <GlassView style={styles.statCard}>
            <Text style={styles.statValue}>{mockBookings.length}</Text>
            <Text style={styles.statLabel}>Today&apos;s Jobs</Text>
          </GlassView>
          <GlassView style={styles.statCard}>
            <Text style={styles.statValue}>
              {mockBookings.reduce((sum, b) => sum + (b.duration || 0), 0)} min
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </GlassView>
          <GlassView style={styles.statCard}>
            <Text style={styles.statValue}>
              ${mockBookings.reduce((sum, b) => sum + (b.price || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </GlassView>
        </View>

        {/* Job Cards */}
        <View style={styles.jobsList}>
          <Text style={styles.sectionTitle}>Scheduled Jobs</Text>
          {mockBookings.length > 0 ? (
            mockBookings.map((booking, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => router.push(`/(provider)/schedule/${booking.id}`)}
              >
                <GlassView style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.timeContainer}>
                      <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={20} color={colors.primary} />
                      <Text style={styles.jobTime}>{booking.scheduled_time}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.jobService}>{booking.service_name}</Text>
                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetail}>
                      <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={16} color={colors.textSecondary} />
                      <Text style={styles.jobDetailText}>Client Name</Text>
                    </View>
                    <View style={styles.jobDetail}>
                      <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={16} color={colors.textSecondary} />
                      <Text style={styles.jobDetailText}>{booking.address}</Text>
                    </View>
                    <View style={styles.jobDetail}>
                      <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={16} color={colors.textSecondary} />
                      <Text style={styles.jobDetailText}>{booking.duration} min</Text>
                    </View>
                  </View>
                  <View style={styles.jobFooter}>
                    <Text style={styles.jobPrice}>${booking.price}</Text>
                    <View style={styles.jobActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={18} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={18} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <IconSymbol ios_icon_name="map.fill" android_material_icon_name="map" size={18} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassView>
              </TouchableOpacity>
            ))
          ) : (
            <GlassView style={styles.emptyState}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No jobs scheduled</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/(provider)/schedule/create-job')}
              >
                <Text style={styles.emptyButtonText}>Create Your First Job</Text>
              </TouchableOpacity>
            </GlassView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/(provider)/schedule/block-time')}
          >
            <IconSymbol ios_icon_name="xmark.circle" android_material_icon_name="block" size={20} color={colors.text} />
            <Text style={styles.quickActionText}>Block Time</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Route Optimization', 'Map view with optimized route coming soon!')}
          >
            <IconSymbol ios_icon_name="map" android_material_icon_name="map" size={20} color={colors.text} />
            <Text style={styles.quickActionText}>Route View</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewModeTextActive: {
    color: colors.text,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  jobsList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  jobCard: {
    padding: 16,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobTime: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  jobService: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  jobDetails: {
    gap: 8,
    marginBottom: 12,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  jobPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
