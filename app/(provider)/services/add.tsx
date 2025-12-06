
import React, { useState } from 'react';
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

const CATEGORIES = [
  'handyman',
  'lawn-care',
  'hvac',
  'plumbing',
  'cleaning',
  'electrical',
  'contractor',
  'painting',
  'other',
];

const PRICING_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'quote', label: 'Custom Quote' },
];

export default function AddServiceScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'handyman',
    pricing_type: 'fixed',
    price_min: '',
    price_max: '',
    duration: '',
  });

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    if (formData.pricing_type !== 'quote' && !formData.price_min) {
      Alert.alert('Missing Information', 'Please enter a price');
      return;
    }

    try {
      setLoading(true);

      const serviceData: any = {
        organization_id: organization?.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        pricing_type: formData.pricing_type,
        duration: formData.duration ? parseInt(formData.duration) : null,
        is_active: true,
      };

      if (formData.pricing_type === 'fixed') {
        serviceData.price_min = parseFloat(formData.price_min);
      } else if (formData.pricing_type === 'range') {
        serviceData.price_min = parseFloat(formData.price_min);
        serviceData.price_max = parseFloat(formData.price_max);
      }

      const { error } = await supabase.from('services').insert(serviceData);

      if (error) throw error;

      Alert.alert('Success', 'Service created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating service:', error);
      Alert.alert('Error', error.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = () => {
    Alert.alert(
      'AI Service Generator',
      'This feature will use AI to generate service descriptions and suggest pricing based on market rates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: () => {
            // Mock AI generation
            setFormData({
              ...formData,
              description: `Professional ${formData.name.toLowerCase()} service with attention to detail and customer satisfaction guaranteed.`,
            });
            Alert.alert('Success', 'AI-generated description added!');
          },
        },
      ]
    );
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
          <Text style={styles.title}>Add Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.form}>
          <Text style={styles.label}>Service Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., General Repairs"
            placeholderTextColor={colors.textSecondary}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.chip,
                  formData.category === category && styles.chipSelected,
                ]}
                onPress={() => setFormData({ ...formData, category })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.category === category && styles.chipTextSelected,
                  ]}
                >
                  {category.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.aiSection}>
            <Text style={styles.label}>Description</Text>
            <TouchableOpacity style={styles.aiButton} onPress={generateWithAI}>
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="auto-awesome"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.aiButtonText}>Generate with AI</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your service..."
            placeholderTextColor={colors.textSecondary}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Pricing Type *</Text>
          <View style={styles.pricingTypes}>
            {PRICING_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.pricingType,
                  formData.pricing_type === type.value && styles.pricingTypeSelected,
                ]}
                onPress={() => setFormData({ ...formData, pricing_type: type.value })}
              >
                <Text
                  style={[
                    styles.pricingTypeText,
                    formData.pricing_type === type.value && styles.pricingTypeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {formData.pricing_type === 'fixed' && (
            <React.Fragment>
              <Text style={styles.label}>Price *</Text>
              <View style={styles.priceInput}>
                <Text style={styles.priceSymbol}>$</Text>
                <TextInput
                  style={styles.priceField}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.price_min}
                  onChangeText={(text) => setFormData({ ...formData, price_min: text })}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.hint}>Market rate: $50-$150/hour</Text>
            </React.Fragment>
          )}

          {formData.pricing_type === 'range' && (
            <React.Fragment>
              <Text style={styles.label}>Price Range *</Text>
              <View style={styles.row}>
                <View style={[styles.priceInput, { flex: 1 }]}>
                  <Text style={styles.priceSymbol}>$</Text>
                  <TextInput
                    style={styles.priceField}
                    placeholder="Min"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.price_min}
                    onChangeText={(text) => setFormData({ ...formData, price_min: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.rangeSeparator}>-</Text>
                <View style={[styles.priceInput, { flex: 1 }]}>
                  <Text style={styles.priceSymbol}>$</Text>
                  <TextInput
                    style={styles.priceField}
                    placeholder="Max"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.price_max}
                    onChangeText={(text) => setFormData({ ...formData, price_max: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <Text style={styles.hint}>Market rate: $50-$150/hour</Text>
            </React.Fragment>
          )}

          {formData.pricing_type === 'quote' && (
            <Text style={styles.hint}>
              Clients will request a custom quote for this service
            </Text>
          )}

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 60"
            placeholderTextColor={colors.textSecondary}
            value={formData.duration}
            onChangeText={(text) => setFormData({ ...formData, duration: text })}
            keyboardType="number-pad"
          />
        </GlassView>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Creating...' : 'Create Service'}
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
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: colors.text,
  },
  aiSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  pricingTypes: {
    flexDirection: 'row',
    gap: 8,
  },
  pricingType: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  pricingTypeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pricingTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pricingTypeTextSelected: {
    color: colors.text,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  priceSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  priceField: {
    flex: 1,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeSeparator: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
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
