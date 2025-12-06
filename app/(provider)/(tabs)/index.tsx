
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { StatCard } from '@/components/StatCard';
import { BookingCard } from '@/components/BookingCard';
import { useAuth } from '@/contexts/AuthContext';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Booking, Invoice, Client } from '@/types';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeSubscribers: 0,
    mrr: 0,
    upcomingBookings: 0,
  });
  const [todaysJobs, setTodaysJobs] = useState<Booking[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats, bookings, and invoices from Supabase
      // This is a placeholder - implement actual data fetching
      setStats({
        totalClients: 24,
        activeSubscribers: 8,
        mrr: 3200,
        upcomingBookings: 12,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-client':
        router.push('/(provider)/clients/add');
        break;
      case 'create-job':
        router.push('/(provider)/schedule/create-job');
        break;
      case 'send-invoice':
        router.push('/(provider)/invoices/create');
        break;
      case 'payment-link':
        router.push('/(provider)/payments/quick-link');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || 'Provider'}</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] || 'P'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Clients"
          value={stats.totalClients.toString()}
          subtitle="all time"
          ios_icon="person.2.fill"
          android_icon="people"
          color={colors.primary}
        />
        <StatCard
          title="Active Subscribers"
          value={stats.activeSubscribers.toString()}
          subtitle="recurring"
          ios_icon="arrow.clockwise"
          android_icon="autorenew"
          color={colors.accent}
        />
        <StatCard
          title="MRR"
          value={`$${stats.mrr}`}
          subtitle="monthly"
          ios_icon="dollarsign.circle.fill"
          android_icon="attach-money"
          color={colors.success}
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingBookings.toString()}
          subtitle="next 7 days"
          ios_icon="calendar.badge.clock"
          android_icon="event"
          color={colors.warning}
        />
      </View>

      {/* Business Flow Widget */}
      <GlassView style={styles.flowWidget}>
        <Text style={styles.sectionTitle}>Business Flow</Text>
        <View style={styles.flowContainer}>
          <View style={styles.flowStep}>
            <View style={[styles.flowIcon, { backgroundColor: colors.primary }]}>
              <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="people" size={24} color={colors.text} />
            </View>
            <Text style={styles.flowLabel}>Clients</Text>
            <Text style={styles.flowValue}>{stats.totalClients}</Text>
          </View>
          <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
          <View style={styles.flowStep}>
            <View style={[styles.flowIcon, { backgroundColor: colors.accent }]}>
              <IconSymbol ios_icon_name="wrench.and.screwdriver" android_material_icon_name="build" size={24} color={colors.text} />
            </View>
            <Text style={styles.flowLabel}>Jobs</Text>
            <Text style={styles.flowValue}>{todaysJobs.length}</Text>
          </View>
          <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
          <View style={styles.flowStep}>
            <View style={[styles.flowIcon, { backgroundColor: colors.warning }]}>
              <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="description" size={24} color={colors.text} />
            </View>
            <Text style={styles.flowLabel}>Invoices</Text>
            <Text style={styles.flowValue}>{unpaidInvoices.length}</Text>
          </View>
          <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
          <View style={styles.flowStep}>
            <View style={[styles.flowIcon, { backgroundColor: colors.success }]}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.text} />
            </View>
            <Text style={styles.flowLabel}>Paid</Text>
            <Text style={styles.flowValue}>${stats.mrr}</Text>
          </View>
        </View>
      </GlassView>

      {/* Today's Jobs */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/(tabs)/schedule')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {todaysJobs.length > 0 ? (
          todaysJobs.map((booking, index) => (
            <BookingCard
              key={index}
              booking={booking}
              providerName="Client Name"
            />
          ))
        ) : (
          <GlassView style={styles.emptyState}>
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No jobs scheduled for today</Text>
          </GlassView>
        )}
      </View>

      {/* Unpaid Invoices */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Unpaid Invoices</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/invoices')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {unpaidInvoices.length > 0 ? (
          unpaidInvoices.slice(0, 3).map((invoice, index) => (
            <GlassView key={index} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                <Text style={styles.invoiceAmount}>${invoice.total}</Text>
              </View>
              <Text style={styles.invoiceClient}>Client Name</Text>
              <Text style={styles.invoiceDue}>Due: {invoice.due_date}</Text>
            </GlassView>
          ))
        ) : (
          <GlassView style={styles.emptyState}>
            <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check-circle" size={48} color={colors.success} />
            <Text style={styles.emptyText}>All invoices are paid!</Text>
          </GlassView>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => handleQuickAction('add-client')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
              <IconSymbol ios_icon_name="person.badge.plus" android_material_icon_name="person-add" size={28} color={colors.text} />
            </View>
            <Text style={styles.actionText}>Add Client</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => handleQuickAction('create-job')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
              <IconSymbol ios_icon_name="calendar.badge.plus" android_material_icon_name="event" size={28} color={colors.text} />
            </View>
            <Text style={styles.actionText}>Create Job</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => handleQuickAction('send-invoice')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
              <IconSymbol ios_icon_name="doc.text" android_material_icon_name="description" size={28} color={colors.text} />
            </View>
            <Text style={styles.actionText}>Send Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => handleQuickAction('payment-link')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
              <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={28} color={colors.text} />
            </View>
            <Text style={styles.actionText}>Payment Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Setup Checklist */}
      <GlassView style={styles.checklistCard}>
        <Text style={styles.sectionTitle}>Setup Checklist</Text>
        <View style={styles.checklistItem}>
          <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
          <Text style={styles.checklistText}>Complete business profile</Text>
        </View>
        <View style={styles.checklistItem}>
          <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
          <Text style={styles.checklistText}>Add services</Text>
        </View>
        <View style={styles.checklistItem}>
          <IconSymbol ios_icon_name="circle" android_material_icon_name="radio-button-unchecked" size={24} color={colors.textSecondary} />
          <Text style={[styles.checklistText, { color: colors.textSecondary }]}>Connect Stripe account</Text>
        </View>
        <View style={styles.checklistItem}>
          <IconSymbol ios_icon_name="circle" android_material_icon_name="radio-button-unchecked" size={24} color={colors.textSecondary} />
          <Text style={[styles.checklistText, { color: colors.textSecondary }]}>Add your first client</Text>
        </View>
      </GlassView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingBottom: 100,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  flowWidget: {
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 24,
  },
  flowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  flowStep: {
    alignItems: 'center',
  },
  flowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  flowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  flowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  invoiceCard: {
    padding: 16,
    marginBottom: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  invoiceClient: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  invoiceDue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  checklistCard: {
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 24,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  checklistText: {
    fontSize: 15,
    color: colors.text,
  },
});
