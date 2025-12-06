
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

export default function AddHomeScreen() {
  const { profile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [propertyType, setPropertyType] = useState('Single Family');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
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
          nickname: nickname.trim() || null,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          property_type: propertyType,
          is_primary: false,
        });

      if (error) throw error;

      Alert.alert('Success', 'Home added successfully');
      router.back();
    } catch (error: any) {
      console.error('Error adding home:', error);
      Alert.alert('Error', error.message || 'Failed to add home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Add Home</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nickname (Optional)</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="e.g., Main House, Beach House"
              placeholderTextColor={colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="words"
            />
          </View>

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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Add Home'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
