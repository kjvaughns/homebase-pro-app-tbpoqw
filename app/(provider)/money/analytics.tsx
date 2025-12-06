
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  revenue_by_month: Array<{ month: string; revenue: number }>;
  top_services: Array<{ service_name: string; revenue: number; count: number }>;
  invoice_stats: {
    paid_count: number;
    unpaid_count: number;
    paid_total: number;
    unpaid_total: number;
  };
  average_job_value: number;
  total_revenue: number;
  total_jobs: number;
}

export default function AnalyticsScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [organization]);

  const loadAnalytics = async () => {
    if (!organization) return;

    try {
      setLoading(true);

      // Load invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organization.id);

      // Load payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'succeeded');

      // Calculate analytics
      const now = new Date();
      const revenueByMonth: { [key: string]: number } = {};

      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        revenueByMonth[monthKey] = 0;
      }

      payments?.forEach((payment) => {
        const date = new Date(payment.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (revenueByMonth[monthKey] !== undefined) {
          revenueByMonth[monthKey] += payment.amount_cents || payment.amount * 100;
        }
      });

      // Invoice stats
      const paidInvoices = invoices?.filter((inv) => inv.status === 'paid') || [];
      const unpaidInvoices = invoices?.filter((inv) => inv.status === 'open') || [];

      const analyticsData: AnalyticsData = {
        revenue_by_month: Object.entries(revenueByMonth).map(([month, revenue]) => ({
          month,
          revenue,
        })),
        top_services: [],
        invoice_stats: {
          paid_count: paidInvoices.length,
          unpaid_count: unpaidInvoices.length,
          paid_total: paidInvoices.reduce((sum, inv) => sum + (inv.total_cents || inv.total * 100), 0),
          unpaid_total: unpaidInvoices.reduce((sum, inv) => sum + (inv.total_cents || inv.total * 100), 0),
        },
        average_job_value:
          paidInvoices.length > 0
            ? paidInvoices.reduce((sum, inv) => sum + (inv.total_cents || inv.total * 100), 0) /
              paidInvoices.length
            : 0,
        total_revenue: payments?.reduce((sum, p) => sum + (p.amount_cents || p.amount * 100), 0) || 0,
        total_jobs: invoices?.length || 0,
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  const maxRevenue = Math.max(...(analytics?.revenue_by_month.map((m) => m.revenue) || [1]));

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="chevron-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Financial Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <GlassView style={styles.summaryCard}>
          <IconSymbol
            ios_icon_name="dollarsign.circle.fill"
            android_material_icon_name="attach-money"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.summaryValue}>{formatCurrency(analytics?.total_revenue || 0)}</Text>
          <Text style={styles.summaryLabel}>Total Revenue</Text>
        </GlassView>

        <GlassView style={styles.summaryCard}>
          <IconSymbol
            ios_icon_name="briefcase.fill"
            android_material_icon_name="work"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.summaryValue}>{analytics?.total_jobs || 0}</Text>
          <Text style={styles.summaryLabel}>Total Jobs</Text>
        </GlassView>

        <GlassView style={styles.summaryCard}>
          <IconSymbol
            ios_icon_name="chart.bar.fill"
            android_material_icon_name="bar-chart"
            size={28}
            color={colors.primary}
          />
          <Text style={styles.summaryValue}>
            {formatCurrency(analytics?.average_job_value || 0)}
          </Text>
          <Text style={styles.summaryLabel}>Avg Job Value</Text>
        </GlassView>
      </View>

      {/* Revenue by Month Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue by Month</Text>
        <GlassView style={styles.chartCard}>
          <View style={styles.chart}>
            {analytics?.revenue_by_month.map((item, index) => {
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 120 : 0;
              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.barContainer}>
                    <View style={[styles.bar, { height: Math.max(height, 4) }]} />
                  </View>
                  <Text style={styles.barLabel}>{item.month.split(' ')[0]}</Text>
                  <Text style={styles.barValue}>{formatCurrency(item.revenue)}</Text>
                </View>
              );
            })}
          </View>
        </GlassView>
      </View>

      {/* Invoice Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice Overview</Text>
        <View style={styles.statsGrid}>
          <GlassView style={styles.statCard}>
            <View style={styles.statHeader}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.statCount}>{analytics?.invoice_stats.paid_count || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Paid Invoices</Text>
            <Text style={styles.statValue}>
              {formatCurrency(analytics?.invoice_stats.paid_total || 0)}
            </Text>
          </GlassView>

          <GlassView style={styles.statCard}>
            <View style={styles.statHeader}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={24}
                color={colors.warning}
              />
              <Text style={styles.statCount}>{analytics?.invoice_stats.unpaid_count || 0}</Text>
            </View>
            <Text style={styles.statLabel}>Unpaid Invoices</Text>
            <Text style={styles.statValue}>
              {formatCurrency(analytics?.invoice_stats.unpaid_total || 0)}
            </Text>
          </GlassView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  chartCard: {
    padding: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120,
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  barValue: {
    fontSize: 10,
    color: colors.text,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
});
