
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface Home {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
}

export default function HomesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHomes = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('homeowner_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHomes(data || []);
    } catch (error) {
      console.error('Error fetching homes:', error);
      Alert.alert('Error', 'Failed to load homes');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchHomes();
  }, [fetchHomes]);

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Homes</Text>
        <TouchableOpacity onPress={() => router.push('/(homeowner)/homes/add')} style={styles.addButton}>
          <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {homes.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Homes Yet</Text>
          <Text style={styles.emptyDescription}>Add your first home to get started</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(homeowner)/homes/add')}>
            <Text style={styles.emptyButtonText}>Add Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {homes.map((home, index) => (
            <TouchableOpacity key={index} onPress={() => router.push(`/(homeowner)/homes/${home.id}`)}>
              <GlassView style={styles.homeCard}>
                <View style={styles.homeIcon}>
                  <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={24} color={colors.primary} />
                </View>
                <View style={styles.homeInfo}>
                  <Text style={styles.homeAddress}>{home.address}</Text>
                  <Text style={styles.homeCity}>
                    {home.city}, {home.state} {home.zip_code}
                  </Text>
                  <Text style={styles.homeType}>{home.property_type}</Text>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
              </GlassView>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  list: {
    gap: 12,
  },
  homeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  homeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeInfo: {
    flex: 1,
  },
  homeAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  homeCity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  homeType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
});
