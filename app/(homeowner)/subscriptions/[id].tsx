
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { GlassView } from '@/components/GlassView';

interface Subscription {
  id: string;
  plan_name: string;
  frequency: string;
  price: number;
  status: string;
  next_service_date: string;
  created_at: string;
  organizations: {
    business_name: string;
    slug: string;
  };
  services: {
    name: string;
  };
}

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          organizations (
            business_name,
            slug
          ),
          services (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      Alert.alert('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async () => {
    if (!subscription) return;

    const newStatus = subscription.status === 'active' ? 'paused' : 'active';
    const action = newStatus === 'paused' ? 'pause' : 'resume';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Subscription`,
      `Are you sure you want to ${action} this subscription?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('subscriptions')
                .update({ status: newStatus })
                .eq('id', subscription.id);

              if (error) throw error;

              Alert.alert('Success', `Subscription ${action}d successfully`);
              fetchSubscription();
            } catch (error: any) {
              console.error(`Error ${action}ing subscription:`, error);
              Alert.alert('Error', `Failed to ${action} subscription`);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel this subscription? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('subscriptions')
                .update({ status: 'cancelled' })
                .eq('id', subscription?.id);

              if (error) throw error;

              Alert.alert('Success', 'Subscription cancelled');
              router.back();
            } catch (error: any) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={[commonStyles.container, styles.centered]}>
        <Text style={styles.errorText}>Subscription not found</Text>
      </View>
    );
  }

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
        <Text style={styles.title}>Subscription Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassView style={styles.card}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="repeat.circle.fill"
              android_material_icon_name="repeat"
              size={64}
              color={colors.primary}
            />
          </View>

          <Text style={styles.planName}>{subscription.plan_name}</Text>
          <Text style={styles.providerName}>{subscription.organizations.business_name}</Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{subscription.status.toUpperCase()}</Text>
          </View>
        </GlassView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Details</Text>
          <GlassView style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{subscription.services?.name || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Frequency</Text>
              <Text style={styles.detailValue}>{subscription.frequency}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>${subscription.price}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Service</Text>
              <Text style={styles.detailValue}>
                {subscription.next_service_date
                  ? new Date(subscription.next_service_date).toLocaleDateString()
                  : 'Not scheduled'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Started</Text>
              <Text style={styles.detailValue}>
                {new Date(subscription.created_at).toLocaleDateString()}
              </Text>
            </View>
          </GlassView>
        </View>

        {subscription.status !== 'cancelled' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePauseResume}
            >
              <IconSymbol
                ios_icon_name={subscription.status === 'active' ? 'pause.circle' : 'play.circle'}
                android_material_icon_name={subscription.status === 'active' ? 'pause-circle' : 'play-circle'}
                size={20}
                color={colors.accent}
              />
              <Text style={styles.actionButtonText}>
                {subscription.status === 'active' ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <IconSymbol
                ios_icon_name="xmark.circle"
                android_material_icon_name="cancel"
                size={20}
                color={colors.error}
              />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Cancel Subscription
              </Text>
            </TouchableOpacity>
          </View>
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  card: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  providerName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
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
  detailsCard: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    borderColor: colors.error + '30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
