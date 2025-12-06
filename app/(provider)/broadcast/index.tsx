
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

type Audience = 'all' | 'leads' | 'active' | 'inactive' | 'tags';
type Channel = 'email' | 'sms' | 'both';

export default function BroadcastScreen() {
  const router = useRouter();
  const { organization, profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<Audience>('all');
  const [selectedChannel, setSelectedChannel] = useState<Channel>('email');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    loadClients();
  }, [organization?.id]);

  const loadClients = async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) throw error;
      setClients(data || []);

      // Extract unique tags
      const tags = new Set<string>();
      data?.forEach(client => {
        client.tags?.forEach((tag: string) => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const getFilteredClients = () => {
    let filtered = clients;

    if (selectedAudience === 'leads') {
      filtered = clients.filter(c => c.status === 'lead');
    } else if (selectedAudience === 'active') {
      filtered = clients.filter(c => c.status === 'active');
    } else if (selectedAudience === 'inactive') {
      filtered = clients.filter(c => c.status === 'inactive');
    } else if (selectedAudience === 'tags' && selectedTags.length > 0) {
      filtered = clients.filter(c => 
        c.tags?.some((tag: string) => selectedTags.includes(tag))
      );
    }

    // Filter by channel availability
    if (selectedChannel === 'email' || selectedChannel === 'both') {
      filtered = filtered.filter(c => c.email);
    }
    if (selectedChannel === 'sms' || selectedChannel === 'both') {
      filtered = filtered.filter(c => c.phone);
    }

    return filtered;
  };

  const handleSend = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter a campaign name', 'error');
      return;
    }
    if (!formData.message.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }
    if (selectedChannel === 'email' && !formData.subject.trim()) {
      showToast('Please enter an email subject', 'error');
      return;
    }

    const recipients = getFilteredClients();
    if (recipients.length === 0) {
      showToast('No recipients match your criteria', 'error');
      return;
    }

    Alert.alert(
      'Send Broadcast',
      `Send to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} via ${selectedChannel.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setLoading(true);

              // Create campaign
              const { data: campaign, error: campaignError } = await supabase
                .from('campaigns')
                .insert({
                  organization_id: organization?.id,
                  name: formData.name,
                  subject: formData.subject || null,
                  message: formData.message,
                  channel: selectedChannel,
                  audience_filter: {
                    audience: selectedAudience,
                    tags: selectedTags,
                  },
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                  recipient_count: recipients.length,
                })
                .select()
                .single();

              if (campaignError) throw campaignError;

              // Create campaign sends
              const sends = recipients.map(client => ({
                campaign_id: campaign.id,
                client_id: client.id,
                channel: selectedChannel,
                status: 'sent',
                sent_at: new Date().toISOString(),
              }));

              const { error: sendsError } = await supabase
                .from('campaign_sends')
                .insert(sends);

              if (sendsError) throw sendsError;

              showToast('Broadcast sent successfully!', 'success');
              router.back();
            } catch (error: any) {
              console.error('Error sending broadcast:', error);
              showToast(error.message || 'Failed to send broadcast', 'error');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const recipientCount = getFilteredClients().length;

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Broadcast Message</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.form}>
          <Text style={styles.label}>Campaign Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Spring Promotion"
            placeholderTextColor={colors.textSecondary}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Text style={styles.label}>Audience *</Text>
          <View style={styles.audienceGrid}>
            {(['all', 'leads', 'active', 'inactive', 'tags'] as Audience[]).map((audience) => (
              <React.Fragment key={audience}>
                <TouchableOpacity
                  style={[
                    styles.audienceChip,
                    selectedAudience === audience && styles.audienceChipActive,
                  ]}
                  onPress={() => setSelectedAudience(audience)}
                >
                  <Text
                    style={[
                      styles.audienceChipText,
                      selectedAudience === audience && styles.audienceChipTextActive,
                    ]}
                  >
                    {audience === 'all' ? 'All Clients' : audience.charAt(0).toUpperCase() + audience.slice(1)}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          {selectedAudience === 'tags' && (
            <React.Fragment>
              <Text style={styles.label}>Select Tags</Text>
              <View style={styles.tagsGrid}>
                {availableTags.map((tag, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity
                      style={[
                        styles.tagChip,
                        selectedTags.includes(tag) && styles.tagChipActive,
                      ]}
                      onPress={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.tagChipText,
                          selectedTags.includes(tag) && styles.tagChipTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </React.Fragment>
          )}

          <Text style={styles.label}>Channel *</Text>
          <View style={styles.channelGrid}>
            {(['email', 'sms', 'both'] as Channel[]).map((channel) => (
              <React.Fragment key={channel}>
                <TouchableOpacity
                  style={[
                    styles.channelChip,
                    selectedChannel === channel && styles.channelChipActive,
                  ]}
                  onPress={() => setSelectedChannel(channel)}
                >
                  <IconSymbol
                    ios_icon_name={
                      channel === 'email' ? 'envelope.fill' :
                      channel === 'sms' ? 'message.fill' :
                      'paperplane.fill'
                    }
                    android_material_icon_name={
                      channel === 'email' ? 'email' :
                      channel === 'sms' ? 'sms' :
                      'send'
                    }
                    size={20}
                    color={selectedChannel === channel ? colors.text : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.channelChipText,
                      selectedChannel === channel && styles.channelChipTextActive,
                    ]}
                  >
                    {channel.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          {(selectedChannel === 'email' || selectedChannel === 'both') && (
            <React.Fragment>
              <Text style={styles.label}>Email Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email subject"
                placeholderTextColor={colors.textSecondary}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
              />
            </React.Fragment>
          )}

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your message..."
            placeholderTextColor={colors.textSecondary}
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            multiline
            numberOfLines={8}
          />

          <GlassView style={styles.recipientCount}>
            <IconSymbol
              ios_icon_name="person.2.fill"
              android_material_icon_name="people"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.recipientCountText}>
              {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
            </Text>
          </GlassView>
        </GlassView>

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          <IconSymbol
            ios_icon_name="paperplane.fill"
            android_material_icon_name="send"
            size={20}
            color={colors.text}
          />
          <Text style={styles.sendButtonText}>
            {loading ? 'Sending...' : 'Send Broadcast'}
          </Text>
        </TouchableOpacity>
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
  form: {
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audienceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  audienceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  audienceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  audienceChipTextActive: {
    color: colors.primary,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tagChipTextActive: {
    color: colors.primary,
  },
  channelGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  channelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.glass,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  channelChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  channelChipTextActive: {
    color: colors.text,
  },
  recipientCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    marginTop: 16,
  },
  recipientCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
