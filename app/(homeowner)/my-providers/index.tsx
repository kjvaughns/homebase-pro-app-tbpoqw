
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { GlassView } from '@/components/GlassView';

interface Provider {
  id: string;
  business_name: string;
  description: string;
  slug: string;
  logo_url?: string;
  service_categories: string[];
  is_favorite: boolean;
}

export default function MyProvidersScreen() {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'used' | 'favorites'>('used');

  useEffect(() => {
    fetchProviders();
  }, [activeTab]);

  const fetchProviders = async () => {
    try {
      setLoading(true);

      if (activeTab === 'favorites') {
        // Fetch favorite providers
        const { data, error } = await supabase
          .from('favorite_providers')
          .select(`
            organization_id,
            organizations (
              id,
              business_name,
              description,
              slug,
              logo_url,
              service_categories
            )
          `)
          .eq('homeowner_id', profile?.id);

        if (error) throw error;

        const formattedData = data?.map((item: any) => ({
          ...item.organizations,
          is_favorite: true,
        })) || [];

        setProviders(formattedData);
      } else {
        // Fetch providers from bookings
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            organization_id,
            organizations (
              id,
              business_name,
              description,
              slug,
              logo_url,
              service_categories
            )
          `)
          .eq('homeowner_id', profile?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Remove duplicates and check favorites
        const uniqueProviders = Array.from(
          new Map(data?.map((item: any) => [item.organizations.id, item.organizations])).values()
        );

        // Check which ones are favorites
        const { data: favorites } = await supabase
          .from('favorite_providers')
          .select('organization_id')
          .eq('homeowner_id', profile?.id);

        const favoriteIds = new Set(favorites?.map(f => f.organization_id) || []);

        const formattedData = uniqueProviders.map((org: any) => ({
          ...org,
          is_favorite: favoriteIds.has(org.id),
        }));

        setProviders(formattedData);
      }
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      Alert.alert('Error', 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (providerId: string, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_providers')
          .delete()
          .eq('homeowner_id', profile?.id)
          .eq('organization_id', providerId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_providers')
          .insert({
            homeowner_id: profile?.id,
            organization_id: providerId,
          });

        if (error) throw error;
      }

      fetchProviders();
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
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
        <Text style={styles.title}>My Providers</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'used' && styles.tabActive]}
          onPress={() => setActiveTab('used')}
        >
          <Text style={[styles.tabText, activeTab === 'used' && styles.tabTextActive]}>
            Used
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : providers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name={activeTab === 'favorites' ? 'star' : 'person.2'}
              android_material_icon_name={activeTab === 'favorites' ? 'star-border' : 'people'}
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'favorites'
                ? 'No favorite providers yet'
                : 'No providers used yet'}
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
            >
              <Text style={styles.browseButtonText}>Browse Providers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          providers.map((provider, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/p/${provider.slug}`)}
            >
              <GlassView style={styles.providerCard}>
                <View style={styles.providerHeader}>
                  <View style={styles.providerAvatar}>
                    <IconSymbol
                      ios_icon_name="briefcase.fill"
                      android_material_icon_name="work"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{provider.business_name}</Text>
                    <Text style={styles.providerDescription} numberOfLines={2}>
                      {provider.description}
                    </Text>
                    <View style={styles.categories}>
                      {provider.service_categories.slice(0, 2).map((category, idx) => (
                        <View key={idx} style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{category}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(provider.id, provider.is_favorite)}
                  >
                    <IconSymbol
                      ios_icon_name={provider.is_favorite ? 'heart.fill' : 'heart'}
                      android_material_icon_name={provider.is_favorite ? 'favorite' : 'favorite-border'}
                      size={24}
                      color={provider.is_favorite ? colors.error : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => router.push(`/book/${provider.slug}`)}
                >
                  <Text style={styles.bookButtonText}>Book Again</Text>
                  <IconSymbol
                    ios_icon_name="arrow.right"
                    android_material_icon_name="arrow-forward"
                    size={16}
                    color={colors.text}
                  />
                </TouchableOpacity>
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
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
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  providerCard: {
    padding: 16,
    marginBottom: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  categories: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
