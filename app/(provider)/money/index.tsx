
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

type Tab = 'invoices' | 'payments' | 'overview' | 'subscriptions';

export default function MoneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'overview');
  const [stats, setStats] = useState({
    totalCollected: 0,
    pending: 0,
    fees: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as Tab);
    }
  }, [params.tab]);

  useEffect(() => {
    if (organization?.id) {
      loadStats();
    }
  }, [organization?.id]);

  const loadStats = async () => {
    try {
      if (!organization?.id) return;

      // Load payment stats
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, created_at')
        .eq('organization_id', organization.id);

      const totalCollected = payments
        ?.filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pending = payments
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const thisMonth = payments
        ?.filter(p => {
          const date = new Date(p.created_at);
          const now = new Date();
          return date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear() &&
                 p.status === 'succeeded';
        })
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalCollected: Math.round(totalCollected),
        pending: Math.round(pending),
        fees: Math.round(totalCollected * 0.025), // Estimate 2.5% fees
        thisMonth: Math.round(thisMonth),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'invoices', label: 'Invoices', icon: 'receipt' },
    { key: 'payments', label: 'Payments', icon: 'payment' },
    { key: 'subscriptions', label: 'Subscriptions', icon: 'autorenew' },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Money</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name={tab.icon}
                android_material_icon_name={tab.icon}
                size={20}
                color={activeTab === tab.key ? colors.primary : colors.textSecondary}
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <GlassView style={styles.statCard}>
                <Text style={styles.statLabel}>Total Collected</Text>
                <Text style={styles.statValue}>${stats.totalCollected}</Text>
              </GlassView>
              <GlassView style={styles.statCard}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>${stats.pending}</Text>
              </GlassView>
              <GlassView style={styles.statCard}>
                <Text style={styles.statLabel}>Fees</Text>
                <Text style={styles.statValue}>${stats.fees}</Text>
              </GlassView>
              <GlassView style={styles.statCard}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.statValue}>${stats.thisMonth}</Text>
              </GlassView>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(provider)/money/create-invoice')}
              >
                <GlassView style={styles.actionGlass}>
                  <IconSymbol
                    ios_icon_name="doc.text.fill"
                    android_material_icon_name="description"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.actionText}>Create Invoice</Text>
                </GlassView>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(provider)/money/payment-link')}
              >
                <GlassView style={styles.actionGlass}>
                  <IconSymbol
                    ios_icon_name="link"
                    android_material_icon_name="link"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.actionText}>Payment Link</Text>
                </GlassView>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'invoices' && (
          <View style={styles.section}>
            <GlassView style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No invoices yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(provider)/money/create-invoice')}
              >
                <Text style={styles.emptyButtonText}>Create Invoice</Text>
              </TouchableOpacity>
            </GlassView>
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.section}>
            <GlassView style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="creditcard"
                android_material_icon_name="payment"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No payments yet</Text>
            </GlassView>
          </View>
        )}

        {activeTab === 'subscriptions' && (
          <View style={styles.section}>
            <GlassView style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="autorenew"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No subscriptions yet</Text>
            </GlassView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tabActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary + '40',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  section: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionGlass: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
  },
});
