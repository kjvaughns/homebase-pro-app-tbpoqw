
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '@/contexts/ToastContext';

interface PaymentLink {
  id: string;
  amount_cents: number;
  description: string;
  stripe_payment_link_url: string;
  status: string;
  created_at: string;
  used_at: string | null;
}

export default function PaymentLinksScreen() {
  const { organization } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [links, setLinks] = useState<PaymentLink[]>([]);

  useEffect(() => {
    loadPaymentLinks();
  }, [organization]);

  const loadPaymentLinks = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading payment links:', error);
      showToast('Failed to load payment links', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPaymentLinks();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCopyLink = async (url: string) => {
    await Clipboard.setStringAsync(url);
    showToast('Link copied to clipboard!', 'success');
  };

  const handleShareLink = async (url: string, description: string) => {
    try {
      await Share.share({
        message: `Payment Link: ${description}\n\n${url}`,
        url: url,
      });
    } catch (error) {
      console.error('Error sharing link:', error);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading payment links...</Text>
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
        <Text style={styles.title}>Payment Links</Text>
        <TouchableOpacity onPress={() => router.push('/(provider)/money-home' as any)}>
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Payment Links List */}
      {links.length > 0 ? (
        links.map((link) => (
          <GlassView key={link.id} style={styles.linkCard}>
            <View style={styles.linkHeader}>
              <View style={styles.linkInfo}>
                <Text style={styles.linkAmount}>{formatCurrency(link.amount_cents)}</Text>
                <Text style={styles.linkDescription}>{link.description || 'Payment'}</Text>
                <Text style={styles.linkDate}>Created {formatDate(link.created_at)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      link.status === 'used'
                        ? colors.primary + '30'
                        : link.status === 'expired'
                        ? colors.error + '30'
                        : colors.warning + '30',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        link.status === 'used'
                          ? colors.primary
                          : link.status === 'expired'
                          ? colors.error
                          : colors.warning,
                    },
                  ]}
                >
                  {link.status}
                </Text>
              </View>
            </View>

            {link.status === 'active' && (
              <View style={styles.linkActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCopyLink(link.stripe_payment_link_url)}
                >
                  <IconSymbol
                    ios_icon_name="doc.on.doc"
                    android_material_icon_name="content-copy"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.actionButtonText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShareLink(link.stripe_payment_link_url, link.description)}
                >
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up"
                    android_material_icon_name="share"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassView>
        ))
      ) : (
        <GlassView style={styles.emptyState}>
          <IconSymbol
            ios_icon_name="link"
            android_material_icon_name="link"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No payment links yet</Text>
          <Text style={styles.emptySubtext}>
            Create a payment link to quickly collect payments from clients
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(provider)/money-home' as any)}
          >
            <Text style={styles.createButtonText}>Create Payment Link</Text>
          </TouchableOpacity>
        </GlassView>
      )}
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
  linkCard: {
    padding: 16,
    marginBottom: 12,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  linkDate: {
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
  linkActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
