
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ProviderCard } from '@/components/ProviderCard';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { EmptyState } from '@/components/EmptyState';

interface MarketplaceProvider {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo_url: string;
  service_radius_miles: number;
  address: {
    city?: string;
    state?: string;
  };
  organization_id: string;
}

export default function Marketplace() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [providers, setProviders] = useState<MarketplaceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'All',
    'Handyman',
    'Lawn Care',
    'HVAC',
    'Plumbing',
    'Cleaning',
    'Electrical',
  ];

  const loadProviders = useCallback(async () => {
    try {
      setError(null);
      console.log('Marketplace: Loading published providers...');
      
      const { data, error: fetchError } = await supabase
        .from('org_marketplace_profiles')
        .select(`
          id,
          slug,
          name,
          description,
          logo_url,
          service_radius_miles,
          address,
          organization_id,
          organizations!inner(id, business_name)
        `)
        .eq('is_published', true)
        .not('slug', 'is', null);

      if (fetchError) {
        console.error('Marketplace: Error loading providers:', fetchError);
        throw fetchError;
      }

      console.log('Marketplace: Loaded providers:', data?.length || 0);
      setProviders(data || []);
    } catch (err: any) {
      console.error('Marketplace: Error:', err);
      setError('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProviders();
  }, [loadProviders]);

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = !searchQuery || 
      provider.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handleProviderPress = (provider: MarketplaceProvider) => {
    if (provider.slug) {
      console.log('Marketplace: Navigating to provider:', provider.slug);
      router.push(`/p/${provider.slug}`);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
          Loading providers...
        </Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Services</Text>
        <View style={styles.searchContainer}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categories}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category === 'All' ? null : category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProviders}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && filteredProviders.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultsText}>
              {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {!error && filteredProviders.length === 0 && !loading && (
          <EmptyState
            icon="storefront"
            title="No Providers Found"
            message="There are no published providers in the marketplace yet. Check back soon!"
          />
        )}

        {filteredProviders.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={{
              id: provider.id,
              userId: provider.organization_id,
              businessName: provider.name || 'Unnamed Business',
              description: provider.description || '',
              services: [],
              rating: 0,
              reviewCount: 0,
              location: provider.address?.city && provider.address?.state 
                ? `${provider.address.city}, ${provider.address.state}`
                : 'Location not specified',
              verified: true,
              slug: provider.slug,
            }}
            onPress={() => handleProviderPress(provider)}
          />
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categories: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.text,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  results: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
