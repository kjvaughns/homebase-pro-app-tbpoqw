
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { Client } from '@/types';

export default function ClientsScreen() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'lead' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    // Load clients from Supabase
    // Placeholder data
    const mockClients: Client[] = [
      {
        id: '1',
        organization_id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St',
        status: 'active',
        lifetime_value: 2500,
        tags: ['residential', 'recurring'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        organization_id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '(555) 234-5678',
        address: '456 Oak Ave',
        status: 'lead',
        lifetime_value: 0,
        tags: ['commercial'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    setClients(mockClients);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchQuery.toLowerCase());
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
    lead: clients.filter(c => c.status === 'lead').length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Clients</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(provider)/clients/add')}
          >
            <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Pipeline */}
        <View style={styles.pipeline}>
          <TouchableOpacity 
            style={[styles.pipelineCard, filterStatus === 'all' && styles.pipelineCardActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={styles.pipelineCount}>{clients.length}</Text>
            <Text style={styles.pipelineLabel}>All Clients</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pipelineCard, filterStatus === 'lead' && styles.pipelineCardActive]}
            onPress={() => setFilterStatus('lead')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.pipelineCount}>{statusCounts.lead}</Text>
            <Text style={styles.pipelineLabel}>Leads</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pipelineCard, filterStatus === 'active' && styles.pipelineCardActive]}
            onPress={() => setFilterStatus('active')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.pipelineCount}>{statusCounts.active}</Text>
            <Text style={styles.pipelineLabel}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pipelineCard, filterStatus === 'inactive' && styles.pipelineCardActive]}
            onPress={() => setFilterStatus('inactive')}
          >
            <View style={[styles.statusDot, { backgroundColor: colors.textSecondary }]} />
            <Text style={styles.pipelineCount}>{statusCounts.inactive}</Text>
            <Text style={styles.pipelineLabel}>Inactive</Text>
          </TouchableOpacity>
        </View>

        {/* Client List */}
        <View style={styles.clientList}>
          {filteredClients.map((client, index) => (
            <TouchableOpacity 
              key={index}
              onPress={() => router.push(`/(provider)/clients/${client.id}`)}
            >
              <GlassView style={styles.clientCard}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{client.name[0]}</Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <Text style={styles.clientEmail}>{client.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(client.status) }]}>
                      {client.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.clientFooter}>
                  <View style={styles.clientStat}>
                    <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={14} color={colors.textSecondary} />
                    <Text style={styles.clientStatText}>{client.phone}</Text>
                  </View>
                  <View style={styles.clientStat}>
                    <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach-money" size={14} color={colors.textSecondary} />
                    <Text style={styles.clientStatText}>${client.lifetime_value}</Text>
                  </View>
                </View>
                {client.tags && client.tags.length > 0 && (
                  <View style={styles.tagContainer}>
                    {client.tags.map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </GlassView>
            </TouchableOpacity>
          ))}
        </View>

        {filteredClients.length === 0 && (
          <GlassView style={styles.emptyState}>
            <IconSymbol ios_icon_name="person.2" android_material_icon_name="people" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No clients found</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/(provider)/clients/add')}
            >
              <Text style={styles.emptyButtonText}>Add Your First Client</Text>
            </TouchableOpacity>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  pipeline: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pipelineCard: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pipelineCardActive: {
    borderColor: colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  pipelineCount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  pipelineLabel: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 20,
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
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clientFooter: {
    flexDirection: 'row',
    gap: 16,
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
    gap: 8,
    marginTop: 12,
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
