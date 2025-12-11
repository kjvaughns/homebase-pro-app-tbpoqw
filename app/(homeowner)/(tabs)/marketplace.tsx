
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ProviderCard } from '@/components/ProviderCard';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { EmptyState } from '@/components/EmptyState';
import { GlassView } from '@/components/GlassView';

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

  // Task 2.1 & 2.3: Wrap in try/catch/finally, memoize with useCallback
  const loadProviders = useCallback(async () => {
    try {
      setError(null);
      console.log('Marketplace: Loading published providers...');
      
      // Task 3.1: Add limit to query
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
        .not('slug', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      // Task 3.3: Handle errors explicitly
      if (fetchError) {
        console.error('Marketplace: Error loading providers:', fetchError);
        throw fetchError;
      }

      console.log('Marketplace: Loaded providers:', data?.length || 0);
      setProviders(data || []);
    } catch (err: any) {
      console.error('Marketplace: Error:', err);
      setError(err.message || 'Failed to load providers. Please try again.');
    } finally {
      // Task 2.1: Always reset loading in finally
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadProviders();
      }
    }, [loadProviders, loading])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProviders();
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

  // Task 2.2: Loading state
  if (loading && !refreshing) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading providers...</Text>
      </View>
    );
  }

  // Task 2.2: Error state with retry
  if (error && !refreshing) {
    return (
      <View style={[commonStyles.container, styles.centerContainer]}>
        <GlassView style={styles.errorContainer}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="error"
            size={64}
            color={colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProviders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </GlassView>
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
        {filteredProviders.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultsText}>
              {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {/* Task 2.2: Empty state */}
        {filteredProviders.length === 0 && !loading && (
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
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
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
});
