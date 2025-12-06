
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    loadPaymentSettings();
  }, [organization]);

  const loadPaymentSettings = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      setStripeAccountId(organization.stripe_account_id || null);
      setStripeConnected(!!organization.stripe_account_id);
    } catch (error) {
      console.error('Error loading payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectStripe = async () => {
    if (!organization) return;

    try {
      setConnectingStripe(true);

      // Call Stripe Connect edge function
      const { data, error } = await supabase.functions.invoke('stripe-connect-link', {
        body: {
          organization_id: organization.id,
          return_url: 'homebasepro://settings/payment',
          refresh_url: 'homebasepro://settings/payment',
        },
      });

      if (error) throw error;

      if (data?.url) {
        Alert.alert(
          'Connect Stripe',
          'You will be redirected to Stripe to complete the connection. This will open in your browser.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: () => {
                // In a real app, you would open the URL in a browser
                console.log('Stripe Connect URL:', data.url);
                Alert.alert('Info', 'Stripe Connect integration would open here. URL: ' + data.url);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      Alert.alert('Error', 'Failed to connect Stripe. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const disconnectStripe = () => {
    Alert.alert(
      'Disconnect Stripe',
      'Are you sure you want to disconnect your Stripe account? You will no longer be able to accept payments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('organizations')
                .update({ stripe_account_id: null })
                .eq('id', organization?.id);

              if (error) throw error;

              setStripeConnected(false);
              setStripeAccountId(null);
              Alert.alert('Success', 'Stripe account disconnected successfully.');
            } catch (error) {
              console.error('Error disconnecting Stripe:', error);
              Alert.alert('Error', 'Failed to disconnect Stripe. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stripe Connect Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stripe Connect</Text>
        <GlassView style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <IconSymbol
                ios_icon_name="creditcard.fill"
                android_material_icon_name="payment"
                size={32}
                color={stripeConnected ? colors.success : colors.textSecondary}
              />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Stripe Account</Text>
                <Text style={styles.cardSubtitle}>
                  {stripeConnected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
            </View>
            {stripeConnected && (
              <View style={styles.badge}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.success}
                />
              </View>
            )}
          </View>

          {stripeConnected && stripeAccountId && (
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Account ID</Text>
              <Text style={styles.accountValue}>{stripeAccountId}</Text>
            </View>
          )}

          <Text style={styles.cardDescription}>
            {stripeConnected
              ? 'Your Stripe account is connected and ready to accept payments.'
              : 'Connect your Stripe account to start accepting payments from customers.'}
          </Text>

          {stripeConnected ? (
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={disconnectStripe}
            >
              <Text style={[styles.buttonText, styles.dangerButtonText]}>Disconnect Stripe</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={connectStripe}
              disabled={connectingStripe}
            >
              {connectingStripe ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.buttonText}>Connect Stripe</Text>
              )}
            </TouchableOpacity>
          )}
        </GlassView>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => Alert.alert('Info', 'Payment methods management coming soon')}>
          <GlassView style={styles.menuItem}>
            <IconSymbol
              ios_icon_name="creditcard"
              android_material_icon_name="credit-card"
              size={24}
              color={colors.primary}
            />
            <View style={styles.menuItemText}>
              <Text style={styles.menuItemTitle}>Saved Cards</Text>
              <Text style={styles.menuItemSubtitle}>Manage your payment methods</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Payout Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payouts</Text>
        <TouchableOpacity onPress={() => Alert.alert('Info', 'Payout settings managed through Stripe Dashboard')}>
          <GlassView style={styles.menuItem}>
            <IconSymbol
              ios_icon_name="banknote"
              android_material_icon_name="account-balance"
              size={24}
              color={colors.success}
            />
            <View style={styles.menuItemText}>
              <Text style={styles.menuItemTitle}>Bank Account</Text>
              <Text style={styles.menuItemSubtitle}>Configure payout destination</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Info', 'Payout schedule managed through Stripe Dashboard')}>
          <GlassView style={styles.menuItem}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="schedule"
              size={24}
              color={colors.accent}
            />
            <View style={styles.menuItemText}>
              <Text style={styles.menuItemTitle}>Payout Schedule</Text>
              <Text style={styles.menuItemSubtitle}>Daily, weekly, or monthly</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Transaction Fees */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Fees</Text>
        <GlassView style={styles.card}>
          <Text style={styles.cardDescription}>
            HomeBase charges a transaction fee based on your subscription plan:
          </Text>
          <View style={styles.feeList}>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Free Plan</Text>
              <Text style={styles.feeValue}>8%</Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Growth Plan</Text>
              <Text style={styles.feeValue}>2.5%</Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Pro Plan</Text>
              <Text style={styles.feeValue}>2%</Text>
            </View>
            <View style={styles.feeItem}>
              <Text style={styles.feeLabel}>Scale Plan</Text>
              <Text style={styles.feeValue}>1.5%</Text>
            </View>
          </View>
          <Text style={styles.cardNote}>
            Plus Stripe processing fees (2.9% + $0.30 per transaction)
          </Text>
        </GlassView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badge: {
    padding: 4,
  },
  accountInfo: {
    backgroundColor: colors.glass,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  accountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dangerButtonText: {
    color: colors.error,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  feeList: {
    marginTop: 12,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.text,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
