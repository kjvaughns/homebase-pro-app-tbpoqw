
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { useToast } from '@/contexts/ToastContext';

interface PricingRule {
  id: string;
  name: string;
  rule_type: string;
  value_json: any;
  is_active: boolean;
}

export default function PricingScreen() {
  const { organization } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [laborRate, setLaborRate] = useState('');
  const [discountPresets, setDiscountPresets] = useState<Array<{ name: string; percent: string }>>([
    { name: 'Senior Discount', percent: '10' },
    { name: 'Repeat Customer', percent: '5' },
  ]);

  useEffect(() => {
    loadPricingRules();
  }, [organization]);

  const loadPricingRules = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      if (error) throw error;

      // Parse existing rules
      data?.forEach((rule: PricingRule) => {
        if (rule.rule_type === 'labor_rate') {
          setLaborRate(rule.value_json.rate_per_hour?.toString() || '');
        } else if (rule.rule_type === 'discount') {
          // Load discount presets
          const existingDiscounts = data
            .filter((r: PricingRule) => r.rule_type === 'discount')
            .map((r: PricingRule) => ({
              name: r.name,
              percent: r.value_json.percent?.toString() || '0',
            }));
          if (existingDiscounts.length > 0) {
            setDiscountPresets(existingDiscounts);
          }
        }
      });
    } catch (error) {
      console.error('Error loading pricing rules:', error);
      showToast('Failed to load pricing rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;

    try {
      setSaving(true);

      // Delete existing rules
      await supabase
        .from('pricing_rules')
        .delete()
        .eq('organization_id', organization.id);

      // Insert labor rate
      if (laborRate && parseFloat(laborRate) > 0) {
        await supabase.from('pricing_rules').insert({
          organization_id: organization.id,
          name: 'Default Labor Rate',
          rule_type: 'labor_rate',
          value_json: { rate_per_hour: parseFloat(laborRate) },
          is_active: true,
        });
      }

      // Insert discount presets
      for (const discount of discountPresets) {
        if (discount.name && discount.percent && parseFloat(discount.percent) > 0) {
          await supabase.from('pricing_rules').insert({
            organization_id: organization.id,
            name: discount.name,
            rule_type: 'discount',
            value_json: { percent: parseFloat(discount.percent) },
            is_active: true,
          });
        }
      }

      showToast('Pricing rules saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving pricing rules:', error);
      showToast('Failed to save pricing rules', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addDiscountPreset = () => {
    setDiscountPresets([...discountPresets, { name: '', percent: '' }]);
  };

  const removeDiscountPreset = (index: number) => {
    setDiscountPresets(discountPresets.filter((_, i) => i !== index));
  };

  const updateDiscountPreset = (index: number, field: 'name' | 'percent', value: string) => {
    const updated = [...discountPresets];
    updated[index][field] = value;
    setDiscountPresets(updated);
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading pricing rules...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.title}>Pricing & Discounts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Labor Rate Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Labor Rate</Text>
        <GlassView style={styles.inputCard}>
          <Text style={styles.inputLabel}>Hourly Rate ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={laborRate}
            onChangeText={setLaborRate}
          />
          <Text style={styles.inputHint}>
            This rate will be used as the default for new services
          </Text>
        </GlassView>
      </View>

      {/* Discount Presets Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discount Presets</Text>
          <TouchableOpacity onPress={addDiscountPreset} style={styles.addButton}>
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {discountPresets.map((discount, index) => (
          <GlassView key={index} style={styles.discountCard}>
            <View style={styles.discountInputs}>
              <View style={styles.discountNameInput}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Senior Discount"
                  placeholderTextColor={colors.textSecondary}
                  value={discount.name}
                  onChangeText={(value) => updateDiscountPreset(index, 'name', value)}
                />
              </View>
              <View style={styles.discountPercentInput}>
                <Text style={styles.inputLabel}>Percent (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={discount.percent}
                  onChangeText={(value) => updateDiscountPreset(index, 'percent', value)}
                />
              </View>
            </View>
            <TouchableOpacity
              onPress={() => removeDiscountPreset(index)}
              style={styles.removeButton}
            >
              <IconSymbol
                ios_icon_name="trash"
                android_material_icon_name="delete"
                size={20}
                color={colors.error}
              />
            </TouchableOpacity>
          </GlassView>
        ))}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.saveButtonText}>Save Pricing Rules</Text>
        )}
      </TouchableOpacity>
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    padding: 4,
  },
  inputCard: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  discountCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  discountInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  discountNameInput: {
    flex: 2,
  },
  discountPercentInput: {
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
