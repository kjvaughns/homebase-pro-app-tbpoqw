
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
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  const [formData, setFormData] = useState({
    client_id: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    tax: 0,
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('name');

      if (data) setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate total
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].total = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (subtotal * formData.tax / 100);
  };

  const generateInvoiceNumber = () => {
    return `INV-${Date.now().toString().slice(-8)}`;
  };

  const handleSave = async () => {
    if (!formData.client_id) {
      Alert.alert('Missing Information', 'Please select a client');
      return;
    }

    if (lineItems.length === 0 || !lineItems[0].description) {
      Alert.alert('Missing Information', 'Please add at least one line item');
      return;
    }

    try {
      setLoading(true);

      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      const { error } = await supabase.from('invoices').insert({
        organization_id: organization?.id,
        client_id: formData.client_id,
        invoice_number: generateInvoiceNumber(),
        line_items: lineItems,
        subtotal,
        tax: subtotal * formData.tax / 100,
        total,
        status: 'draft',
        due_date: formData.due_date.toISOString().split('T')[0],
        notes: formData.notes,
      });

      if (error) throw error;

      Alert.alert('Success', 'Invoice created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      Alert.alert('Error', error.message || 'Failed to create invoice');
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
          <Text style={styles.title}>Create Invoice</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.form}>
          <Text style={styles.label}>Client *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={[
                  styles.chip,
                  formData.client_id === client.id && styles.chipSelected,
                ]}
                onPress={() => setFormData({ ...formData, client_id: client.id })}
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
            ))}
          </ScrollView>

          <Text style={styles.label}>Due Date *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {formData.due_date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.due_date}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setFormData({ ...formData, due_date: date });
              }}
            />
          )}

          <View style={styles.lineItemsHeader}>
            <Text style={styles.label}>Line Items *</Text>
            <TouchableOpacity onPress={addLineItem} style={styles.addLineItemButton}>
              <IconSymbol
                ios_icon_name="plus.circle.fill"
                android_material_icon_name="add-circle"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {lineItems.map((item, index) => (
            <View key={index} style={styles.lineItem}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemNumber}>Item {index + 1}</Text>
                {lineItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeLineItem(index)}>
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                style={[styles.input, styles.textInput]}
                placeholder="Description"
                placeholderTextColor={colors.textSecondary}
                value={item.description}
                onChangeText={(text) => updateLineItem(index, 'description', text)}
              />
              
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallLabel}>Qty</Text>
                  <TextInput
                    style={[styles.input, styles.textInput]}
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                    value={item.quantity.toString()}
                    onChangeText={(text) => updateLineItem(index, 'quantity', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallLabel}>Price</Text>
                  <TextInput
                    style={[styles.input, styles.textInput]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={item.unit_price.toString()}
                    onChangeText={(text) => updateLineItem(index, 'unit_price', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.smallLabel}>Total</Text>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          <Text style={styles.label}>Tax (%)</Text>
          <TextInput
            style={[styles.input, styles.textInput]}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            value={formData.tax.toString()}
            onChangeText={(text) => setFormData({ ...formData, tax: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textInput, styles.textArea]}
            placeholder="Add any notes..."
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
          />

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>${calculateSubtotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({formData.tax}%):</Text>
              <Text style={styles.summaryValue}>
                ${(calculateSubtotal() * formData.tax / 100).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total:</Text>
              <Text style={styles.summaryTotalValue}>${calculateTotal().toFixed(2)}</Text>
            </View>
          </View>
        </GlassView>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Creating...' : 'Create Invoice'}
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
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
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
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
  },
  textInput: {
    color: colors.text,
    fontSize: 16,
  },
  inputText: {
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  lineItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  addLineItemButton: {
    padding: 4,
  },
  lineItem: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineItemNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  totalBox: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  summary: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
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
