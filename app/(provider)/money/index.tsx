
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, Payment } from '@/types';
import { EmptyState } from '@/components/EmptyState';

type TabType = 'invoices' | 'payments' | 'overview';

export default function MoneyScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    totalCollected: 0,
    pending: 0,
    fees: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMoneyData();
  }, []);

  const loadMoneyData = async () => {
    try {
      const [invoicesRes, paymentsRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('organization_id', organization?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('organization_id', organization?.id)
          .order('created_at', { ascending: false }),
      ]);

      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (paymentsRes.data) {
        setPayments(paymentsRes.data);
        
        // Calculate stats
        const collected = paymentsRes.data
          .filter((p) => p.status === 'succeeded')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        
        const pending = invoicesRes.data
          ?.filter((i) => i.status === 'sent' || i.status === 'overdue')
          .reduce((sum, i) => sum + Number(i.total), 0) || 0;

        const thisMonth = paymentsRes.data
          .filter((p) => {
            const paymentDate = new Date(p.created_at);
            const now = new Date();
            return (
              p.status === 'succeeded' &&
              paymentDate.getMonth() === now.getMonth() &&
              paymentDate.getFullYear() === now.getFullYear()
            );
          })
          .reduce((sum, p) => sum + Number(p.amount), 0);

        setStats({
          totalCollected: collected,
          pending,
          fees: collected * 0.029, // Estimate 2.9% fees
          thisMonth,
        });
      }
    } catch (error) {
      console.error('Error loading money data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'succeeded':
        return colors.success;
      case 'sent':
      case 'pending':
        return colors.warning;
      case 'overdue':
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Money</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(provider)/money/create-invoice')}
          >
            <IconSymbol
              ios_icon_name="plus"
              android_material_icon_name="add"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
            onPress={() => setActiveTab('invoices')}
          >
            <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>
              Invoices
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>
              Payments
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            <View style={styles.statsGrid}>
              <GlassView style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={32}
                  color={colors.success}
                />
                <Text style={styles.statValue}>${stats.totalCollected.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Collected</Text>
              </GlassView>

              <GlassView style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="clock.fill"
                  android_material_icon_name="schedule"
                  size={32}
                  color={colors.warning}
                />
                <Text style={styles.statValue}>${stats.pending.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </GlassView>

              <GlassView style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="event"
                  size={32}
                  color={colors.primary}
                />
                <Text style={styles.statValue}>${stats.thisMonth.toFixed(2)}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </GlassView>

              <GlassView style={styles.statCard}>
                <IconSymbol
                  ios_icon_name="chart.bar.fill"
                  android_material_icon_name="bar-chart"
                  size={32}
                  color={colors.accent}
                />
                <Text style={styles.statValue}>${stats.fees.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Fees (Est.)</Text>
              </GlassView>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(provider)/money/create-invoice')}
              >
                <IconSymbol
                  ios_icon_name="doc.text.fill"
                  android_material_icon_name="description"
                  size={28}
                  color={colors.primary}
                />
                <Text style={styles.actionText}>Create Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(provider)/money/payment-link')}
              >
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={28}
                  color={colors.accent}
                />
                <Text style={styles.actionText}>Payment Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(provider)/money/record-payment')}
              >
                <IconSymbol
                  ios_icon_name="dollarsign.circle.fill"
                  android_material_icon_name="attach-money"
                  size={28}
                  color={colors.success}
                />
                <Text style={styles.actionText}>Record Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <View>
            {invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(`/(provider)/money/invoice/${invoice.id}`)}
                >
                  <GlassView style={styles.listItem}>
                    <View style={styles.listItemHeader}>
                      <Text style={styles.listItemTitle}>#{invoice.invoice_number}</Text>
                      <Text style={styles.listItemAmount}>${invoice.total}</Text>
                    </View>
                    <Text style={styles.listItemSubtitle}>
                      Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(invoice.status) + '30' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                        {invoice.status.toUpperCase()}
                      </Text>
                    </View>
                  </GlassView>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                ios_icon="doc.text"
                android_icon="description"
                title="No Invoices Yet"
                message="Create your first invoice to get paid"
                actionLabel="Create Invoice"
                onAction={() => router.push('/(provider)/money/create-invoice')}
              />
            )}
          </View>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <View>
            {payments.length > 0 ? (
              payments.map((payment, index) => (
                <GlassView key={index} style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <Text style={styles.listItemTitle}>${payment.amount}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) + '30' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                        {payment.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.listItemSubtitle}>
                    {payment.payment_method} • {new Date(payment.created_at).toLocaleDateString()}
                  </Text>
                  {payment.notes && (
                    <Text style={styles.listItemNotes}>{payment.notes}</Text>
                  )}
                </GlassView>
              ))
            ) : (
              <EmptyState
                ios_icon="creditcard"
                android_icon="payment"
                title="No Payments Yet"
                message="Payments will appear here once received"
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '31%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.glass,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  listItem: {
    padding: 16,
    marginBottom: 12,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  listItemAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  listItemNotes: {
    fontSize: 13,
    color: colors.text,
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
