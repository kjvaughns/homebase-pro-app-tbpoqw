
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { Client, LineItem } from '@/types';

export default function CreateQuote() {
  const router = useRouter();
  const { organization } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    if (!organization) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organization.id)
      .order('name');

    if (error) {
      console.error('Error loading clients:', error);
      return;
    }

    setClients(data || []);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + tax;
  };

  const handleSave = async () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    if (lineItems.some(item => !item.description || item.unit_price <= 0)) {
      Alert.alert('Error', 'Please fill in all line items');
      return;
    }

    setLoading(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

      const { error } = await supabase.from('quotes').insert({
        organization_id: organization?.id,
        client_id: selectedClient,
        quote_number: `Q-${Date.now()}`,
        line_items: lineItems,
        subtotal: calculateSubtotal(),
        tax,
        total: calculateTotal(),
        status: 'draft',
        expiry_date: expiryDate.toISOString().split('T')[0],
        notes,
      });

      if (error) throw error;

      Alert.alert('Success', 'Quote created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating quote:', error);
      Alert.alert('Error', 'Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Quote</Text>
      </View>

      {/* Client Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Client</Text>
        <GlassView style={styles.picker}>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={styles.select}
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </GlassView>
      </View>

      {/* Line Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.label}>Line Items</Text>
          <TouchableOpacity onPress={addLineItem}>
            <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {lineItems.map((item, index) => (
          <GlassView key={item.id} style={styles.lineItem}>
            <View style={styles.lineItemHeader}>
              <Text style={styles.lineItemNumber}>Item {index + 1}</Text>
              {lineItems.length > 1 && (
                <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                  <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={item.description}
              onChangeText={(text) => updateLineItem(item.id, 'description', text)}
            />
            <View style={styles.lineItemRow}>
              <View style={styles.lineItemField}>
                <Text style={styles.fieldLabel}>Qty</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  value={item.quantity.toString()}
                  onChangeText={(text) => updateLineItem(item.id, 'quantity', parseFloat(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.lineItemField}>
                <Text style={styles.fieldLabel}>Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  value={item.unit_price.toString()}
                  onChangeText={(text) => updateLineItem(item.id, 'unit_price', parseFloat(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.lineItemField}>
                <Text style={styles.fieldLabel}>Total</Text>
                <Text style={styles.totalText}>${item.total.toFixed(2)}</Text>
              </View>
            </View>
          </GlassView>
        ))}
      </View>

      {/* Totals */}
      <GlassView style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>${calculateSubtotal().toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax</Text>
          <TextInput
            style={[styles.input, styles.taxInput]}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            value={tax.toString()}
            onChangeText={(text) => setTax(parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${calculateTotal().toFixed(2)}</Text>
        </View>
      </GlassView>

      {/* Additional Details */}
      <View style={styles.section}>
        <Text style={styles.label}>Expiry (days)</Text>
        <TextInput
          style={styles.input}
          placeholder="30"
          placeholderTextColor={colors.textSecondary}
          value={expiryDays}
          onChangeText={setExpiryDays}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add any additional notes..."
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? 'Creating...' : 'Create Quote'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    marginBottom: 32,
    gap: 16,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  picker: {
    padding: 0,
    overflow: 'hidden',
  },
  select: {
    width: '100%',
    padding: 16,
    backgroundColor: 'transparent',
    color: colors.text,
    border: 'none',
    fontSize: 16,
  },
  lineItem: {
    padding: 16,
    marginBottom: 12,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineItemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  lineItemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  lineItemField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    padding: 12,
  },
  totalsCard: {
    padding: 20,
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  taxInput: {
    width: 120,
    marginBottom: 0,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: 12,
    marginTop: 12,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  actions: {
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
