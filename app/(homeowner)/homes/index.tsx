
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { GlassView } from '@/components/GlassView';

interface Home {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  nickname?: string;
  is_primary: boolean;
}

export default function HomesScreen() {
  const { profile } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    try {
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('homeowner_id', profile?.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setHomes(data || []);
    } catch (error: any) {
      console.error('Error fetching homes:', error);
      Alert.alert('Error', 'Failed to load homes');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (homeId: string) => {
    try {
      // First, unset all primary homes
      await supabase
        .from('homes')
        .update({ is_primary: false })
        .eq('homeowner_id', profile?.id);

      // Then set the selected home as primary
      const { error } = await supabase
        .from('homes')
        .update({ is_primary: true })
        .eq('id', homeId);

      if (error) throw error;

      fetchHomes();
      Alert.alert('Success', 'Primary home updated');
    } catch (error: any) {
      console.error('Error setting primary home:', error);
      Alert.alert('Error', 'Failed to update primary home');
    }
  };

  const handleDeleteHome = (homeId: string) => {
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
                .eq('id', homeId);

              if (error) throw error;

              fetchHomes();
              Alert.alert('Success', 'Home deleted');
            } catch (error: any) {
              console.error('Error deleting home:', error);
              Alert.alert('Error', 'Failed to delete home');
            }
          },
        },
      ]
    );
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
        <Text style={styles.title}>My Homes</Text>
        <TouchableOpacity onPress={() => router.push('/homeowner/homes/add')}>
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : homes.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="house"
              android_material_icon_name="home"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No homes added yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/homeowner/homes/add')}
            >
              <Text style={styles.addButtonText}>Add Your First Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          homes.map((home, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/homeowner/homes/${home.id}`)}
            >
              <GlassView style={styles.homeCard}>
                <View style={styles.homeHeader}>
                  <View style={styles.homeIcon}>
                    <IconSymbol
                      ios_icon_name="house.fill"
                      android_material_icon_name="home"
                      size={24}
                      color={home.is_primary ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.homeInfo}>
                    {home.nickname && (
                      <Text style={styles.homeNickname}>{home.nickname}</Text>
                    )}
                    <Text style={styles.homeAddress}>{home.address}</Text>
                    <Text style={styles.homeCity}>
                      {home.city}, {home.state} {home.zip}
                    </Text>
                    <Text style={styles.homeType}>{home.property_type}</Text>
                  </View>
                  {home.is_primary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryText}>PRIMARY</Text>
                    </View>
                  )}
                </View>

                <View style={styles.homeActions}>
                  {!home.is_primary && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetPrimary(home.id)}
                    >
                      <IconSymbol
                        ios_icon_name="star"
                        android_material_icon_name="star-border"
                        size={18}
                        color={colors.accent}
                      />
                      <Text style={styles.actionText}>Set as Primary</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteHome(home.id)}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={18}
                      color={colors.error}
                    />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </GlassView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  homeCard: {
    padding: 16,
    marginBottom: 12,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  homeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  homeInfo: {
    flex: 1,
  },
  homeNickname: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  homeAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  homeCity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  homeType: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  primaryBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  homeActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
});
