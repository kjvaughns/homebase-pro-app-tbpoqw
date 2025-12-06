
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function MoneyHomeScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState<any>(null);

  useEffect(() => {
    loadFinancials();
  }, [organization]);

  const loadFinancials = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/provider-financials`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_financials',
            org_id: organization.id,
          }),
        }
      );

      const result = await response.json();
      setFinancials(result);
    } catch (error) {
      console.error('Error loading financials:', error);
      Alert.alert('Error', 'Failed to load financial data');
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
        <Text style={styles.loadingText}>Loading financials...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Money</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Financial Overview */}
      <View style={styles.statsGrid}>
        <GlassView style={styles.statCard}>
          <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach-money" size={32} color={colors.primary} />
          <Text style={styles.statValue}>{formatCurrency(financials?.total_revenue_cents || 0)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </GlassView>

        <GlassView style={styles.statCard}>
          <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-today" size={32} color={colors.accent} />
          <Text style={styles.statValue}>{formatCurrency(financials?.mtd_revenue_cents || 0)}</Text>
          <Text style={styles.statLabel}>MTD Revenue</Text>
        </GlassView>

        <GlassView style={styles.statCard}>
          <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={32} color={colors.warning} />
          <Text style={styles.statValue}>{formatCurrency(financials?.outstanding_balance_cents || 0)}</Text>
          <Text style={styles.statLabel}>Outstanding</Text>
        </GlassView>

        <GlassView style={styles.statCard}>
          <IconSymbol 
            ios_icon_name={financials?.stripe_connected ? "checkmark.circle.fill" : "xmark.circle.fill"} 
            android_material_icon_name={financials?.stripe_connected ? "check-circle" : "cancel"} 
            size={32} 
            color={financials?.stripe_connected ? colors.success : colors.error} 
          />
          <Text style={styles.statValue}>{financials?.stripe_connected ? 'Connected' : 'Not Setup'}</Text>
          <Text style={styles.statLabel}>Stripe</Text>
        </GlassView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity onPress={() => router.push('/(provider)/money/create-invoice' as any)}>
          <GlassView style={styles.actionItem}>
            <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="description" size={24} color={colors.primary} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Create Invoice</Text>
              <Text style={styles.actionDescription}>Send an invoice to a client</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(provider)/money/payment-link' as any)}>
          <GlassView style={styles.actionItem}>
            <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={24} color={colors.accent} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Payment Link</Text>
              <Text style={styles.actionDescription}>Create a quick payment link</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(provider)/money/record-payment' as any)}>
          <GlassView style={styles.actionItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Record Payment</Text>
              <Text style={styles.actionDescription}>Log a cash or check payment</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Recent Payments */}
      {financials?.recent_payments && financials.recent_payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {financials.recent_payments.slice(0, 5).map((payment: any, index: number) => (
            <GlassView key={index} style={styles.paymentItem}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount_cents || payment.amount * 100)}</Text>
                <Text style={styles.paymentDate}>
                  {new Date(payment.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: payment.status === 'succeeded' ? colors.success + '30' : colors.warning + '30' }]}>
                <Text style={[styles.statusText, { color: payment.status === 'succeeded' ? colors.success : colors.warning }]}>
                  {payment.status}
                </Text>
              </View>
            </GlassView>
          ))}
        </View>
      )}

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity onPress={() => router.push('/(provider)/settings/payment' as any)}>
          <GlassView style={styles.actionItem}>
            <IconSymbol ios_icon_name="creditcard.fill" android_material_icon_name="payment" size={24} color={colors.primary} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Payment Settings</Text>
              <Text style={styles.actionDescription}>Stripe Connect & payouts</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(provider)/billing/index' as any)}>
          <GlassView style={styles.actionItem}>
            <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="receipt" size={24} color={colors.accent} />
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Billing</Text>
              <Text style={styles.actionDescription}>Subscription & invoices</Text>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
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
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
