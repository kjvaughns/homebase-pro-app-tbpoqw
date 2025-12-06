
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
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
  created_at: string;
}

export default function HomeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [home, setHome] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHome();
  }, [id]);

  const fetchHome = async () => {
    try {
      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setHome(data);
    } catch (error: any) {
      console.error('Error fetching home:', error);
      Alert.alert('Error', 'Failed to load home details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.title}>Home Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassView style={styles.card}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={48}
              color={colors.primary}
            />
          </View>

          {home.nickname && (
            <Text style={styles.nickname}>{home.nickname}</Text>
          )}

          <Text style={styles.address}>{home.address}</Text>
          <Text style={styles.city}>
            {home.city}, {home.state} {home.zip}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Property Type</Text>
            <Text style={styles.detailValue}>{home.property_type}</Text>
          </View>

          {home.is_primary && (
            <View style={styles.primaryBadge}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.primaryText}>Primary Home</Text>
            </View>
          )}
        </GlassView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service History</Text>
          <GlassView style={styles.emptyCard}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={32}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No service history yet</Text>
          </GlassView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
          <GlassView style={styles.emptyCard}>
            <IconSymbol
              ios_icon_name="wrench.and.screwdriver"
              android_material_icon_name="build"
              size={32}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No maintenance scheduled</Text>
          </GlassView>
        </View>
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  card: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  address: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  city: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
