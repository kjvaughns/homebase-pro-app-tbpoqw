
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Client, Booking, Invoice } from '@/types';

export default function ClientDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'invoices' | 'files'>('overview');

  useEffect(() => {
    loadClientData();
  }, [id]);

  const loadClientData = async () => {
    try {
      // Load client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Load bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', id)
        .order('scheduled_date', { ascending: false });

      setBookings(bookingsData || []);

      // Load invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error loading client data:', error);
      Alert.alert('Error', 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !client) {
    return (
      <View style={[commonStyles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Client Details</Text>
      </View>

      {/* Client Info Card */}
      <GlassView style={styles.clientCard}>
        <View style={styles.clientHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{client.name[0]}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{client.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contactInfo}>
          {client.email && (
            <View style={styles.contactRow}>
              <IconSymbol ios_icon_name="envelope.fill" android_material_icon_name="email" size={16} color={colors.textSecondary} />
              <Text style={styles.contactText}>{client.email}</Text>
            </View>
          )}
          {client.phone && (
            <View style={styles.contactRow}>
              <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={16} color={colors.textSecondary} />
              <Text style={styles.contactText}>{client.phone}</Text>
            </View>
          )}
          {client.address && (
            <View style={styles.contactRow}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={16} color={colors.textSecondary} />
              <Text style={styles.contactText}>{client.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>${client.lifetime_value.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Lifetime Value</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{invoices.length}</Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>
        </View>
      </GlassView>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.activeTabText]}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
          onPress={() => setActiveTab('invoices')}
        >
          <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>Invoices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'files' && styles.activeTab]}
          onPress={() => setActiveTab('files')}
        >
          <Text style={[styles.tabText, activeTab === 'files' && styles.activeTabText]}>Files</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <GlassView style={styles.notesCard}>
            <Text style={styles.notesText}>{client.notes || 'No notes yet'}</Text>
          </GlassView>

          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {client.tags && client.tags.length > 0 ? (
              client.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No tags</Text>
            )}
          </View>
        </View>
      )}

      {activeTab === 'bookings' && (
        <View style={styles.tabContent}>
          {bookings.length > 0 ? (
            bookings.map((booking, index) => (
              <GlassView key={index} style={styles.listItem}>
                <Text style={styles.listItemTitle}>{booking.service_name}</Text>
                <Text style={styles.listItemSubtitle}>
                  {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
                </View>
              </GlassView>
            ))
          ) : (
            <Text style={styles.emptyText}>No bookings yet</Text>
          )}
        </View>
      )}

      {activeTab === 'invoices' && (
        <View style={styles.tabContent}>
          {invoices.length > 0 ? (
            invoices.map((invoice, index) => (
              <GlassView key={index} style={styles.listItem}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.listItemTitle}>#{invoice.invoice_number}</Text>
                  <Text style={styles.invoiceAmount}>${invoice.total}</Text>
                </View>
                <Text style={styles.listItemSubtitle}>
                  Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{invoice.status.toUpperCase()}</Text>
                </View>
              </GlassView>
            ))
          ) : (
            <Text style={styles.emptyText}>No invoices yet</Text>
          )}
        </View>
      )}

      {activeTab === 'files' && (
        <View style={styles.tabContent}>
          <Text style={styles.emptyText}>No files uploaded yet</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol ios_icon_name="calendar.badge.plus" android_material_icon_name="event" size={20} color={colors.text} />
          <Text style={styles.actionButtonText}>Schedule Job</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <IconSymbol ios_icon_name="doc.text" android_material_icon_name="description" size={20} color={colors.text} />
          <Text style={styles.actionButtonText}>Create Invoice</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  clientCard: {
    padding: 20,
    marginBottom: 24,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  contactInfo: {
    marginBottom: 20,
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.text,
  },
  tabContent: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  notesCard: {
    padding: 16,
    marginBottom: 24,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: colors.accent + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  listItem: {
    padding: 16,
    marginBottom: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 32,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
