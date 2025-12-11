
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Booking } from '@/types';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'list' | 'day' | 'week' | 'month';

const { width } = Dimensions.get('window');

export default function ScheduleScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fix 4.2: Include blocked bookings in query
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*, clients(name, email, phone)')
        .eq('organization_id', organization.id)
        .gte('scheduled_date', getStartDate())
        .lte('scheduled_date', getEndDate())
        .order('scheduled_date')
        .order('scheduled_time');

      if (fetchError) throw fetchError;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      setError(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, selectedDate, viewMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [loadBookings]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Reload bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const getStartDate = () => {
    const date = new Date(selectedDate);
    if (viewMode === 'day') {
      return date.toISOString().split('T')[0];
    } else if (viewMode === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      return date.toISOString().split('T')[0];
    } else if (viewMode === 'month') {
      date.setDate(1);
      return date.toISOString().split('T')[0];
    } else {
      // List view - show upcoming jobs from today
      return new Date().toISOString().split('T')[0];
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
    } else if (viewMode === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      return date.toISOString().split('T')[0];
    } else {
      // List view - show next 30 days
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      return endDate.toISOString().split('T')[0];
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

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.primary;
      case 'in_progress': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'blocked': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const renderListView = () => {
    // Fix 4.2: Show all bookings including blocked ones
    const upcomingBookings = bookings.filter(b => b.status !== 'cancelled');

    // Fix 5.3: Add loading state
    if (loading && bookings.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      );
    }

    // Fix 5.3: Add error state
    if (error) {
      return (
        <GlassView style={styles.errorState}>
          <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="error" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBookings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </GlassView>
      );
    }

    // Fix 5.3: Add empty state
    if (upcomingBookings.length === 0) {
      return (
        <GlassView style={styles.emptyState}>
          <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No upcoming jobs</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(provider)/schedule/create-job')}
          >
            <Text style={styles.emptyButtonText}>Create Job</Text>
          </TouchableOpacity>
        </GlassView>
      );
    }

    return (
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {upcomingBookings.map((booking, index) => (
          <React.Fragment key={index}>
            {/* Fix 5.2: Make jobs tappable */}
            <TouchableOpacity 
              onPress={() => {
                if (booking.status !== 'blocked') {
                  router.push(`/(provider)/schedule/${booking.id}`);
                }
              }}
            >
              <GlassView style={[
                styles.jobCard,
                // Fix 4.2: Visually differentiate blocked bookings
                booking.status === 'blocked' && styles.blockedJobCard
              ]}>
                <View style={styles.jobHeader}>
                  <View style={styles.dateTimeContainer}>
                    <Text style={styles.jobDate}>
                      {new Date(booking.scheduled_date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <View style={styles.timeContainer}>
                      <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={16} color={booking.status === 'blocked' ? colors.textSecondary : colors.primary} />
                      <Text style={styles.jobTime}>{booking.scheduled_time}</Text>
                      {booking.end_time && (
                        <Text style={styles.jobTime}> - {booking.end_time}</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status === 'blocked' ? 'Blocked' : booking.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.jobService, booking.status === 'blocked' && styles.blockedText]}>
                  {booking.service_name}
                </Text>
                {booking.status !== 'blocked' && (
                  <React.Fragment>
                    <View style={styles.jobDetails}>
                      <View style={styles.jobDetail}>
                        <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={16} color={colors.textSecondary} />
                        <Text style={styles.jobDetailText}>{booking.clients?.name || 'Unknown'}</Text>
                      </View>
                      <View style={styles.jobDetail}>
                        <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={16} color={colors.textSecondary} />
                        <Text style={styles.jobDetailText} numberOfLines={1}>{booking.address}</Text>
                      </View>
                    </View>
                    {booking.price && (
                      <Text style={styles.jobPrice}>${booking.price}</Text>
                    )}
                  </React.Fragment>
                )}
                {booking.status === 'blocked' && booking.notes && (
                  <Text style={styles.blockedNotes}>{booking.notes}</Text>
                )}
              </GlassView>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </ScrollView>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
    const todayBookings = bookings.filter(b => 
      b.scheduled_date === selectedDate.toISOString().split('T')[0]
    );

    return (
      <React.Fragment>
        {isToday(selectedDate) && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        )}
        <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
          {hours.map((hour) => {
            const hourBookings = todayBookings.filter(b => {
              const bookingHour = parseInt(b.scheduled_time.split(':')[0]);
              return bookingHour === hour;
            });

            return (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}</Text>
                <View style={styles.hourContent}>
                  <View style={styles.hourLine} />
                  {hourBookings.map((booking, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        if (booking.status !== 'blocked') {
                          router.push(`/(provider)/schedule/${booking.id}`);
                        }
                      }}
                    >
                      <GlassView style={[
                        styles.bookingBlock, 
                        { borderLeftColor: getStatusColor(booking.status) },
                        booking.status === 'blocked' && styles.blockedBookingBlock
                      ]}>
                        <Text style={styles.bookingTime}>{booking.scheduled_time}</Text>
                        <Text style={[styles.bookingService, booking.status === 'blocked' && styles.blockedText]}>
                          {booking.service_name}
                        </Text>
                        {booking.status !== 'blocked' && (
                          <Text style={styles.bookingClient}>{booking.clients?.name || 'Unknown'}</Text>
                        )}
                        {booking.status === 'blocked' && (
                          <Text style={styles.blockedLabel}>BLOCKED</Text>
                        )}
                      </GlassView>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </React.Fragment>
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

    const today = new Date();

    return (
      <ScrollView style={styles.weekContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.weekDaysRow}>
          {days.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayBookings = bookings.filter(b => b.scheduled_date === dateStr);
            const isTodayDate = isToday(date);
            const isSelected = isSameDay(date, selectedDate);

            return (
              <TouchableOpacity
                key={index}
                style={styles.weekDayColumn}
                onPress={() => {
                  setSelectedDate(date);
                  setViewMode('day');
                }}
              >
                <Text style={styles.weekDayName}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <View style={styles.weekDateContainer}>
                  {isTodayDate && (
                    <View style={styles.todayCircle}>
                      <Text style={styles.weekDateToday}>{date.getDate()}</Text>
                    </View>
                  )}
                  {!isTodayDate && isSelected && (
                    <View style={styles.selectedCircle}>
                      <Text style={styles.weekDateSelected}>{date.getDate()}</Text>
                    </View>
                  )}
                  {!isTodayDate && !isSelected && (
                    <Text style={styles.weekDate}>{date.getDate()}</Text>
                  )}
                </View>
                <View style={styles.weekBookingsList}>
                  {dayBookings.slice(0, 3).map((booking, idx) => (
                    <View
                      key={idx}
                      style={[styles.weekBookingDot, { backgroundColor: getStatusColor(booking.status) }]}
                    />
                  ))}
                  {dayBookings.length > 3 && (
                    <Text style={styles.weekBookingMore}>+{dayBookings.length - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Show selected day's jobs */}
        <View style={styles.weekJobsList}>
          <Text style={styles.weekJobsTitle}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {bookings
            .filter(b => b.scheduled_date === selectedDate.toISOString().split('T')[0])
            .map((booking, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (booking.status !== 'blocked') {
                    router.push(`/(provider)/schedule/${booking.id}`);
                  }
                }}
              >
                <GlassView style={[styles.weekJobCard, booking.status === 'blocked' && styles.blockedJobCard]}>
                  <View style={styles.weekJobHeader}>
                    <Text style={styles.weekJobTime}>{booking.scheduled_time}</Text>
                    <View style={[styles.weekJobStatus, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                      <Text style={[styles.weekJobStatusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status === 'blocked' ? 'Blocked' : booking.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.weekJobService, booking.status === 'blocked' && styles.blockedText]}>
                    {booking.service_name}
                  </Text>
                  {booking.status !== 'blocked' && (
                    <Text style={styles.weekJobClient}>{booking.clients?.name || 'Unknown'}</Text>
                  )}
                </GlassView>
              </TouchableOpacity>
            ))}
        </View>
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

    const today = new Date();

    return (
      <ScrollView style={styles.monthContainer} showsVerticalScrollIndicator={false}>
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
            
            const cellDate = new Date(year, month, day);
            const isTodayDate = isToday(cellDate);
            const isSelected = isSameDay(cellDate, selectedDate);

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
                <View style={styles.monthDayContent}>
                  {isTodayDate && (
                    <View style={styles.monthTodayCircle}>
                      <Text style={styles.monthDayNumberToday}>{day}</Text>
                    </View>
                  )}
                  {!isTodayDate && isSelected && (
                    <View style={styles.monthSelectedCircle}>
                      <Text style={styles.monthDayNumberSelected}>{day}</Text>
                    </View>
                  )}
                  {!isTodayDate && !isSelected && (
                    <Text style={styles.monthDayNumber}>{day}</Text>
                  )}
                  {hasBookings && (
                    <View style={styles.monthDayDots}>
                      {dayBookings.slice(0, 3).map((_, idx) => (
                        <View key={idx} style={styles.monthDayDot} />
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
        </View>

        {/* View Mode Selector */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity 
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>List</Text>
          </TouchableOpacity>
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
        {viewMode !== 'list' && (
          <View style={styles.dateNavigation}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
              <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToToday}>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar Views */}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/(provider)/schedule/block-time')}
          >
            <IconSymbol ios_icon_name="xmark.circle" android_material_icon_name="block" size={18} color={colors.text} />
            <Text style={styles.quickActionText}>Block Time</Text>
          </TouchableOpacity>
          {/* Fix 5.1: Create job button with date passing */}
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              const dateParam = selectedDate.toISOString().split('T')[0];
              router.push(`/(provider)/schedule/create-job?date=${dateParam}`);
            }}
          >
            <IconSymbol ios_icon_name="plus.circle" android_material_icon_name="add-circle" size={18} color={colors.text} />
            <Text style={styles.quickActionText}>Create Job</Text>
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
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  
  // List View
  listContainer: {
    marginBottom: 20,
  },
  jobCard: {
    padding: 16,
    marginBottom: 12,
  },
  blockedJobCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: colors.textSecondary + '40',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  jobDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  blockedText: {
    color: colors.textSecondary,
  },
  blockedNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  blockedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    flex: 1,
  },
  jobPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorState: {
    padding: 48,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
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

  // Day View
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  todayBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  calendarContainer: {
    marginBottom: 20,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 60,
  },
  hourLabel: {
    width: 70,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingTop: 4,
  },
  hourContent: {
    flex: 1,
    paddingLeft: 8,
    position: 'relative',
  },
  hourLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bookingBlock: {
    padding: 12,
    marginBottom: 8,
    marginTop: 4,
    borderLeftWidth: 4,
  },
  blockedBookingBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  bookingTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bookingClient: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Week View
  weekContainer: {
    marginBottom: 20,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  weekDayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  weekDateContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  todayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDateToday: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  selectedCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDateSelected: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  weekDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  weekBookingsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 20,
  },
  weekBookingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekBookingMore: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  weekJobsList: {
    gap: 12,
  },
  weekJobsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  weekJobCard: {
    padding: 12,
  },
  weekJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekJobTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  weekJobStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  weekJobStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekJobService: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  weekJobClient: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Month View
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
  },
  monthDayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  monthTodayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayNumberToday: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  monthSelectedCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayNumberSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  monthDayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  monthDayDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  monthDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
});
