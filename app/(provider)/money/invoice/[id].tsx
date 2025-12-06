
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Invoice } from '@/types';

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name, email, phone, address)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;

    try {
      await Share.share({
        message: `Invoice #${invoice.invoice_number}\nTotal: $${invoice.total}\nDue: ${invoice.due_date}`,
        title: `Invoice #${invoice.invoice_number}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  const handleSendEmail = () => {
    Alert.alert(
      'Send Invoice',
      'Email invoice to client?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              // Update status to sent
              await supabase
                .from('invoices')
                .update({ status: 'sent' })
                .eq('id', id);

              Alert.alert('Success', 'Invoice sent to client');
              loadInvoice();
            } catch (error) {
              console.error('Error sending invoice:', error);
              Alert.alert('Error', 'Failed to send invoice');
            }
          },
        },
      ]
    );
  };

  const handleMarkPaid = () => {
    Alert.alert(
      'Mark as Paid',
      'Mark this invoice as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await supabase
                .from('invoices')
                .update({
                  status: 'paid',
                  paid_date: new Date().toISOString(),
                })
                .eq('id', id);

              Alert.alert('Success', 'Invoice marked as paid');
              loadInvoice();
            } catch (error) {
              console.error('Error updating invoice:', error);
              Alert.alert('Error', 'Failed to update invoice');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.success;
      case 'sent':
        return colors.warning;
      case 'overdue':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (loading || !invoice) {
    return (
      <View style={[commonStyles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

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
          <Text style={styles.title}>Invoice</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <IconSymbol
              ios_icon_name="square.and.arrow.up"
              android_material_icon_name="share"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Invoice Header */}
        <GlassView style={styles.invoiceHeader}>
          <View style={styles.invoiceNumberRow}>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
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
          </View>
          <Text style={styles.invoiceDate}>
            Created: {new Date(invoice.created_at).toLocaleDateString()}
          </Text>
          {invoice.due_date && (
            <Text style={styles.invoiceDue}>
              Due: {new Date(invoice.due_date).toLocaleDateString()}
            </Text>
          )}
        </GlassView>

        {/* Client Info */}
        <GlassView style={styles.clientCard}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.clientName}>{invoice.clients?.name}</Text>
          {invoice.clients?.email && (
            <Text style={styles.clientDetail}>{invoice.clients.email}</Text>
          )}
          {invoice.clients?.phone && (
            <Text style={styles.clientDetail}>{invoice.clients.phone}</Text>
          )}
          {invoice.clients?.address && (
            <Text style={styles.clientDetail}>{invoice.clients.address}</Text>
          )}
        </GlassView>

        {/* Line Items */}
        <GlassView style={styles.lineItemsCard}>
          <Text style={styles.sectionTitle}>Items</Text>
          {invoice.line_items && Array.isArray(invoice.line_items) && invoice.line_items.length > 0 ? (
            invoice.line_items.map((item: any, index: number) => (
              <View key={index} style={styles.lineItem}>
                <View style={styles.lineItemInfo}>
                  <Text style={styles.lineItemName}>{item.description}</Text>
                  {item.quantity && (
                    <Text style={styles.lineItemQuantity}>Qty: {item.quantity}</Text>
                  )}
                </View>
                <Text style={styles.lineItemAmount}>${item.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No line items</Text>
          )}

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${invoice.subtotal}</Text>
            </View>
            {invoice.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>${invoice.tax}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${invoice.total}</Text>
            </View>
          </View>
        </GlassView>

        {/* Notes */}
        {invoice.notes && (
          <GlassView style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </GlassView>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {invoice.status === 'draft' && (
            <TouchableOpacity style={styles.actionButton} onPress={handleSendEmail}>
              <IconSymbol
                ios_icon_name="paperplane.fill"
                android_material_icon_name="send"
                size={20}
                color={colors.text}
              />
              <Text style={styles.actionButtonText}>Send to Client</Text>
            </TouchableOpacity>
          )}
          {invoice.status !== 'paid' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={handleMarkPaid}
            >
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.text}
              />
              <Text style={styles.actionButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceHeader: {
    padding: 20,
    marginBottom: 16,
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  invoiceDue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clientCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  clientDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  lineItemsCard: {
    padding: 20,
    marginBottom: 16,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  lineItemQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  lineItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  totalsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.glassBorder,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  notesCard: {
    padding: 20,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
