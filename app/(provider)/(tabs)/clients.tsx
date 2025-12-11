
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Client } from '@/types';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientsScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lead' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadClients = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  }, [loadClients]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Fix 1.4: Reload clients when screen comes into focus (after adding a client)
  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return colors.warning;
      case 'active': return colors.success;
      case 'inactive': return colors.textSecondary;
      default: return colors.text;
    }
  };

  const statusCounts = {
    all: clients.length,
    lead: clients.filter(c => c.status === 'lead').length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Clients</Text>
        </View>

        {/* Search Bar */}
        <GlassView style={styles.searchContainer}>
          <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </GlassView>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
              All ({statusCounts.all})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'lead' && styles.filterChipActive]}
            onPress={() => setFilterStatus('lead')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.filterChipText, filterStatus === 'lead' && styles.filterChipTextActive]}>
              Leads ({statusCounts.lead})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
            onPress={() => setFilterStatus('active')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.filterChipText, filterStatus === 'active' && styles.filterChipTextActive]}>
              Active ({statusCounts.active})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, filterStatus === 'inactive' && styles.filterChipActive]}
            onPress={() => setFilterStatus('inactive')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.textSecondary }]} />
            <Text style={[styles.filterChipText, filterStatus === 'inactive' && styles.filterChipTextActive]}>
              Inactive ({statusCounts.inactive})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Client List */}
        <View style={styles.clientList}>
          {filteredClients.map((client, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity 
                onPress={() => router.push(`/(provider)/clients/${client.id}`)}
              >
                <GlassView style={styles.clientCard}>
                  <View style={styles.clientHeader}>
                    <View style={[styles.clientAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.clientAvatarText}>{getInitials(client.name)}</Text>
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.name}</Text>
                      {client.email && <Text style={styles.clientEmail}>{client.email}</Text>}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(client.status) }]}>
                        {client.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.clientFooter}>
                    {client.phone && (
                      <View style={styles.clientStat}>
                        <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={14} color={colors.textSecondary} />
                        <Text style={styles.clientStatText}>{client.phone}</Text>
                      </View>
                    )}
                    <View style={styles.clientStat}>
                      <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach-money" size={14} color={colors.textSecondary} />
                      <Text style={styles.clientStatText}>${client.lifetime_value?.toFixed(0) || 0}</Text>
                    </View>
                  </View>
                  {client.tags && client.tags.length > 0 && (
                    <View style={styles.tagContainer}>
                      {client.tags.slice(0, 3).map((tag, tagIndex) => (
                        <React.Fragment key={tagIndex}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        </React.Fragment>
                      ))}
                      {client.tags.length > 3 && (
                        <Text style={styles.tagMore}>+{client.tags.length - 3}</Text>
                      )}
                    </View>
                  )}
                </GlassView>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {filteredClients.length === 0 && !loading && (
          <GlassView style={styles.emptyState}>
            <IconSymbol ios_icon_name="person.2" android_material_icon_name="people" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push('/(provider)/clients/add')}
              >
                <Text style={styles.emptyButtonText}>Add Your First Client</Text>
              </TouchableOpacity>
            )}
          </GlassView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clientList: {
    gap: 12,
  },
  clientCard: {
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clientFooter: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  clientStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientStatText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.glass,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  tagMore: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});
