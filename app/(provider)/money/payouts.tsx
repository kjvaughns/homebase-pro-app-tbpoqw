
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface PayoutData {
  available_balance_cents: number;
  pending_balance_cents: number;
  payouts: Array<{
    id: string;
    amount: number;
    arrival_date: number;
    status: string;
    created: number;
  }>;
}

export default function PayoutsScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);

  useEffect(() => {
    loadPayouts();
  }, [organization]);

  const loadPayouts = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/get-balance`,
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
      setPayoutData(result);
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayouts();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading payouts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
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
        <Text style={styles.title}>Payouts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceGrid}>
        <GlassView style={styles.balanceCard}>
          <IconSymbol
            ios_icon_name="banknote.fill"
            android_material_icon_name="account-balance-wallet"
            size={32}
            color={colors.primary}
          />
          <Text style={styles.balanceValue}>
            {formatCurrency(payoutData?.available_balance_cents || 0)}
          </Text>
          <Text style={styles.balanceLabel}>Available Balance</Text>
        </GlassView>

        <GlassView style={styles.balanceCard}>
          <IconSymbol
            ios_icon_name="clock.fill"
            android_material_icon_name="schedule"
            size={32}
            color={colors.warning}
          />
          <Text style={styles.balanceValue}>
            {formatCurrency(payoutData?.pending_balance_cents || 0)}
          </Text>
          <Text style={styles.balanceLabel}>Pending</Text>
        </GlassView>
      </View>

      {/* Payout History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payout History</Text>

        {payoutData?.payouts && payoutData.payouts.length > 0 ? (
          payoutData.payouts.map((payout, index) => (
            <GlassView key={index} style={styles.payoutItem}>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutAmount}>{formatCurrency(payout.amount)}</Text>
                <Text style={styles.payoutDate}>
                  Arrives {formatDate(payout.arrival_date)}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      payout.status === 'paid'
                        ? colors.primary + '30'
                        : payout.status === 'pending'
                        ? colors.warning + '30'
                        : colors.error + '30',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        payout.status === 'paid'
                          ? colors.primary
                          : payout.status === 'pending'
                          ? colors.warning
                          : colors.error,
                    },
                  ]}
                >
                  {payout.status}
                </Text>
              </View>
            </GlassView>
          ))
        ) : (
          <GlassView style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="tray"
              android_material_icon_name="inbox"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No payouts yet</Text>
            <Text style={styles.emptySubtext}>
              Payouts will appear here once you start receiving payments
            </Text>
          </GlassView>
        )}
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
  balanceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  balanceCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
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
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  payoutDate: {
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
