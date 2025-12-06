
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { GlassView } from '@/components/GlassView';

interface Subscription {
  id: string;
  plan_name: string;
  frequency: string;
  price: number;
  status: string;
  next_service_date: string;
  organizations: {
    business_name: string;
    slug: string;
  };
}

export default function SubscriptionsScreen() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          organizations (
            business_name,
            slug
          )
        `)
        .eq('homeowner_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'paused':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Weekly';
      case 'biweekly':
        return 'Bi-weekly';
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      default:
        return frequency;
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="repeat"
              android_material_icon_name="repeat"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No active subscriptions</Text>
            <Text style={styles.emptySubtext}>
              Subscribe to recurring services for regular maintenance
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          subscriptions.map((subscription, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/homeowner/subscriptions/${subscription.id}`)}
            >
              <GlassView style={styles.subscriptionCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <IconSymbol
                      ios_icon_name="repeat.circle.fill"
                      android_material_icon_name="repeat"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) + '30' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(subscription.status) }]}>
                      {subscription.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.planName}>{subscription.plan_name}</Text>
                <Text style={styles.providerName}>{subscription.organizations.business_name}</Text>

                <View style={styles.detailsRow}>
                  <View style={styles.detail}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailText}>{getFrequencyText(subscription.frequency)}</Text>
                  </View>
                  <View style={styles.detail}>
                    <IconSymbol
                      ios_icon_name="dollarsign.circle"
                      android_material_icon_name="attach-money"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.detailText}>${subscription.price}</Text>
                  </View>
                </View>

                {subscription.next_service_date && (
                  <View style={styles.nextService}>
                    <Text style={styles.nextServiceLabel}>Next Service:</Text>
                    <Text style={styles.nextServiceDate}>
                      {new Date(subscription.next_service_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </GlassView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  subscriptionCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  nextService: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  nextServiceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 8,
  },
  nextServiceDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
