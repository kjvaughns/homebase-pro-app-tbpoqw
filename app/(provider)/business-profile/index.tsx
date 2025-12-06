
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';

export default function BusinessProfileScreen() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [heroUrl, setHeroUrl] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [radius, setRadius] = useState('25');
  const [address, setAddress] = useState('');
  const [servicesVisible, setServicesVisible] = useState(true);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  // Marketplace
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [showSlugModal, setShowSlugModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [organization]);

  useEffect(() => {
    if (slug && slug.length >= 3) {
      const timer = setTimeout(() => {
        checkSlugAvailability();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slug]);

  const loadProfile = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      
      // Load organization data
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single();

      if (orgData) {
        setBusinessName(orgData.business_name || '');
        setDescription(orgData.description || '');
        setLogoUrl(orgData.logo_url || '');
        setRadius(orgData.service_radius?.toString() || '25');
        setAddress(orgData.location || '');
      }

      // Load marketplace profile
      const { data: marketplaceData } = await supabase
        .from('org_marketplace_profiles')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (marketplaceData) {
        setProfile(marketplaceData);
        setSlug(marketplaceData.slug || '');
        setIsPublished(marketplaceData.is_published || false);
        setHeroUrl(marketplaceData.hero_url || '');
        setServicesVisible(marketplaceData.services_visible !== false);
        
        const socials = marketplaceData.socials || {};
        setFacebookUrl(socials.facebook || '');
        setInstagramUrl(socials.instagram || '');
        setWebsiteUrl(socials.website || '');
        
        const contactPrefs = marketplaceData.contact_prefs || {};
        setBusinessPhone(contactPrefs.phone || '');
        setBusinessEmail(contactPrefs.email || '');
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

  const checkSlugAvailability = async () => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    try {
      setCheckingSlug(true);
      const { data, error } = await supabase
        .from('org_marketplace_profiles')
        .select('id, organization_id')
        .eq('slug', slug.toLowerCase())
        .maybeSingle();

      if (error) throw error;

      // Slug is available if no record found, or if it's the current organization's slug
      setSlugAvailable(!data || data.organization_id === organization?.id);
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;

    if (!slug || slug.trim().length < 3) {
      Alert.alert('Invalid Slug', 'Slug must be at least 3 characters');
      return;
    }

    if (slugAvailable === false) {
      Alert.alert('Slug Unavailable', 'This slug is already taken. Please choose another.');
      return;
    }

    try {
      setSaving(true);

      // Update organization
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          business_name: businessName,
          description: description,
          logo_url: logoUrl,
          service_radius: parseInt(radius) || 25,
          location: address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (orgError) throw orgError;

      // Upsert marketplace profile
      const { error: marketplaceError } = await supabase
        .from('org_marketplace_profiles')
        .upsert({
          organization_id: organization.id,
          slug: slug.toLowerCase().replace(/\s+/g, '-'),
          is_published: isPublished,
          hero_url: heroUrl,
          services_visible: servicesVisible,
          socials: {
            facebook: facebookUrl,
            instagram: instagramUrl,
            website: websiteUrl,
          },
          contact_prefs: {
            phone: businessPhone,
            email: businessEmail,
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id',
        });

      if (marketplaceError) throw marketplaceError;

      Alert.alert('Success', 'Business profile updated successfully');
      await loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleViewPublicPage = () => {
    if (!slug) {
      Alert.alert('No Slug', 'Please set a slug first');
      return;
    }
    Alert.alert('Public Page', `Your public page will be at:\nhomebase.app/p/${slug}`);
  };

  const pickImage = async (type: 'logo' | 'hero') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [2, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // In a real app, you would upload to Supabase Storage here
      const imageUrl = result.assets[0].uri;
      if (type === 'logo') {
        setLogoUrl(imageUrl);
      } else {
        setHeroUrl(imageUrl);
      }
      Alert.alert('Image Selected', 'In production, this would upload to Supabase Storage');
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
      {/* Slug Modal */}
      <Modal
        visible={showSlugModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSlugModal(false)}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowSlugModal(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <GlassView style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Slug</Text>
                <Text style={styles.modalSubtitle}>Choose your unique business URL</Text>

                <View style={styles.field}>
                  <Text style={styles.label}>Slug</Text>
                  <TextInput
                    style={styles.input}
                    value={slug}
                    onChangeText={setSlug}
                    placeholder="your-business-name"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                  />
                  <View style={styles.slugPreview}>
                    <Text style={styles.slugPreviewText}>homebase.app/p/</Text>
                    <Text style={[styles.slugPreviewText, { color: colors.primary }]}>{slug || 'your-slug'}</Text>
                  </View>
                  {checkingSlug && (
                    <View style={styles.slugStatus}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.slugStatusText}>Checking availability...</Text>
                    </View>
                  )}
                  {!checkingSlug && slugAvailable === true && slug.length >= 3 && (
                    <View style={styles.slugStatus}>
                      <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={16} color={colors.success} />
                      <Text style={[styles.slugStatusText, { color: colors.success }]}>Available!</Text>
                    </View>
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <View style={styles.slugStatus}>
                      <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={16} color={colors.error} />
                      <Text style={[styles.slugStatusText, { color: colors.error }]}>Already taken</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  onPress={() => setShowSlugModal(false)} 
                  style={styles.modalButton}
                  disabled={slugAvailable === false}
                >
                  <GlassView style={styles.modalButtonInner}>
                    <Text style={styles.modalButtonText}>Done</Text>
                  </GlassView>
                </TouchableOpacity>
              </GlassView>
            </TouchableOpacity>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Business Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Basic Info */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Your Business Name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell homeowners about your business..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>
      </GlassView>

      {/* Media */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Media</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Logo</Text>
          <TouchableOpacity onPress={() => pickImage('logo')}>
            <View style={styles.imageUpload}>
              {logoUrl ? (
                <Text style={styles.imageUploadText}>Logo selected ✓</Text>
              ) : (
                <>
                  <IconSymbol ios_icon_name="photo" android_material_icon_name="image" size={32} color={colors.textSecondary} />
                  <Text style={styles.imageUploadText}>Tap to upload logo</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Hero Image</Text>
          <TouchableOpacity onPress={() => pickImage('hero')}>
            <View style={styles.imageUpload}>
              {heroUrl ? (
                <Text style={styles.imageUploadText}>Hero image selected ✓</Text>
              ) : (
                <>
                  <IconSymbol ios_icon_name="photo" android_material_icon_name="image" size={32} color={colors.textSecondary} />
                  <Text style={styles.imageUploadText}>Tap to upload hero (1200x600px)</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </GlassView>

      {/* Contact */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Business Phone</Text>
          <TextInput
            style={styles.input}
            value={businessPhone}
            onChangeText={setBusinessPhone}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Business Email</Text>
          <TextInput
            style={styles.input}
            value={businessEmail}
            onChangeText={setBusinessEmail}
            placeholder="contact@yourbusiness.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </GlassView>

      {/* Location */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Service Area</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Service Radius (miles)</Text>
          <TextInput
            style={styles.input}
            value={radius}
            onChangeText={setRadius}
            placeholder="25"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Business Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, City, State 12345"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.hint}>Used to calculate service area</Text>
        </View>
      </GlassView>

      {/* Services */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Services</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.label}>Show Services on Profile</Text>
            <Text style={styles.hint}>Display your services list publicly</Text>
          </View>
          <Switch
            value={servicesVisible}
            onValueChange={setServicesVisible}
            trackColor={{ false: colors.glass, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/(provider)/services/index' as any)}>
          <View style={styles.linkButton}>
            <IconSymbol ios_icon_name="wrench.and.screwdriver.fill" android_material_icon_name="build" size={20} color={colors.primary} />
            <Text style={styles.linkButtonText}>Manage Services</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={16} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </GlassView>

      {/* Social Links */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Social Media</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Facebook</Text>
          <TextInput
            style={styles.input}
            value={facebookUrl}
            onChangeText={setFacebookUrl}
            placeholder="https://facebook.com/yourbusiness"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={instagramUrl}
            onChangeText={setInstagramUrl}
            placeholder="https://instagram.com/yourbusiness"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            placeholder="https://yourbusiness.com"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </View>
      </GlassView>

      {/* Portfolio & Reviews Preview */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio & Reviews</Text>
        
        <TouchableOpacity>
          <View style={styles.previewCard}>
            <IconSymbol ios_icon_name="photo.stack.fill" android_material_icon_name="collections" size={24} color={colors.primary} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Portfolio</Text>
              <Text style={styles.previewDescription}>Coming soon - showcase your work</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity>
          <View style={styles.previewCard}>
            <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={24} color={colors.primary} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Reviews</Text>
              <Text style={styles.previewDescription}>Coming soon - customer testimonials</Text>
            </View>
          </View>
        </TouchableOpacity>
      </GlassView>

      {/* Marketplace */}
      <GlassView style={styles.section}>
        <Text style={styles.sectionTitle}>Marketplace Settings</Text>
        
        <View style={styles.field}>
          <Text style={styles.label}>Business URL Slug</Text>
          <TouchableOpacity onPress={() => setShowSlugModal(true)}>
            <View style={styles.slugDisplay}>
              <Text style={styles.slugDisplayText}>homebase.app/p/{slug || 'your-slug'}</Text>
              <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

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

        {isPublished && (
          <TouchableOpacity onPress={handleViewPublicPage}>
            <View style={styles.linkButton}>
              <IconSymbol ios_icon_name="globe" android_material_icon_name="public" size={20} color={colors.primary} />
              <Text style={styles.linkButtonText}>View Public Page</Text>
              <IconSymbol ios_icon_name="arrow.up.right" android_material_icon_name="open-in-new" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
      </GlassView>

      {/* Save Button */}
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
    paddingBottom: 140,
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
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  imageUpload: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  slugDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: 16,
  },
  slugDisplayText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  slugPreview: {
    flexDirection: 'row',
    marginTop: 8,
  },
  slugPreviewText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  slugStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  slugStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 8,
  },
  modalButtonInner: {
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
