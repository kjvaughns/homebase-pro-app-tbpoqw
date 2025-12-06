
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function IntegrationsScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any[]>([]);

  useEffect(() => {
    loadIntegrations();
  }, [organization]);

  const loadIntegrations = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/manage-integrations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_integrations',
            org_id: organization.id,
          }),
        }
      );

      const result = await response.json();
      setIntegrations(result.integrations || []);
    } catch (error) {
      console.error('Error loading integrations:', error);
      Alert.alert('Error', 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationType: string) => {
    if (!organization) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/manage-integrations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'start_calendar_sync',
            org_id: organization.id,
            integration_type: integrationType,
          }),
        }
      );

      const result = await response.json();
      Alert.alert('Coming Soon', result.message || 'This integration is coming soon!');
      loadIntegrations();
    } catch (error) {
      console.error('Error connecting integration:', error);
      Alert.alert('Error', 'Failed to connect integration');
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'google_calendar':
        return { ios: 'calendar', android: 'event' };
      case 'quickbooks':
        return { ios: 'chart.bar.fill', android: 'bar-chart' };
      case 'zapier':
        return { ios: 'bolt.fill', android: 'flash-on' };
      default:
        return { ios: 'app.fill', android: 'apps' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return colors.success;
      case 'coming_soon':
        return colors.warning;
      case 'disabled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading integrations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Integrations</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.subtitle}>Connect your favorite tools to HomeBase</Text>

      <View style={styles.integrationsGrid}>
        {integrations.map((integration, index) => {
          const icon = getIntegrationIcon(integration.type);
          const statusColor = getStatusColor(integration.status);
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (integration.status === 'coming_soon') {
                  handleConnect(integration.type);
                } else if (integration.status === 'connected') {
                  Alert.alert('Connected', 'This integration is already connected');
                }
              }}
              disabled={integration.status === 'disabled'}
            >
              <GlassView style={[styles.integrationCard, integration.status === 'disabled' && styles.integrationCardDisabled]}>
                <IconSymbol 
                  ios_icon_name={icon.ios} 
                  android_material_icon_name={icon.android} 
                  size={40} 
                  color={statusColor} 
                />
                <Text style={styles.integrationName}>{integration.name || integration.type}</Text>
                <Text style={styles.integrationDescription}>{integration.description || ''}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '30' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {integration.status.replace('_', ' ')}
                  </Text>
                </View>
              </GlassView>
            </TouchableOpacity>
          );
        })}
      </View>

      <GlassView style={styles.infoCard}>
        <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.accent} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>More Integrations Coming Soon</Text>
          <Text style={styles.infoText}>
            We're working on adding more integrations to help you streamline your workflow. 
            Have a suggestion? Let us know in the support section!
          </Text>
        </View>
      </GlassView>
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
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  integrationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  integrationCard: {
    width: '48%',
    padding: 20,
    alignItems: 'center',
  },
  integrationCardDisabled: {
    opacity: 0.5,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  integrationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
