
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function SupportScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/support-tickets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_tickets',
          }),
        }
      );

      const result = await response.json();
      setTickets(result.tickets || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = () => {
    Alert.prompt(
      'New Support Ticket',
      'What do you need help with?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (subject) => {
            if (!subject || subject.trim().length === 0) {
              Alert.alert('Error', 'Please enter a subject');
              return;
            }

            try {
              const { data: { session } } = await supabase.auth.getSession();
              
              const response = await fetch(
                `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/support-tickets`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    action: 'create_ticket',
                    subject,
                    priority: 'normal',
                  }),
                }
              );

              const result = await response.json();
              
              if (result.ticket) {
                Alert.alert('Success', 'Support ticket created');
                loadTickets();
                router.push(`/(provider)/support/${result.ticket.id}` as any);
              }
            } catch (error) {
              console.error('Error creating ticket:', error);
              Alert.alert('Error', 'Failed to create support ticket');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'closed':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'normal':
        return colors.accent;
      case 'low':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <TouchableOpacity onPress={handleCreateTicket} style={styles.addButton}>
          <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {tickets.length === 0 ? (
        <GlassView style={styles.emptyState}>
          <IconSymbol ios_icon_name="questionmark.circle.fill" android_material_icon_name="help" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Support Tickets</Text>
          <Text style={styles.emptyText}>
            Need help? Create a support ticket and our team will get back to you soon.
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTicket}>
            <GlassView style={styles.createButtonInner}>
              <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add-circle" size={20} color={colors.primary} />
              <Text style={styles.createButtonText}>Create Ticket</Text>
            </GlassView>
          </TouchableOpacity>
        </GlassView>
      ) : (
        <View style={styles.ticketsList}>
          {tickets.map((ticket, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/(provider)/support/${ticket.id}` as any)}
            >
              <GlassView style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '30' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.ticketFooter}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) + '30' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                      {ticket.priority}
                    </Text>
                  </View>
                  <Text style={styles.ticketDate}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </Text>
                </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  centerContent: {
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
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    width: '100%',
  },
  createButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  ticketSubject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
