
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { useToast } from '@/contexts/ToastContext';

interface FinancialData {
  mtd_revenue_cents: number;
  outstanding_invoices_count: number;
  outstanding_invoices_total_cents: number;
  stripe_connected: boolean;
  stripe_balance_cents: number;
  recent_payments: any[];
}

export default function MoneyHomeScreen() {
  const { organization } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financials, setFinancials] = useState<FinancialData | null>(null);

  useEffect(() => {
    loadFinancials();
  }, [organization]);

  const loadFinancials = async () => {
    if (!organization) {
      console.log('MoneyHome: No organization found');
      setLoading(false);
      setError('No organization found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('MoneyHome: Loading financials for organization:', organization.id);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/provider-financials`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_financials',
            org_id: organization.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load financials: ${response.status}`);
      }

      const result = await response.json();
      console.log('MoneyHome: Financials loaded successfully');
      setFinancials(result);
    } catch (error: any) {
      console.error('MoneyHome: Error loading financials:', error);
      setError(error.message || 'Failed to load financial data');
      showToast('Failed to load financial data', 'error');
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
        <Text style={styles.loadingText}>Loading Money Hub...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <GlassView style={styles.errorCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.circle.fill"
            android_material_icon_name="error"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Unable to Load Data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={loadFinancials}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </GlassView>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="chevron_left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Money Hub</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Overview KPI Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.kpiGrid}>
          <Pressable
            style={({ pressed }) => [styles.kpiCard, pressed && styles.pressed]}
            onPress={() => router.push('/(provider)/money/analytics' as any)}
          >
            <GlassView style={styles.kpiContent}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar_chart"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.kpiValue}>
                {formatCurrency(financials?.mtd_revenue_cents || 0)}
              </Text>
              <Text style={styles.kpiLabel}>MTD Revenue</Text>
              <Text style={styles.kpiHint}>Tap for analytics</Text>
            </GlassView>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.kpiCard, pressed && styles.pressed]}
            onPress={() => router.push('/(provider)/money?tab=invoices' as any)}
          >
            <GlassView style={styles.kpiContent}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={32}
                color={colors.warning}
              />
              <Text style={styles.kpiValue}>
                {financials?.outstanding_invoices_count || 0}
              </Text>
              <Text style={styles.kpiLabel}>Outstanding Invoices</Text>
              <Text style={styles.kpiSubValue}>
                {formatCurrency(financials?.outstanding_invoices_total_cents || 0)}
              </Text>
            </GlassView>
          </Pressable>
        </View>
      </View>

      {/* Main Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Tools</Text>

        {/* Payouts */}
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => router.push('/(provider)/money/payouts' as any)}
        >
          <GlassView style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="banknote.fill"
                android_material_icon_name="account_balance"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Payouts</Text>
              <Text style={styles.cardSubtitle}>View Stripe balance & payout history</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </Pressable>

        {/* Invoices */}
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => router.push('/(provider)/money?tab=invoices' as any)}
        >
          <GlassView style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Invoices</Text>
              <Text style={styles.cardSubtitle}>All invoices & billing activity</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </Pressable>

        {/* Payments */}
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => router.push('/(provider)/money?tab=payments' as any)}
        >
          <GlassView style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="creditcard.fill"
                android_material_icon_name="payment"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Payments</Text>
              <Text style={styles.cardSubtitle}>Recent payments received</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </Pressable>

        {/* Pricing & Discounts */}
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => router.push('/(provider)/money/pricing' as any)}
        >
          <GlassView style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="tag.fill"
                android_material_icon_name="local_offer"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Pricing & Discounts</Text>
              <Text style={styles.cardSubtitle}>Edit default rates & discount rules</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </Pressable>

        {/* Financial Analytics */}
        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => router.push('/(provider)/money/analytics' as any)}
        >
          <GlassView style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="chart.line.uptrend.xyaxis"
                android_material_icon_name="trending_up"
                size={28}
                color={colors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Financial Analytics</Text>
              <Text style={styles.cardSubtitle}>Charts for revenue, jobs, and trends</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </Pressable>
      </View>

      {/* Footer Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <Pressable
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => router.push('/(provider)/money/stripe' as any)}
        >
          <GlassView style={styles.card}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name={financials?.stripe_connected ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'}
                android_material_icon_name={financials?.stripe_connected ? 'check_circle' : 'error'}
                size={28}
                color={financials?.stripe_connected ? colors.primary : colors.warning}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Stripe Account Settings</Text>
              <Text style={styles.cardSubtitle}>
                {financials?.stripe_connected ? 'Connected & Active' : 'Setup Required'}
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  errorCard: {
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  errorButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.glass,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
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
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
  },
  kpiContent: {
    padding: 20,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  kpiLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  kpiSubValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  kpiHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    opacity: 0.7,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
