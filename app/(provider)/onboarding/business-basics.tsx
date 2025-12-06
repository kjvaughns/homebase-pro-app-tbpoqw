
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';

const SERVICE_CATEGORIES = [
  { id: 'handyman', label: 'Handyman', icon: 'hammer' },
  { id: 'lawn-care', label: 'Lawn Care', icon: 'grass' },
  { id: 'hvac', label: 'HVAC', icon: 'thermostat' },
  { id: 'plumbing', label: 'Plumbing', icon: 'plumbing' },
  { id: 'cleaning', label: 'Cleaning', icon: 'cleaning-services' },
  { id: 'electrical', label: 'Electrical', icon: 'bolt' },
  { id: 'contractor', label: 'Contractor', icon: 'construction' },
  { id: 'painting', label: 'Painting', icon: 'format-paint' },
];

export default function BusinessBasics() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [serviceRadius, setServiceRadius] = useState('25');

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleNext = () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }
    if (selectedCategories.length === 0) {
      Alert.alert('Error', 'Please select at least one service category');
      return;
    }

    // Store data in context or async storage
    console.log('Business basics:', { businessName, selectedCategories, serviceRadius });
    router.push('/(provider)/onboarding/business-description');
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: '25%' }]} />
        </View>
      </View>

      <Text style={styles.title}>Let&apos;s set up your business</Text>
      <Text style={styles.subtitle}>Step 1 of 4</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Business Name</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="Enter your business name"
          placeholderTextColor={colors.textSecondary}
          value={businessName}
          onChangeText={setBusinessName}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Service Categories</Text>
        <Text style={styles.hint}>Select all that apply</Text>
        <View style={styles.chipContainer}>
          {SERVICE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.chip,
                selectedCategories.includes(category.id) && styles.chipSelected,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategories.includes(category.id) && styles.chipTextSelected,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Service Radius (miles)</Text>
        <TextInput
          style={commonStyles.input}
          placeholder="25"
          placeholderTextColor={colors.textSecondary}
          value={serviceRadius}
          onChangeText={setServiceRadius}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>Continue</Text>
        <IconSymbol ios_icon_name="arrow.right" android_material_icon_name="arrow-forward" size={20} color={colors.text} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  progress: {
    height: 4,
    backgroundColor: colors.glass,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.glass,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
