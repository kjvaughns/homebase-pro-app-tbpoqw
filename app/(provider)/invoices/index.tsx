
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Invoice } from '@/types';

export default function InvoicesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');

  const mockInvoices: Invoice[] = [
    {
      id: '1',
      organization_id: '1',
      client_id: '1',
      invoice_number: 'INV-001',
      line_items: [],
      subtotal: 150,
      tax: 12,
      total: 162,
      status: 'sent',
      due_date: '2024-02-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      organization_id: '1',
      client_id: '2',
      invoice_number: 'INV-002',
      line_items: [],
      subtotal: 200,
      tax: 16,
      total: 216,
      status: 'paid',
      due_date: '2024-02-10',
      paid_date: '2024-02-08',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return colors.textSecondary;
      case 'sent': return colors.warning;
      case 'paid': return colors.success;
      case 'overdue': return colors.error;
      default: return colors.text;
    }
  };

  const statusCounts = {
    draft: mockInvoices.filter(i => i.status === 'draft').length,
    sent: mockInvoices.filter(i => i.status === 'sent').length,
    paid: mockInvoices.filter(i => i.status === 'paid').length,
    overdue: mockInvoices.filter(i => i.status === 'overdue').length,
  };

  const totalRevenue = mockInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const pendingRevenue = mockInvoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Invoices</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(provider)/invoices/create')}
          >
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Financial Overview */}
        <View style={styles.overview}>
          <GlassView style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Total Collected</Text>
            <Text style={styles.overviewValue}>${totalRevenue.toFixed(2)}</Text>
          </GlassView>
          <GlassView style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Pending</Text>
            <Text style={[styles.overviewValue, { color: colors.warning }]}>${pendingRevenue.toFixed(2)}</Text>
          </GlassView>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoices..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
              All ({mockInvoices.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'sent' && styles.filterChipActive]}
            onPress={() => setFilterStatus('sent')}
          >
            <Text style={[styles.filterText, filterStatus === 'sent' && styles.filterTextActive]}>
              Sent ({statusCounts.sent})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'paid' && styles.filterChipActive]}
            onPress={() => setFilterStatus('paid')}
          >
            <Text style={[styles.filterText, filterStatus === 'paid' && styles.filterTextActive]}>
              Paid ({statusCounts.paid})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'overdue' && styles.filterChipActive]}
            onPress={() => setFilterStatus('overdue')}
          >
            <Text style={[styles.filterText, filterStatus === 'overdue' && styles.filterTextActive]}>
              Overdue ({statusCounts.overdue})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Invoice List */}
        <View style={styles.invoiceList}>
          {mockInvoices.map((invoice, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => router.push(`/(provider)/invoices/${invoice.id}`)}
            >
              <GlassView style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View>
                    <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                    <Text style={styles.invoiceClient}>Client Name</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                      {invoice.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.invoiceFooter}>
                  <View>
                    <Text style={styles.invoiceLabel}>Amount</Text>
                    <Text style={styles.invoiceAmount}>${invoice.total.toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text style={styles.invoiceLabel}>Due Date</Text>
                    <Text style={styles.invoiceDate}>{invoice.due_date}</Text>
                  </View>
                </View>
              </GlassView>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/(provider)/payments/quick-link')}
          >
            <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={20} color={colors.text} />
            <Text style={styles.quickActionText}>Quick Payment Link</Text>
          </TouchableOpacity>
        </View>
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
  overview: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    padding: 16,
  },
  overviewLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.glass,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.text,
  },
  invoiceList: {
    gap: 12,
  },
  invoiceCard: {
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  invoiceClient: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  invoiceAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  invoiceDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  quickActions: {
    marginTop: 24,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
