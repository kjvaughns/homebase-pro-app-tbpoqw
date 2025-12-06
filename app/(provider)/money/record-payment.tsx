
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAYMENT_METHODS = ['cash', 'check', 'bank-transfer', 'other'];

export default function RecordPaymentScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'cash',
    notes: '',
  });

  useEffect(() => {
    loadUnpaidInvoices();
  }, []);

  const loadUnpaidInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('organization_id', organization?.id)
        .in('status', ['sent', 'overdue'])
        .order('due_date');

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.invoice_id || !formData.amount) {
      Alert.alert('Missing Information', 'Please select an invoice and enter amount');
      return;
    }

    try {
      setLoading(true);

      const selectedInvoice = invoices.find((inv) => inv.id === formData.invoice_id);
      
      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        organization_id: organization?.id,
        invoice_id: formData.invoice_id,
        client_id: selectedInvoice?.client_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        status: 'succeeded',
        notes: formData.notes,
      });

      if (paymentError) throw paymentError;

      // Update invoice status
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: formData.payment_method,
        })
        .eq('id', formData.invoice_id);

      if (invoiceError) throw invoiceError;

      Alert.alert('Success', 'Payment recorded successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Record Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.form}>
          <Text style={styles.label}>Select Invoice *</Text>
          {invoices.length > 0 ? (
            <ScrollView style={styles.invoiceList}>
              {invoices.map((invoice) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={[
                    styles.invoiceItem,
                    formData.invoice_id === invoice.id && styles.invoiceItemSelected,
                  ]}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      invoice_id: invoice.id,
                      amount: invoice.total.toString(),
                    })
                  }
                >
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                    <Text style={styles.invoiceClient}>{invoice.clients?.name}</Text>
                  </View>
                  <Text style={styles.invoiceAmount}>${invoice.total}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No unpaid invoices</Text>
          )}

          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountInput}>
            <Text style={styles.amountSymbol}>$</Text>
            <TextInput
              style={styles.amountField}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.label}>Payment Method *</Text>
          <View style={styles.methodsContainer}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodChip,
                  formData.payment_method === method && styles.methodChipSelected,
                ]}
                onPress={() => setFormData({ ...formData, payment_method: method })}
              >
                <Text
                  style={[
                    styles.methodText,
                    formData.payment_method === method && styles.methodTextSelected,
                  ]}
                >
                  {method.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any notes..."
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
          />
        </GlassView>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Recording...' : 'Record Payment'}
          </Text>
        </TouchableOpacity>
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
  form: {
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  invoiceList: {
    maxHeight: 200,
    marginBottom: 8,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.glass,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  invoiceItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  invoiceClient: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 32,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  amountSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    padding: 16,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    backgroundColor: colors.glass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  methodChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  methodTextSelected: {
    color: colors.text,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
