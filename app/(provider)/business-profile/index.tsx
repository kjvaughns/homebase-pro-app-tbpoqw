
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

export default function BusinessProfileScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [heroUrl, setHeroUrl] = useState('');
  const [servicesVisible, setServicesVisible] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [organization]);

  const loadProfile = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/manage-marketplace-profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'GET',
            org_id: organization.id,
          }),
        }
      );

      const result = await response.json();
      
      if (result.profile) {
        setProfile(result.profile);
        setSlug(result.profile.slug || '');
        setIsPublished(result.profile.is_published || false);
        setHeroUrl(result.profile.hero_url || '');
        setServicesVisible(result.profile.services_visible !== false);
      } else {
        // Initialize with organization slug
        setSlug(organization.slug || organization.business_name.toLowerCase().replace(/\s+/g, '-'));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;

    if (!slug || slug.trim().length < 3) {
      Alert.alert('Invalid Slug', 'Slug must be at least 3 characters');
      return;
    }

    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://qjuilxfvqvmoqykpdugi.supabase.co/functions/v1/manage-marketplace-profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'UPSERT',
            org_id: organization.id,
            slug: slug.toLowerCase().replace(/\s+/g, '-'),
            is_published: isPublished,
            hero_url: heroUrl,
            services_visible: servicesVisible,
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert('Success', 'Business profile updated successfully');
      setProfile(result.profile);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Business Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Marketplace Settings</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Business URL Slug</Text>
          <TextInput
            style={styles.input}
            value={slug}
            onChangeText={setSlug}
            placeholder="your-business-name"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
          <Text style={styles.hint}>homebase.app/book/{slug || 'your-slug'}</Text>
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Publish to Marketplace</Text>
              <Text style={styles.hint}>Make your business visible to homeowners</Text>
            </View>
            <Switch
              value={isPublished}
              onValueChange={setIsPublished}
              trackColor={{ false: colors.glass, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Show Services</Text>
              <Text style={styles.hint}>Display your services on your profile</Text>
            </View>
            <Switch
              value={servicesVisible}
              onValueChange={setServicesVisible}
              trackColor={{ false: colors.glass, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </View>
      </GlassView>

      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Media</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Hero Image URL</Text>
          <TextInput
            style={styles.input}
            value={heroUrl}
            onChangeText={setHeroUrl}
            placeholder="https://example.com/hero.jpg"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
          <Text style={styles.hint}>Recommended: 1200x600px</Text>
        </View>
      </GlassView>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <GlassView style={styles.saveButtonInner}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </GlassView>
      </TouchableOpacity>
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
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
