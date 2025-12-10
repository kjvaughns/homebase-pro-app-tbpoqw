
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Booking, Invoice } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

export default function ProviderDashboard() {
  const { user, profile, organization } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalClients: 0,
    jobsCompleted: 0,
    mtdRevenue: 0,
    upcomingAppointments: 0,
  });
  const [todaysJobs, setTodaysJobs] = useState<Booking[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupTasks, setSetupTasks] = useState({
    stripeSetup: false,
    hasServices: false,
    hasEnoughClients: false,
  });

  useEffect(() => {
    if (organization?.id) {
      loadDashboardData();
    }
  }, [organization?.id]);

  const loadDashboardData = async () => {
    try {
      if (!organization?.id) return;

      // Load total clients count
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Load jobs completed (all time)
      const { count: completedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'completed');

      // Calculate MTD Revenue (sum of payments this month)
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('organization_id', organization.id)
        .eq('status', 'succeeded')
        .gte('created_at', firstDayOfMonth.toISOString());

      const mtdRevenue = monthlyPayments?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0;

      // Load upcoming appointments (next 7 days)
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const { count: upcomingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lte('scheduled_date', nextWeek.toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed']);

      // Load today's jobs
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('*, clients(name)')
        .eq('organization_id', organization.id)
        .eq('scheduled_date', today.toISOString().split('T')[0])
        .neq('status', 'cancelled')
        .order('scheduled_time', { ascending: true });

      // Load unpaid invoices (top 3)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('organization_id', organization.id)
        .in('status', ['sent', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(3);

      // Check setup tasks
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('organization_id', organization.id)
        .limit(1);

      setStats({
        totalClients: clientsCount || 0,
        jobsCompleted: completedCount || 0,
        mtdRevenue: Math.round(mtdRevenue),
        upcomingAppointments: upcomingCount || 0,
      });

      setTodaysJobs(todayBookings || []);
      setUnpaidInvoices(invoices || []);

      setSetupTasks({
        stripeSetup: !!organization.stripe_account_id,
        hasServices: (services?.length || 0) > 0,
        hasEnoughClients: (clientsCount || 0) >= 3,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const handleKPIPress = (type: string) => {
    switch (type) {
      case 'clients':
        router.push('/(provider)/(tabs)/clients');
        break;
      case 'completed':
        router.push('/(provider)/(tabs)/schedule?filter=completed');
        break;
      case 'revenue':
        router.push('/(provider)/money');
        break;
      case 'upcoming':
        router.push('/(provider)/(tabs)/schedule');
        break;
    }
  };

  const handleSetupTask = (task: string) => {
    switch (task) {
      case 'stripe':
        router.push('/(provider)/settings/payment');
        break;
      case 'service':
        router.push('/(provider)/services/add');
        break;
      case 'clients':
        router.push('/(provider)/clients/import-csv');
        break;
    }
  };

  const firstName = profile?.name?.split(' ')[0] || 'there';

  // Filter incomplete setup tasks
  const incompleteTasks = [
    { key: 'stripe', label: 'Finish Stripe Setup', completed: setupTasks.stripeSetup },
    { key: 'service', label: 'Add services', completed: setupTasks.hasServices },
    { key: 'clients', label: 'Import clients', completed: setupTasks.hasEnoughClients },
  ].filter(task => !task.completed);

  return (
    <ScrollView 
      style={commonStyles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileChip}
          onPress={() => router.push('/(provider)/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.profileInitial}>
            {firstName[0]?.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* KPI Row */}
      <View style={styles.kpiRow}>
        <TouchableOpacity 
          style={styles.kpiCard}
          onPress={() => handleKPIPress('clients')}
          activeOpacity={0.7}
        >
          <GlassView style={styles.kpiGlass}>
            <View style={[styles.kpiIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="person.2.fill"
                android_material_icon_name="people"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.kpiLabel}>Total Clients</Text>
            <Text style={styles.kpiValue}>{stats.totalClients}</Text>
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.kpiCard}
          onPress={() => handleKPIPress('completed')}
          activeOpacity={0.7}
        >
          <GlassView style={styles.kpiGlass}>
            <View style={[styles.kpiIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.kpiLabel}>Jobs Completed</Text>
            <Text style={styles.kpiValue}>{stats.jobsCompleted}</Text>
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.kpiCard}
          onPress={() => handleKPIPress('revenue')}
          activeOpacity={0.7}
        >
          <GlassView style={styles.kpiGlass}>
            <View style={[styles.kpiIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="dollarsign.circle.fill"
                android_material_icon_name="attach-money"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.kpiLabel}>MTD Revenue</Text>
            <Text style={styles.kpiValue}>${stats.mtdRevenue}</Text>
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.kpiCard}
          onPress={() => handleKPIPress('upcoming')}
          activeOpacity={0.7}
        >
          <GlassView style={styles.kpiGlass}>
            <View style={[styles.kpiIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="calendar.badge.clock"
                android_material_icon_name="event"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.kpiLabel}>Upcoming Appointments</Text>
            <Text style={styles.kpiValue}>{stats.upcomingAppointments}</Text>
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Today's Jobs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Jobs</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/(tabs)/schedule')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {todaysJobs.length > 0 ? (
          <React.Fragment>
            {todaysJobs.map((booking, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(`/(provider)/schedule/${booking.id}`)}
                activeOpacity={0.7}
                style={styles.jobCardWrapper}
              >
                <GlassView style={styles.jobCard}>
                  <View style={styles.jobRow}>
                    <View style={styles.jobLeft}>
                      <Text style={styles.jobTime}>{booking.scheduled_time}</Text>
                      <Text style={styles.jobService} numberOfLines={1}>
                        {booking.service_name}
                      </Text>
                      <Text style={styles.jobClient} numberOfLines={1}>
                        {(booking as any).clients?.name || 'Client'}
                      </Text>
                    </View>
                    <View style={styles.jobRight}>
                      {booking.price && (
                        <Text style={styles.jobPrice}>${booking.price}</Text>
                      )}
                      <View style={[styles.jobStatus, { 
                        backgroundColor: booking.status === 'confirmed' 
                          ? colors.primary + '20' 
                          : colors.textSecondary + '20' 
                      }]}>
                        <Text style={[styles.jobStatusText, {
                          color: booking.status === 'confirmed' 
                            ? colors.primary 
                            : colors.textSecondary
                        }]}>
                          {booking.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </GlassView>
              </TouchableOpacity>
            ))}
          </React.Fragment>
        ) : (
          <GlassView style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No jobs today</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(provider)/schedule/create-job')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyButtonText}>Create job</Text>
            </TouchableOpacity>
          </GlassView>
        )}
      </View>

      {/* Unpaid Invoices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Unpaid Invoices</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/money?tab=invoices')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {unpaidInvoices.length > 0 ? (
          <React.Fragment>
            {unpaidInvoices.map((invoice, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(`/(provider)/money/invoice/${invoice.id}`)}
                activeOpacity={0.7}
                style={styles.invoiceCardWrapper}
              >
                <GlassView style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View>
                      <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                      <Text style={styles.invoiceClient}>
                        {(invoice as any).clients?.name || 'Client'}
                      </Text>
                    </View>
                    <Text style={styles.invoiceAmount}>${invoice.total}</Text>
                  </View>
                  <View style={styles.invoiceFooter}>
                    <Text style={styles.invoiceDue}>
                      Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                    </Text>
                    <View style={[styles.invoiceStatus, {
                      backgroundColor: invoice.status === 'overdue' 
                        ? colors.error + '20' 
                        : colors.warning + '20'
                    }]}>
                      <Text style={[styles.invoiceStatusText, {
                        color: invoice.status === 'overdue' ? colors.error : colors.warning
                      }]}>
                        {invoice.status}
                      </Text>
                    </View>
                  </View>
                </GlassView>
              </TouchableOpacity>
            ))}
          </React.Fragment>
        ) : (
          <GlassView style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="checkmark.circle"
              android_material_icon_name="check-circle"
              size={48}
              color={colors.primary}
            />
            <Text style={styles.emptyText}>All invoices paid</Text>
          </GlassView>
        )}
      </View>

      {/* What Matters Now */}
      {incompleteTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Matters Now</Text>
          <View style={styles.tasksGrid}>
            {incompleteTasks.map((task, index) => (
              <TouchableOpacity
                key={index}
                style={styles.taskCard}
                onPress={() => handleSetupTask(task.key)}
                activeOpacity={0.7}
              >
                <GlassView style={styles.taskGlass}>
                  <IconSymbol
                    ios_icon_name="arrow.right.circle.fill"
                    android_material_icon_name="arrow-circle-right"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.taskLabel}>{task.label}</Text>
                </GlassView>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.8,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Inter',
  },
  profileChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'Inter',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginBottom: 32,
    gap: 12,
  },
  kpiCard: {
    width: (screenWidth - 52) / 2,
  },
  kpiGlass: {
    padding: 16,
    height: 120,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.9,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Inter',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Inter',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: 'Inter',
  },
  jobCardWrapper: {
    marginBottom: 12,
  },
  jobCard: {
    padding: 16,
  },
  jobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobLeft: {
    flex: 1,
    marginRight: 12,
  },
  jobTime: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  jobService: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  jobClient: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  jobRight: {
    alignItems: 'flex-end',
  },
  jobPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  jobStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  jobStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: 'Inter',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Inter',
  },
  invoiceCardWrapper: {
    marginBottom: 12,
  },
  invoiceCard: {
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  invoiceClient: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  invoiceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'Inter',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDue: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'Inter',
  },
  invoiceStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  invoiceStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: 'Inter',
  },
  tasksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  taskCard: {
    width: (screenWidth - 52) / 2,
  },
  taskGlass: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
  },
  taskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    lineHeight: 18,
    fontFamily: 'Inter',
  },
});
