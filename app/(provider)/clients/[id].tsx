
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, Booking, Invoice, Payment } from '@/types';
import * as ImagePicker from 'expo-image-picker';

type Tab = 'overview' | 'activity' | 'messages' | 'files' | 'billing' | 'ai';

interface TimelineItem {
  id: string;
  type: 'job' | 'invoice' | 'payment' | 'note';
  date: string;
  title: string;
  subtitle?: string;
  amount?: number;
  status?: string;
}

export default function ClientDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { organization, profile } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'sms' | 'email'>('sms');

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

      // Load payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });
      setPayments(paymentsData || []);

      // Load notes
      const { data: notesData } = await supabase
        .from('client_notes')
        .select('*, profiles(name)')
        .eq('client_id', id)
        .order('created_at', { ascending: false });
      setNotes(notesData || []);

      // Load messages
      const { data: messagesData } = await supabase
        .from('client_messages')
        .select('*, profiles(name)')
        .eq('client_id', id)
        .order('created_at', { ascending: false });
      setMessages(messagesData || []);

      // Load files
      const { data: filesData } = await supabase
        .from('client_files')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });
      setFiles(filesData || []);

    } catch (error) {
      console.error('Error loading client data:', error);
      Alert.alert('Error', 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const calculateStats = () => {
    const totalJobs = bookings.length;
    const completedJobs = bookings.filter(b => b.status === 'completed').length;
    const outstandingBalance = invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + Number(i.total), 0);
    const lastService = bookings.length > 0 
      ? new Date(bookings[0].scheduled_date).toLocaleDateString()
      : 'Never';

    return { totalJobs, completedJobs, outstandingBalance, lastService };
  };

  const getTimeline = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    bookings.forEach(b => {
      items.push({
        id: b.id,
        type: 'job',
        date: b.scheduled_date,
        title: b.service_name,
        subtitle: `${b.scheduled_time} • ${b.status}`,
        amount: b.price ? Number(b.price) : undefined,
        status: b.status,
      });
    });

    invoices.forEach(i => {
      items.push({
        id: i.id,
        type: 'invoice',
        date: i.created_at,
        title: `Invoice #${i.invoice_number}`,
        subtitle: i.status,
        amount: Number(i.total),
        status: i.status,
      });
    });

    payments.forEach(p => {
      items.push({
        id: p.id,
        type: 'payment',
        date: p.created_at,
        title: 'Payment Received',
        subtitle: p.payment_method,
        amount: Number(p.amount),
        status: p.status,
      });
    });

    notes.forEach(n => {
      items.push({
        id: n.id,
        type: 'note',
        date: n.created_at,
        title: n.note_type === 'system' ? 'System Note' : 'Note Added',
        subtitle: n.content.substring(0, 50) + (n.content.length > 50 ? '...' : ''),
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase.from('client_notes').insert({
        client_id: id,
        organization_id: organization?.id,
        created_by: profile?.id,
        note_type: 'general',
        content: newNote,
      });

      if (error) throw error;

      setNewNote('');
      loadClientData();
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('client_messages').insert({
        client_id: id,
        organization_id: organization?.id,
        sent_by: profile?.id,
        message_type: messageType,
        content: newMessage,
        direction: 'outbound',
        status: 'sent',
      });

      if (error) throw error;

      setNewMessage('');
      loadClientData();
      Alert.alert('Success', `${messageType.toUpperCase()} sent successfully`);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleUploadFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // In a real app, upload to Supabase Storage
        Alert.alert('Coming Soon', 'File upload will be implemented with Supabase Storage');
      }
    } catch (error) {
      console.error('Error picking file:', error);
    }
  };

  const handleRecordPayment = () => {
    router.push({
      pathname: '/(provider)/money/record-payment',
      params: { client_id: id },
    });
  };

  if (loading || !client) {
    return (
      <View style={[commonStyles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={commonStyles.text}>Loading...</Text>
      </View>
    );
  }

  const stats = calculateStats();
  const timeline = getTimeline();

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Client Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Client Info Card */}
        <GlassView style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{getInitials(client.name)}</Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.statusText, { color: colors.primary }]}>{client.status.toUpperCase()}</Text>
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
        </GlassView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('messages')}>
            <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(provider)/schedule/create-job')}>
            <IconSymbol ios_icon_name="calendar.badge.plus" android_material_icon_name="event" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>New Job</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(provider)/money/create-invoice')}>
            <IconSymbol ios_icon_name="doc.text" android_material_icon_name="description" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('activity')}>
            <IconSymbol ios_icon_name="note.text.badge.plus" android_material_icon_name="note-add" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {(['overview', 'activity', 'messages', 'files', 'billing', 'ai'] as Tab[]).map((tab) => (
            <React.Fragment key={tab}>
              <TouchableOpacity
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Stats */}
            <View style={styles.statsGrid}>
              <GlassView style={styles.statCard}>
                <Text style={styles.statValue}>${client.lifetime_value?.toFixed(0) || 0}</Text>
                <Text style={styles.statLabel}>LTV</Text>
              </GlassView>
              <GlassView style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalJobs}</Text>
                <Text style={styles.statLabel}>Total Jobs</Text>
              </GlassView>
              <GlassView style={styles.statCard}>
                <Text style={styles.statValue}>${stats.outstandingBalance.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Outstanding</Text>
              </GlassView>
              <GlassView style={styles.statCard}>
                <Text style={styles.statValue}>{stats.lastService}</Text>
                <Text style={styles.statLabel}>Last Service</Text>
              </GlassView>
            </View>

            {/* Addresses */}
            <Text style={styles.sectionTitle}>Addresses</Text>
            <GlassView style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={colors.primary} />
                <Text style={styles.addressText}>{client.address || 'No address on file'}</Text>
                {client.address && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
            </GlassView>

            {/* Active Plans */}
            <Text style={styles.sectionTitle}>Active Plans</Text>
            <GlassView style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active plans</Text>
            </GlassView>

            {/* Notes */}
            {client.notes && (
              <React.Fragment>
                <Text style={styles.sectionTitle}>Notes</Text>
                <GlassView style={styles.notesCard}>
                  <Text style={styles.notesText}>{client.notes}</Text>
                </GlassView>
              </React.Fragment>
            )}
          </View>
        )}

        {activeTab === 'activity' && (
          <View style={styles.tabContent}>
            <View style={styles.addNoteSection}>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note..."
                placeholderTextColor={colors.textSecondary}
                value={newNote}
                onChangeText={setNewNote}
                multiline
              />
              <TouchableOpacity style={styles.addNoteButton} onPress={handleAddNote}>
                <IconSymbol ios_icon_name="paperplane.fill" android_material_icon_name="send" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {timeline.map((item, index) => (
              <React.Fragment key={index}>
                <GlassView style={styles.timelineItem}>
                  <View style={styles.timelineHeader}>
                    <View style={styles.timelineIcon}>
                      <IconSymbol
                        ios_icon_name={
                          item.type === 'job' ? 'wrench.fill' :
                          item.type === 'invoice' ? 'doc.text.fill' :
                          item.type === 'payment' ? 'dollarsign.circle.fill' :
                          'note.text'
                        }
                        android_material_icon_name={
                          item.type === 'job' ? 'build' :
                          item.type === 'invoice' ? 'description' :
                          item.type === 'payment' ? 'payments' :
                          'note'
                        }
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>{item.title}</Text>
                      {item.subtitle && <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>}
                      <Text style={styles.timelineDate}>
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                    {item.amount && (
                      <Text style={styles.timelineAmount}>${item.amount.toFixed(2)}</Text>
                    )}
                  </View>
                </GlassView>
              </React.Fragment>
            ))}

            {timeline.length === 0 && (
              <GlassView style={styles.emptyCard}>
                <Text style={styles.emptyText}>No activity yet</Text>
              </GlassView>
            )}
          </View>
        )}

        {activeTab === 'messages' && (
          <View style={styles.tabContent}>
            <View style={styles.messageTypeSelector}>
              <TouchableOpacity
                style={[styles.messageTypeButton, messageType === 'sms' && styles.messageTypeButtonActive]}
                onPress={() => setMessageType('sms')}
              >
                <Text style={[styles.messageTypeText, messageType === 'sms' && styles.messageTypeTextActive]}>SMS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.messageTypeButton, messageType === 'email' && styles.messageTypeButtonActive]}
                onPress={() => setMessageType('email')}
              >
                <Text style={[styles.messageTypeText, messageType === 'email' && styles.messageTypeTextActive]}>Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.messageComposer}>
              <TextInput
                style={styles.messageInput}
                placeholder={`Send ${messageType.toUpperCase()}...`}
                placeholderTextColor={colors.textSecondary}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <IconSymbol ios_icon_name="paperplane.fill" android_material_icon_name="send" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {messages.map((message, index) => (
              <React.Fragment key={index}>
                <GlassView style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <View style={styles.messageIcon}>
                      <IconSymbol
                        ios_icon_name={message.message_type === 'sms' ? 'message.fill' : 'envelope.fill'}
                        android_material_icon_name={message.message_type === 'sms' ? 'sms' : 'email'}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.messageType}>{message.message_type.toUpperCase()}</Text>
                    <Text style={styles.messageDirection}>
                      {message.direction === 'outbound' ? 'Sent' : 'Received'}
                    </Text>
                    <Text style={styles.messageDate}>
                      {new Date(message.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.messageContent}>{message.content}</Text>
                </GlassView>
              </React.Fragment>
            ))}

            {messages.length === 0 && (
              <GlassView style={styles.emptyCard}>
                <Text style={styles.emptyText}>No messages yet</Text>
              </GlassView>
            )}
          </View>
        )}

        {activeTab === 'files' && (
          <View style={styles.tabContent}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadFile}>
              <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={24} color={colors.primary} />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </TouchableOpacity>

            {files.length > 0 ? (
              <View style={styles.filesGrid}>
                {files.map((file, index) => (
                  <React.Fragment key={index}>
                    <GlassView style={styles.fileCard}>
                      <IconSymbol ios_icon_name="doc.fill" android_material_icon_name="insert-drive-file" size={32} color={colors.primary} />
                      <Text style={styles.fileName} numberOfLines={1}>{file.file_name}</Text>
                      <Text style={styles.fileDate}>
                        {new Date(file.created_at).toLocaleDateString()}
                      </Text>
                    </GlassView>
                  </React.Fragment>
                ))}
              </View>
            ) : (
              <GlassView style={styles.emptyCard}>
                <Text style={styles.emptyText}>No files uploaded yet</Text>
              </GlassView>
            )}
          </View>
        )}

        {activeTab === 'billing' && (
          <View style={styles.tabContent}>
            {/* Open Invoices */}
            <Text style={styles.sectionTitle}>Open Invoices</Text>
            {invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').map((invoice, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity onPress={() => router.push(`/(provider)/money/invoice/${invoice.id}`)}>
                  <GlassView style={styles.invoiceCard}>
                    <View style={styles.invoiceHeader}>
                      <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
                      <Text style={styles.invoiceAmount}>${Number(invoice.total).toFixed(2)}</Text>
                    </View>
                    <Text style={styles.invoiceDate}>
                      Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                    </Text>
                    <View style={[styles.invoiceStatus, { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.invoiceStatusText, { color: colors.warning }]}>
                        {invoice.status.toUpperCase()}
                      </Text>
                    </View>
                  </GlassView>
                </TouchableOpacity>
              </React.Fragment>
            ))}

            {/* Payments */}
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            {payments.slice(0, 5).map((payment, index) => (
              <React.Fragment key={index}>
                <GlassView style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.success} />
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentAmount}>${Number(payment.amount).toFixed(2)}</Text>
                      <Text style={styles.paymentMethod}>{payment.payment_method}</Text>
                    </View>
                    <Text style={styles.paymentDate}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </GlassView>
              </React.Fragment>
            ))}

            <TouchableOpacity style={styles.recordPaymentButton} onPress={handleRecordPayment}>
              <Text style={styles.recordPaymentText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'ai' && (
          <View style={styles.tabContent}>
            <GlassView style={styles.aiCard}>
              <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto-awesome" size={48} color={colors.primary} />
              <Text style={styles.aiTitle}>AI Insights</Text>
              <Text style={styles.aiText}>
                {`Client Summary:\n\n`}
                {`• ${stats.totalJobs} total jobs (${stats.completedJobs} completed)\n`}
                {`• $${client.lifetime_value?.toFixed(0) || 0} lifetime value\n`}
                {`• Last service: ${stats.lastService}\n`}
                {`• Outstanding balance: $${stats.outstandingBalance.toFixed(2)}\n\n`}
                {client.status === 'lead' && 'This is a new lead. Consider reaching out to schedule their first service.\n\n'}
                {stats.outstandingBalance > 0 && 'There are outstanding invoices. Consider sending a payment reminder.\n\n'}
                {bookings.length > 3 && 'This is a repeat customer. Consider offering a loyalty discount or subscription plan.'}
              </Text>
            </GlassView>
          </View>
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
    fontWeight: '800',
    color: colors.text,
  },
  clientCard: {
    padding: 20,
    marginBottom: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contactInfo: {
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  tabs: {
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  addressCard: {
    padding: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notesCard: {
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  addNoteSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  noteInput: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addNoteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineItem: {
    padding: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timelineAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  messageTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  messageTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.glass,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  messageTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  messageTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  messageTypeTextActive: {
    color: colors.primary,
  },
  messageComposer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageCard: {
    padding: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageType: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  messageDirection: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  messageContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 16,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fileCard: {
    width: '47%',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  fileDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  invoiceCard: {
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  invoiceDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  invoiceStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  invoiceStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  paymentCard: {
    padding: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recordPaymentButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  recordPaymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  aiCard: {
    padding: 24,
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 16,
  },
  aiText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
});
