
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface StripeAccountData {
  connected: boolean;
  account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
}

export default function StripeSettingsScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<StripeAccountData | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    loadStripeAccount();
  }, [organization]);

  const loadStripeAccount = async () => {
    if (!organization) return;

    try {
      setLoading(true);

      // Check if Stripe is connected
      const connected = !!organization.stripe_account_id;

      setAccountData({
        connected,
        account_id: organization.stripe_account_id,
        charges_enabled: connected,
        payouts_enabled: connected,
        details_submitted: connected,
      });
    } catch (error) {
      console.error('Error loading Stripe account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!organization) return;

    try {
      setConnectingStripe(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/stripe-connect-link`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization_id: organization.id,
          }),
        }
      );

      const result = await response.json();

      if (result.url) {
        await Linking.openURL(result.url);
      } else {
        throw new Error('Failed to get Stripe Connect link');
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      Alert.alert('Error', 'Failed to connect Stripe account. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/stripe-connect-link`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organization_id: organization?.id,
            type: 'dashboard',
          }),
        }
      );

      const result = await response.json();

      if (result.url) {
        await Linking.openURL(result.url);
      }
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      Alert.alert('Error', 'Failed to open Stripe dashboard. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Stripe settings...</Text>
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
            android_material_icon_name="chevron-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Stripe Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Account Status */}
      <GlassView style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <IconSymbol
            ios_icon_name={accountData?.connected ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'}
            android_material_icon_name={accountData?.connected ? 'check-circle' : 'error'}
            size={48}
            color={accountData?.connected ? colors.primary : colors.warning}
          />
          <Text style={styles.statusTitle}>
            {accountData?.connected ? 'Connected' : 'Not Connected'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {accountData?.connected
              ? 'Your Stripe account is active and ready to accept payments'
              : 'Connect your Stripe account to start accepting payments'}
          </Text>
        </View>

        {accountData?.connected && (
          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Charges</Text>
              <View style={styles.statusBadge}>
                <IconSymbol
                  ios_icon_name={accountData.charges_enabled ? 'checkmark' : 'xmark'}
                  android_material_icon_name={accountData.charges_enabled ? 'check' : 'close'}
                  size={16}
                  color={accountData.charges_enabled ? colors.primary : colors.error}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: accountData.charges_enabled ? colors.primary : colors.error },
                  ]}
                >
                  {accountData.charges_enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Payouts</Text>
              <View style={styles.statusBadge}>
                <IconSymbol
                  ios_icon_name={accountData.payouts_enabled ? 'checkmark' : 'xmark'}
                  android_material_icon_name={accountData.payouts_enabled ? 'check' : 'close'}
                  size={16}
                  color={accountData.payouts_enabled ? colors.primary : colors.error}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: accountData.payouts_enabled ? colors.primary : colors.error },
                  ]}
                >
                  {accountData.payouts_enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </GlassView>

      {/* Actions */}
      <View style={styles.section}>
        {!accountData?.connected ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConnectStripe}
            disabled={connectingStripe}
          >
            {connectingStripe ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.primaryButtonText}>Connect Stripe Account</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleOpenDashboard}>
              <IconSymbol
                ios_icon_name="arrow.up.right.square"
                android_material_icon_name="open-in-new"
                size={20}
                color={colors.text}
              />
              <Text style={styles.primaryButtonText}>Open Stripe Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleConnectStripe}
            >
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.secondaryButtonText}>Update Account Details</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Stripe Connect</Text>
        <GlassView style={styles.infoCard}>
          <Text style={styles.infoText}>
            Stripe Connect allows you to accept payments directly from your clients. Your funds are
            deposited into your bank account automatically.
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoItemText}>Secure payment processing</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoItemText}>Automatic payouts to your bank</Text>
            </View>
            <View style={styles.infoItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoItemText}>Accept all major credit cards</Text>
            </View>
          </View>
        </GlassView>
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
  statusCard: {
    padding: 24,
    marginBottom: 24,
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 16,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  statusDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: 20,
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  infoCard: {
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItemText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
});
