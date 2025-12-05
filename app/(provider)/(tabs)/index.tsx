
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { StatCard } from '@/components/StatCard';
import { BookingCard } from '@/components/BookingCard';
import { useAuth } from '@/contexts/AuthContext';
import { mockBookings, mockInvoices, mockProviders } from '@/data/mockData';

export default function ProviderDashboard() {
  const { user } = useAuth();
  
  const todaysJobs = mockBookings.filter(b => {
    const today = new Date();
    return b.date.toDateString() === today.toDateString();
  });

  const unpaidInvoices = mockInvoices.filter(i => i.status === 'unpaid');
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  const weeklyRevenue = 1250; // Mock data

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

      <View style={styles.stats}>
        <StatCard
          title="Today's Jobs"
          value={todaysJobs.length.toString()}
          subtitle="scheduled"
          ios_icon="calendar.badge.clock"
          android_icon="event"
          color={colors.primary}
        />
        <StatCard
          title="Unpaid"
          value={`$${totalUnpaid}`}
          subtitle={`${unpaidInvoices.length} invoices`}
          ios_icon="dollarsign.circle.fill"
          android_icon="attach-money"
          color={colors.warning}
        />
      </View>

      <View style={styles.stats}>
        <StatCard
          title="Weekly Revenue"
          value={`$${weeklyRevenue}`}
          subtitle="this week"
          ios_icon="chart.line.uptrend.xyaxis"
          android_icon="trending-up"
          color={colors.accent}
        />
        <StatCard
          title="Rating"
          value="4.8"
          subtitle="127 reviews"
          ios_icon="star.fill"
          android_icon="star"
          color={colors.primary}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
        {todaysJobs.length > 0 ? (
          todaysJobs.map((booking, index) => (
            <BookingCard
              key={index}
              booking={booking}
              providerName="Client Name"
            />
          ))
        ) : (
          <View style={[commonStyles.glassCard, styles.emptyState]}>
            <Text style={styles.emptyText}>No jobs scheduled for today</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[commonStyles.glassCard, styles.actionCard]}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>New Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[commonStyles.glassCard, styles.actionCard]}>
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Create Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[commonStyles.glassCard, styles.actionCard]}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Add Client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[commonStyles.glassCard, styles.actionCard]}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
