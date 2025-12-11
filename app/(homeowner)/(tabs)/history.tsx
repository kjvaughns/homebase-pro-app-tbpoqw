
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Booking {
  id: string;
  service_name: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  price: number;
  address: string;
  organization_id: string;
  organizations?: {
    business_name: string;
  };
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  organization_id: string;
  organizations?: {
    business_name: string;
  };
}

export default function HistoryScreen() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'invoices'>('bookings');

  const loadHistory = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('History: Loading data for homeowner:', profile.id);

      // Load completed bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          service_name,
          scheduled_date,
          scheduled_time,
          status,
          price,
          address,
          organization_id,
          organizations(business_name)
        `)
        .eq('homeowner_id', profile.id)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(50);

      if (bookingsError) {
        console.error('History: Error loading bookings:', bookingsError);
      } else {
        console.log('History: Loaded bookings:', bookingsData?.length || 0);
        setBookings(bookingsData || []);
      }

      // Load paid invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total,
          status,
          due_date,
          paid_date,
          organization_id,
          organizations(business_name)
        `)
        .eq('status', 'paid')
        .order('paid_date', { ascending: false })
        .limit(50);

      if (invoicesError) {
        console.error('History: Error loading invoices:', invoicesError);
      } else {
        console.log('History: Loaded invoices:', invoicesData?.length || 0);
        setInvoices(invoicesData || []);
      }
    } catch (err: any) {
      console.error('History: Error:', err);
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
          Loading history...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Service History</Text>
        <Text style={styles.subtitle}>View your past bookings and invoices</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>
            Bookings ({bookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.tabActive]}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}>
            Invoices ({invoices.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <>
          {bookings.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No Completed Bookings"
              message="Your completed services will appear here"
            />
          ) : (
            bookings.map((booking) => (
              <GlassView key={booking.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={24}
                      color={colors.success}
                    />
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>{booking.service_name}</Text>
                      <Text style={styles.cardSubtitle}>
                        {booking.organizations?.business_name || 'Unknown Provider'}
                      </Text>
                    </View>
                  </View>
                  {booking.price && (
                    <Text style={styles.cardPrice}>{formatCurrency(booking.price)}</Text>
                  )}
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.cardDetail}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.cardDetailText}>
                      {formatDate(booking.scheduled_date)}
                    </Text>
                  </View>
                  {booking.address && (
                    <View style={styles.cardDetail}>
                      <IconSymbol
                        ios_icon_name="location.fill"
                        android_material_icon_name="location_on"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.cardDetailText} numberOfLines={1}>
                        {booking.address}
                      </Text>
                    </View>
                  )}
                </View>
              </GlassView>
            ))
          )}
        </>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          {invoices.length === 0 ? (
            <EmptyState
              icon="receipt"
              title="No Paid Invoices"
              message="Your payment history will appear here"
            />
          ) : (
            invoices.map((invoice) => (
              <GlassView key={invoice.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check_circle"
                      size={24}
                      color={colors.success}
                    />
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>
                        Invoice #{invoice.invoice_number || invoice.id.slice(0, 8)}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {invoice.organizations?.business_name || 'Unknown Provider'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardPrice}>{formatCurrency(invoice.total)}</Text>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.cardDetail}>
                    <IconSymbol
                      ios_icon_name="calendar"
                      android_material_icon_name="event"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.cardDetailText}>
                      Paid: {invoice.paid_date ? formatDate(invoice.paid_date) : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>PAID</Text>
                  </View>
                </View>
              </GlassView>
            ))
          )}
        </>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  cardDetails: {
    gap: 8,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
});
