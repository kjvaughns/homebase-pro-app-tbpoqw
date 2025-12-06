
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

const PROPERTY_TYPES = [
  'Single Family',
  'Townhouse',
  'Condo',
  'Apartment',
  'Multi-Family',
  'Other',
];

export default function AddHomeOnboarding() {
  const { profile } = useAuth();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [propertyType, setPropertyType] = useState('Single Family');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!address.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('homes')
        .insert({
          homeowner_id: profile?.id,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          property_type: propertyType,
          is_primary: true,
        });

      if (error) throw error;

      router.push('/onboarding/homeowner/completion');
    } catch (error: any) {
      console.error('Error adding home:', error);
      Alert.alert('Error', error.message || 'Failed to add home');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/homeowner/completion');
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '66%' }]} />
        </View>
        <Text style={styles.step}>Step 2 of 3</Text>
      </View>

      <View style={styles.main}>
        <IconSymbol
          ios_icon_name="house.fill"
          android_material_icon_name="home"
          size={80}
          color={colors.primary}
        />
        <Text style={styles.title}>Add your home</Text>
        <Text style={styles.subtitle}>We&apos;ll use this for service bookings</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="123 Main St"
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={setAddress}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="City"
                placeholderTextColor={colors.textSecondary}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="CA"
                placeholderTextColor={colors.textSecondary}
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="12345"
              placeholderTextColor={colors.textSecondary}
              value={zip}
              onChangeText={setZip}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyTypes}>
              {PROPERTY_TYPES.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.propertyTypeChip,
                    propertyType === type && styles.propertyTypeChipActive,
                  ]}
                  onPress={() => setPropertyType(type)}
                >
                  <Text
                    style={[
                      styles.propertyTypeText,
                      propertyType === type && styles.propertyTypeTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
          <IconSymbol
            ios_icon_name="arrow.right"
            android_material_icon_name="arrow-forward"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.glass,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  step: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  propertyTypes: {
    marginTop: 8,
  },
  propertyTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginRight: 8,
  },
  propertyTypeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  propertyTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  propertyTypeTextActive: {
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
