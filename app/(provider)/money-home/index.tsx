
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import * as Clipboard from 'expo-clipboard';
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
  const [financials, setFinancials] = useState<FinancialData | null>(null);
  const [paymentLinkModal, setPaymentLinkModal] = useState(false);
  const [linkAmount, setLinkAmount] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);

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
            Authorization: `Bearer ${session?.access_token}`,
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
      showToast('Failed to load financial data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleCreatePaymentLink = async () => {
    if (!linkAmount || parseFloat(linkAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setCreatingLink(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/create-payment-link`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization_id: organization?.id,
            amount_cents: Math.round(parseFloat(linkAmount) * 100),
            description: linkDescription || 'Payment',
          }),
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Copy link to clipboard
      if (result.payment_link_url) {
        await Clipboard.setStringAsync(result.payment_link_url);
        showToast('Payment link copied to clipboard!', 'success');
      }

      setPaymentLinkModal(false);
      setLinkAmount('');
      setLinkDescription('');
      loadFinancials();
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      Alert.alert('Error', error.message || 'Failed to create payment link');
    } finally {
      setCreatingLink(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Money Hub...</Text>
      </View>
    );
  }

  return (
    <>
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
                  android_material_icon_name="bar-chart"
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
                  android_material_icon_name="account-balance"
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
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </GlassView>
          </Pressable>

          {/* Payment Links */}
          <Pressable
            style={({ pressed }) => [pressed && styles.pressed]}
            onPress={() => router.push('/(provider)/money/payment-links' as any)}
          >
            <GlassView style={styles.card}>
              <View style={styles.cardIcon}>
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Payment Links</Text>
                <Text style={styles.cardSubtitle}>Create and manage quick payment links</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
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
                android_material_icon_name="chevron-right"
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
                android_material_icon_name="chevron-right"
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
                  android_material_icon_name="local-offer"
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
                android_material_icon_name="chevron-right"
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
                  android_material_icon_name="trending-up"
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
                android_material_icon_name="chevron-right"
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
                  android_material_icon_name={financials?.stripe_connected ? 'check-circle' : 'error'}
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
                android_material_icon_name="chevron-right"
                size={20}
                color={colors.textSecondary}
              />
            </GlassView>
          </Pressable>
        </View>

        {/* Quick Action Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setPaymentLinkModal(true)}
            activeOpacity={0.8}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={28}
              color={colors.text}
            />
            <Text style={styles.fabText}>New Payment Link</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Link Modal */}
      <Modal
        visible={paymentLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentLinkModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPaymentLinkModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <GlassView style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create Payment Link</Text>
              <Text style={styles.modalSubtitle}>
                Generate a quick payment link to share with clients
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={linkAmount}
                  onChangeText={setLinkAmount}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What is this payment for?"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  value={linkDescription}
                  onChangeText={setLinkDescription}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setPaymentLinkModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleCreatePaymentLink}
                  disabled={creatingLink}
                >
                  {creatingLink ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={styles.modalButtonText}>Create & Copy Link</Text>
                  )}
                </TouchableOpacity>
              </View>
            </GlassView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  fabContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
