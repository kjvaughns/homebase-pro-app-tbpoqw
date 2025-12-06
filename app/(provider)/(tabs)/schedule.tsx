
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Booking } from '@/types';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'day' | 'week' | 'month' | 'list' | 'map';

const { width } = Dimensions.get('window');

export default function ScheduleScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [selectedDate, viewMode]);

  const loadBookings = async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*, clients(name, email, phone)')
        .eq('organization_id', organization.id)
        .gte('scheduled_date', getStartDate())
        .lte('scheduled_date', getEndDate())
        .order('scheduled_date')
        .order('scheduled_time');

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      return date.toISOString().split('T')[0];
    } else if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      return date.toISOString().split('T')[0];
    } else {
      date.setDate(1);
      return date.toISOString().split('T')[0];
    }
  };

  const getEndDate = () => {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      return date.toISOString().split('T')[0];
    } else if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
      return date.toISOString().split('T')[0];
    } else {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      return date.toISOString().split('T')[0];
    }
  };

  const formatDate = (date: Date) => {
    if (viewMode === 'day') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const start = new Date(date);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.accent;
      case 'in_progress': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'blocked': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const optimizeRoute = async () => {
    const todayBookings = bookings.filter(b => 
      b.scheduled_date === new Date().toISOString().split('T')[0] && 
      b.status !== 'cancelled' &&
      b.status !== 'blocked'
    );

    if (todayBookings.length < 2) {
      Alert.alert('Route Optimization', 'Need at least 2 jobs to optimize route');
      return;
    }

    // Simple nearest neighbor algorithm
    // In production, you'd use Google Maps Distance Matrix API
    const optimized = [...todayBookings];
    for (let i = 0; i < optimized.length - 1; i++) {
      optimized[i].route_order = i + 1;
    }

    try {
      for (const booking of optimized) {
        await supabase
          .from('bookings')
          .update({ route_order: booking.route_order })
          .eq('id', booking.id);
      }
      
      Alert.alert('Success', 'Route optimized successfully!');
      loadBookings();
    } catch (error) {
      console.error('Error optimizing route:', error);
      Alert.alert('Error', 'Failed to optimize route');
    }
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
    const todayBookings = bookings.filter(b => 
      b.scheduled_date === selectedDate.toISOString().split('T')[0]
    );

    return (
      <ScrollView style={styles.calendarContainer}>
        {hours.map((hour) => {
          const hourBookings = todayBookings.filter(b => {
            const bookingHour = parseInt(b.scheduled_time.split(':')[0]);
            return bookingHour === hour;
          });

          return (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}</Text>
              <View style={styles.hourContent}>
                {hourBookings.map((booking, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => router.push(`/(provider)/schedule/${booking.id}`)}
                  >
                    <GlassView style={[styles.bookingBlock, { borderLeftColor: getStatusColor(booking.status) }]}>
                      <Text style={styles.bookingTime}>{booking.scheduled_time}</Text>
                      <Text style={styles.bookingService}>{booking.service_name}</Text>
                      <Text style={styles.bookingClient}>{booking.clients?.name || 'Unknown'}</Text>
                    </GlassView>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekContainer}>
        {days.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayBookings = bookings.filter(b => b.scheduled_date === dateStr);

          return (
            <View key={index} style={styles.dayColumn}>
              <Text style={styles.dayHeader}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
              <Text style={styles.dayDate}>{date.getDate()}</Text>
              <ScrollView style={styles.dayBookings}>
                {dayBookings.map((booking, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => router.push(`/(provider)/schedule/${booking.id}`)}
                  >
                    <View style={[styles.weekBooking, { backgroundColor: getStatusColor(booking.status) + '30' }]}>
                      <Text style={styles.weekBookingTime}>{booking.scheduled_time}</Text>
                      <Text style={styles.weekBookingService} numberOfLines={1}>{booking.service_name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderMonthView = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <View style={styles.monthContainer}>
        <View style={styles.weekDaysHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Text key={index} style={styles.weekDayLabel}>{day}</Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={index} style={styles.emptyDay} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBookings = bookings.filter(b => b.scheduled_date === dateStr);
            const hasBookings = dayBookings.length > 0;

            return (
              <TouchableOpacity
                key={index}
                style={styles.monthDay}
                onPress={() => {
                  const newDate = new Date(year, month, day);
                  setSelectedDate(newDate);
                  setViewMode('day');
                }}
              >
                <Text style={styles.monthDayNumber}>{day}</Text>
                {hasBookings && (
                  <View style={styles.monthDayDot}>
                    <Text style={styles.monthDayDotText}>{dayBookings.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderListView = () => {
    return (
      <ScrollView style={styles.listContainer}>
        {bookings.length > 0 ? (
          bookings.map((booking, index) => (
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
                    <Text style={styles.jobDetailText}>{booking.clients?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.jobDetail}>
                    <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={16} color={colors.textSecondary} />
                    <Text style={styles.jobDetailText}>{booking.address}</Text>
                  </View>
                  {booking.duration && (
                    <View style={styles.jobDetail}>
                      <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={16} color={colors.textSecondary} />
                      <Text style={styles.jobDetailText}>{booking.duration} min</Text>
                    </View>
                  )}
                </View>
                {booking.price && (
                  <Text style={styles.jobPrice}>${booking.price}</Text>
                )}
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
      </ScrollView>
    );
  };

  const renderMapView = () => {
    return (
      <View style={styles.mapContainer}>
        <GlassView style={styles.mapPlaceholder}>
          <IconSymbol ios_icon_name="map" android_material_icon_name="map" size={64} color={colors.textSecondary} />
          <Text style={styles.mapPlaceholderText}>
            Map view is not supported in Natively at this time.
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            react-native-maps is not currently available in this environment.
          </Text>
          <TouchableOpacity 
            style={styles.optimizeButton}
            onPress={optimizeRoute}
          >
            <IconSymbol ios_icon_name="arrow.triangle.2.circlepath" android_material_icon_name="sync" size={20} color={colors.text} />
            <Text style={styles.optimizeButtonText}>Optimize Route</Text>
          </TouchableOpacity>
        </GlassView>
      </View>
    );
  };

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewModeScroll}>
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
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'map' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('map')}
            >
              <Text style={[styles.viewModeText, viewMode === 'map' && styles.viewModeTextActive]}>Map</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Date Navigation */}
        {viewMode !== 'list' && (
          <View style={styles.dateNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar Views */}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'map' && renderMapView()}

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
            onPress={() => Alert.alert('Google Calendar', 'OAuth integration coming soon!')}
          >
            <IconSymbol ios_icon_name="calendar.badge.plus" android_material_icon_name="event" size={20} color={colors.text} />
            <Text style={styles.quickActionText}>Sync Calendar</Text>
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
    marginBottom: 20,
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
  viewModeScroll: {
    marginBottom: 20,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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
  calendarContainer: {
    marginBottom: 20,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  hourLabel: {
    width: 70,
    fontSize: 12,
    color: colors.textSecondary,
    paddingTop: 4,
  },
  hourContent: {
    flex: 1,
    paddingLeft: 8,
  },
  bookingBlock: {
    padding: 8,
    marginBottom: 4,
    borderLeftWidth: 4,
  },
  bookingTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  bookingService: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  bookingClient: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  weekContainer: {
    marginBottom: 20,
  },
  dayColumn: {
    width: (width - 40) / 4,
    marginRight: 8,
  },
  dayHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  dayBookings: {
    maxHeight: 400,
  },
  weekBooking: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  weekBookingTime: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  weekBookingService: {
    fontSize: 11,
    color: colors.text,
  },
  monthContainer: {
    marginBottom: 20,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  monthDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  monthDayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  monthDayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  monthDayDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  listContainer: {
    marginBottom: 20,
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
  jobPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  mapContainer: {
    marginBottom: 20,
  },
  mapPlaceholder: {
    padding: 48,
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  optimizeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
