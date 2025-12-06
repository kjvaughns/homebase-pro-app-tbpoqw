
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function BillingScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadSubscription();
  }, [organization]);

  const loadSubscription = async () => {
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
            action: 'get_subscription_status',
            org_id: organization.id,
          }),
        }
      );

      const result = await response.json();
      setSubscription(result.subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
      Alert.alert('Error', 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free':
        return colors.textSecondary;
      case 'growth':
        return colors.accent;
      case 'pro':
        return colors.primary;
      case 'scale':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading billing...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Billing</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Current Plan */}
      <GlassView style={styles.planCard}>
        <View style={styles.planHeader}>
          <View>
            <Text style={styles.planLabel}>Current Plan</Text>
            <Text style={[styles.planName, { color: getPlanColor(subscription?.subscription_plan || 'free') }]}>
              {(subscription?.subscription_plan || 'free').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '30' }]}>
            <Text style={[styles.statusText, { color: colors.success }]}>
              {subscription?.subscription_status || 'active'}
            </Text>
          </View>
        </View>
        <Text style={styles.planDescription}>
          {subscription?.subscription_plan === 'free' && 'Limited to 5 jobs per month'}
          {subscription?.subscription_plan === 'growth' && 'Unlimited jobs, 3 team seats'}
          {subscription?.subscription_plan === 'pro' && 'Unlimited jobs, 10 team seats'}
          {subscription?.subscription_plan === 'scale' && 'Unlimited everything'}
        </Text>
      </GlassView>

      {/* Upgrade Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upgrade Your Plan</Text>
        
        <GlassView style={styles.upgradeCard}>
          <View style={styles.upgradeHeader}>
            <Text style={styles.upgradePlan}>Growth</Text>
            <Text style={styles.upgradePrice}>$49/mo</Text>
          </View>
          <Text style={styles.upgradeFeatures}>
            - Unlimited jobs{'\n'}
            - 3 team seats{'\n'}
            - 2.5% transaction fee{'\n'}
            - Priority support
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </GlassView>

        <GlassView style={styles.upgradeCard}>
          <View style={styles.upgradeHeader}>
            <Text style={styles.upgradePlan}>Pro</Text>
            <Text style={styles.upgradePrice}>$129/mo</Text>
          </View>
          <Text style={styles.upgradeFeatures}>
            - Everything in Growth{'\n'}
            - 10 team seats{'\n'}
            - 2% transaction fee{'\n'}
            - Advanced analytics
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </GlassView>
      </View>

      {/* Billing History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Billing History</Text>
        <GlassView style={styles.emptyState}>
          <IconSymbol ios_icon_name="doc.text" android_material_icon_name="description" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No billing history yet</Text>
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  planCard: {
    padding: 20,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  planName: {
    fontSize: 28,
    fontWeight: '700',
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
  planDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
  upgradeCard: {
    padding: 20,
    marginBottom: 12,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  upgradePlan: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  upgradePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  upgradeFeatures: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
