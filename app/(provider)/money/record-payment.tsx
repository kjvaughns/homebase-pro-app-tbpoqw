
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RecordPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    client_id: params.client_id as string || '',
    invoice_id: '',
    amount: '',
    payment_method: 'cash',
    payment_date: new Date(),
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [organization?.id]);

  useEffect(() => {
    if (formData.client_id) {
      loadClientInvoices(formData.client_id);
    }
  }, [formData.client_id]);

  const loadData = async () => {
    if (!organization?.id) return;

    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name');

      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadClientInvoices = async (clientId: string) => {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['sent', 'overdue'])
        .order('created_at', { ascending: false });

      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.client_id) {
      Alert.alert('Missing Information', 'Please select a client');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Missing Information', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      const amount = parseFloat(formData.amount);

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          organization_id: organization?.id,
          client_id: formData.client_id,
          invoice_id: formData.invoice_id || null,
          amount,
          payment_method: formData.payment_method,
          status: 'succeeded',
          notes: formData.notes,
          created_at: formData.payment_date.toISOString(),
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // If linked to an invoice, update invoice status
      if (formData.invoice_id) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('total')
          .eq('id', formData.invoice_id)
          .single();

        if (invoice && amount >= Number(invoice.total)) {
          await supabase
            .from('invoices')
            .update({
              status: 'paid',
              paid_date: formData.payment_date.toISOString(),
              payment_method: formData.payment_method,
            })
            .eq('id', formData.invoice_id);
        }
      }

      // Update client LTV
      const { data: client } = await supabase
        .from('clients')
        .select('lifetime_value')
        .eq('id', formData.client_id)
        .single();

      if (client) {
        await supabase
          .from('clients')
          .update({
            lifetime_value: Number(client.lifetime_value || 0) + amount,
          })
          .eq('id', formData.client_id);
      }

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

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: 'banknote' },
    { value: 'check', label: 'Check', icon: 'doc.text' },
    { value: 'card', label: 'Card', icon: 'creditcard' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'building.columns' },
    { value: 'other', label: 'Other', icon: 'ellipsis.circle' },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.label}>Client *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {clients.map((client) => (
              <React.Fragment key={client.id}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    formData.client_id === client.id && styles.chipSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, client_id: client.id, invoice_id: '' })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.client_id === client.id && styles.chipTextSelected,
                    ]}
                  >
                    {client.name}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </ScrollView>

          {formData.client_id && invoices.length > 0 && (
            <React.Fragment>
              <Text style={styles.label}>Link to Invoice (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    !formData.invoice_id && styles.chipSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, invoice_id: '' })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      !formData.invoice_id && styles.chipTextSelected,
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>
                {invoices.map((invoice) => (
                  <React.Fragment key={invoice.id}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        formData.invoice_id === invoice.id && styles.chipSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, invoice_id: invoice.id, amount: invoice.total.toString() })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          formData.invoice_id === invoice.id && styles.chipTextSelected,
                        ]}
                      >
                        #{invoice.invoice_number} - ${Number(invoice.total).toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </ScrollView>
            </React.Fragment>
          )}

          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            value={formData.amount}
            onChangeText={(text) => setFormData({ ...formData, amount: text })}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Payment Method *</Text>
          <View style={styles.methodsGrid}>
            {paymentMethods.map((method) => (
              <React.Fragment key={method.value}>
                <TouchableOpacity
                  style={[
                    styles.methodChip,
                    formData.payment_method === method.value && styles.methodChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, payment_method: method.value })}
                >
                  <IconSymbol
                    ios_icon_name={method.icon}
                    android_material_icon_name={method.icon.replace('.', '-')}
                    size={20}
                    color={formData.payment_method === method.value ? colors.text : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodChipText,
                      formData.payment_method === method.value && styles.methodChipTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.label}>Payment Date *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {formData.payment_date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.payment_date}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setFormData({ ...formData, payment_date: date });
              }}
            />
          )}

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
    paddingBottom: 120,
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
    marginBottom: 12,
    marginTop: 16,
  },
  chipScroll: {
    marginBottom: 8,
  },
  chip: {
    backgroundColor: colors.glass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
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
  inputText: {
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  methodChipTextActive: {
    color: colors.text,
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
