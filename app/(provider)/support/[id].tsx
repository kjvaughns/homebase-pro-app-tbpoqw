
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function SupportTicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Load ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading ticket:', error);
      Alert.alert('Error', 'Failed to load support ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: id,
          author_type: 'user',
          body: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await loadTicket();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = () => {
    Alert.alert(
      'Close Ticket',
      'Are you sure you want to close this support ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('support_tickets')
                .update({ status: 'closed', updated_at: new Date().toISOString() })
                .eq('id', id);

              if (error) throw error;

              Alert.alert('Success', 'Ticket closed successfully');
              router.back();
            } catch (error) {
              console.error('Error closing ticket:', error);
              Alert.alert('Error', 'Failed to close ticket');
            }
          },
        },
      ]
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

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading ticket...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backToListButton}>
          <Text style={styles.backToListText}>Back to Support</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={commonStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Support Ticket</Text>
        {ticket.status !== 'closed' && (
          <TouchableOpacity onPress={handleCloseTicket} style={styles.closeButton}>
            <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Ticket Info */}
        <GlassView style={styles.ticketInfo}>
          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          <View style={styles.ticketMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '30' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                {ticket.status}
              </Text>
            </View>
            <Text style={styles.ticketDate}>
              {new Date(ticket.created_at).toLocaleDateString()}
            </Text>
          </View>
        </GlassView>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <GlassView style={styles.emptyMessages}>
              <IconSymbol ios_icon_name="bubble.left.and.bubble.right" android_material_icon_name="chat" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyMessagesText}>No messages yet</Text>
              <Text style={styles.emptyMessagesSubtext}>Send a message to start the conversation</Text>
            </GlassView>
          ) : (
            messages.map((message, index) => (
              <View key={index} style={[
                styles.messageWrapper,
                message.author_type === 'user' ? styles.messageWrapperUser : styles.messageWrapperSupport
              ]}>
                <GlassView style={[
                  styles.message,
                  message.author_type === 'user' ? styles.messageUser : styles.messageSupport
                ]}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageAuthor}>
                      {message.author_type === 'user' ? 'You' : 'Support Team'}
                    </Text>
                    <Text style={styles.messageTime}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.messageBody}>{message.body}</Text>
                </GlassView>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Message Composer */}
      {ticket.status !== 'closed' && (
        <View style={styles.composer}>
          <GlassView style={styles.composerInner}>
            <TextInput
              style={styles.composerInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              onPress={handleSendMessage} 
              disabled={!newMessage.trim() || sending}
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <IconSymbol ios_icon_name="arrow.up.circle.fill" android_material_icon_name="send" size={32} color={colors.primary} />
              )}
            </TouchableOpacity>
          </GlassView>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  backToListButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.glass,
    borderRadius: 8,
  },
  backToListText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ticketInfo: {
    padding: 20,
    marginBottom: 16,
  },
  ticketSubject: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  ticketDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  messagesContainer: {
    gap: 12,
  },
  emptyMessages: {
    padding: 40,
    alignItems: 'center',
  },
  emptyMessagesText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  messageWrapper: {
    width: '100%',
  },
  messageWrapperUser: {
    alignItems: 'flex-end',
  },
  messageWrapperSupport: {
    alignItems: 'flex-start',
  },
  message: {
    maxWidth: '80%',
    padding: 12,
  },
  messageUser: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  messageSupport: {
    backgroundColor: colors.glass,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  messageAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  messageBody: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  composer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  composerInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 12,
  },
  composerInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
