
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface Home {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  square_footage?: number;
  year_built?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export default function HomeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [home, setHome] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHome = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setHome(data);
    } catch (error) {
      console.error('Error fetching home:', error);
      Alert.alert('Error', 'Failed to load home details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHome();
  }, [fetchHome]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Home',
      'Are you sure you want to delete this home?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('homes')
                .delete()
                .eq('id', id);

              if (error) throw error;

              Alert.alert('Success', 'Home deleted successfully');
              router.back();
            } catch (error) {
              console.error('Error deleting home:', error);
              Alert.alert('Error', 'Failed to delete home');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!home) {
    return (
      <View style={[commonStyles.container, styles.centered]}>
        <Text style={styles.errorText}>Home not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Home Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <GlassView style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <Text style={styles.address}>{home.address}</Text>
          <Text style={styles.cityState}>
            {home.city}, {home.state} {home.zip_code}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{home.property_type}</Text>
          </View>
          {home.square_footage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Square Footage:</Text>
              <Text style={styles.detailValue}>{home.square_footage.toLocaleString()} sq ft</Text>
            </View>
          )}
          {home.year_built && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Year Built:</Text>
              <Text style={styles.detailValue}>{home.year_built}</Text>
            </View>
          )}
          {home.bedrooms && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bedrooms:</Text>
              <Text style={styles.detailValue}>{home.bedrooms}</Text>
            </View>
          )}
          {home.bathrooms && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bathrooms:</Text>
              <Text style={styles.detailValue}>{home.bathrooms}</Text>
            </View>
          )}
        </View>
      </GlassView>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color={colors.error} />
        <Text style={styles.deleteButtonText}>Delete Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  centered: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    padding: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cityState: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + '40',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
