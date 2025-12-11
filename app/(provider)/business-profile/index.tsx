
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

interface BusinessProfile {
  id?: string;
  organization_id?: string;
  name?: string;
  description?: string;
  slug?: string;
  logo_url?: string;
  hero_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    x?: string;
    youtube?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  service_radius_miles?: number;
  hours?: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  photos?: { url: string; title?: string; category?: string }[];
  services_visible?: boolean;
  is_published?: boolean;
}

export default function BusinessProfileEditor() {
  const router = useRouter();
  const { showToast } = useToast();
  const { organization: authOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<BusinessProfile>({
    services_visible: true,
    is_published: false,
    service_radius_miles: 25,
    socials: {},
    address: {},
    hours: {},
    photos: [],
  });
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('BusinessProfile: No user found');
        router.replace('/auth/login');
        return;
      }

      console.log('BusinessProfile: Loading organization for user:', user.id);

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (orgError) {
        console.error('BusinessProfile: Error loading organization:', orgError);
        setError('Failed to load organization');
        return;
      }

      if (!org) {
        console.log('BusinessProfile: No organization found');
        setError('no_organization');
        return;
      }

      console.log('BusinessProfile: Organization found:', org.id);
      setOrganizationId(org.id);

      const { data: existingProfile, error: profileError } = await supabase
        .from('org_marketplace_profiles')
        .select('*')
        .eq('organization_id', org.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('BusinessProfile: Error loading profile:', profileError);
        setError('Failed to load profile');
        return;
      }

      if (existingProfile) {
        console.log('BusinessProfile: Profile loaded');
        setProfile(existingProfile);
        lastSavedRef.current = JSON.stringify(existingProfile);
      } else {
        console.log('BusinessProfile: Creating new profile');
        const newProfile = {
          organization_id: org.id,
          services_visible: true,
          is_published: false,
          service_radius_miles: 25,
          socials: {},
          address: {},
          hours: {},
          photos: [],
        };
        
        const { data: created, error: createError } = await supabase
          .from('org_marketplace_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('BusinessProfile: Error creating profile:', createError);
          setError('Failed to create profile');
        } else if (created) {
          console.log('BusinessProfile: Profile created');
          setProfile(created);
          lastSavedRef.current = JSON.stringify(created);
        }
      }
    } catch (error) {
      console.error('BusinessProfile: Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSave = useCallback(async (isAutosave = false) => {
    if (!organizationId) {
      console.error('BusinessProfile: No organization ID');
      return;
    }
    
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Please log in again', 'error');
        return;
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/save-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(profile),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      lastSavedRef.current = JSON.stringify(profile);
      setHasUnsavedChanges(false);
      
      if (!isAutosave) {
        showToast('Profile saved successfully', 'success');
      }
    } catch (error) {
      console.error('BusinessProfile: Error saving profile:', error);
      if (!isAutosave) {
        showToast('Error saving profile', 'error');
      }
    } finally {
      setSaving(false);
    }
  }, [organizationId, profile, showToast]);

  useEffect(() => {
    loadProfile();
    
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [loadProfile]);

  useEffect(() => {
    const currentState = JSON.stringify(profile);
    if (currentState !== lastSavedRef.current && lastSavedRef.current !== '') {
      setHasUnsavedChanges(true);
      
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      
      autosaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, 2000);
    }
  }, [profile, handleSave]);

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/check-slug`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ slug }),
        }
      );

      const result = await response.json();
      setSlugAvailable(result.available);
    } catch (error) {
      console.error('BusinessProfile: Error checking slug:', error);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handlePublish = async () => {
    const validationErrors: Record<string, string> = {};
    
    if (!profile.name) validationErrors.name = 'Business name is required';
    if (!profile.description) validationErrors.description = 'Description is required';
    if (!profile.logo_url) validationErrors.logo_url = 'Logo is required';
    if (!profile.hero_url) validationErrors.hero_url = 'Hero image is required';
    if (!profile.slug) validationErrors.slug = 'Slug is required';
    if (!profile.phone && !profile.email) validationErrors.contact = 'At least one contact method is required';
    if (!profile.address?.street || !profile.address?.city) validationErrors.address = 'Complete address is required';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await handleSave();

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/reserve-slug`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ org_id: organizationId, slug: profile.slug }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reserve slug');
      }

      const publishResponse = await fetch(
        `${supabase.supabaseUrl}/functions/v1/publish-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ org_id: organizationId }),
        }
      );

      if (!publishResponse.ok) {
        const error = await publishResponse.json();
        throw new Error(error.error || 'Failed to publish profile');
      }

      setProfile({ ...profile, is_published: true });
      showToast('Profile published successfully!', 'success');
    } catch (error: any) {
      console.error('BusinessProfile: Error publishing:', error);
      showToast(error.message || 'Error publishing profile', 'error');
    }
  };

  const handleUnpublish = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/unpublish-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ org_id: organizationId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to unpublish profile');
      }

      setProfile({ ...profile, is_published: false });
      showToast('Profile unpublished', 'success');
    } catch (error) {
      console.error('BusinessProfile: Error unpublishing:', error);
      showToast('Error unpublishing profile', 'error');
    }
  };

  const pickImage = async (type: 'logo' | 'hero') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadImage(asset.uri, type);
    }
  };

  const uploadImage = async (uri: string, type: 'logo' | 'hero') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${organizationId}-${type}-${Date.now()}.${fileExt}`;
      const bucket = type === 'logo' ? 'marketplace-logos' : 'marketplace-hero';

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setProfile({
        ...profile,
        [type === 'logo' ? 'logo_url' : 'hero_url']: publicUrl,
      });

      showToast(`${type === 'logo' ? 'Logo' : 'Hero image'} uploaded`, 'success');
    } catch (error) {
      console.error('BusinessProfile: Error uploading image:', error);
      showToast('Error uploading image', 'error');
    }
  };

  const copyShareLink = async () => {
    if (!profile.slug) {
      showToast('Please set a slug first', 'error');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/generate-share-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ slug: profile.slug }),
        }
      );

      const result = await response.json();
      
      // In a real app, you'd use Clipboard API
      showToast('Link copied: ' + result.link, 'success');
    } catch (error) {
      console.error('BusinessProfile: Error generating link:', error);
      showToast('Error generating link', 'error');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Business Profile...</Text>
      </View>
    );
  }

  // Error state - no organization
  if (error === 'no_organization') {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <GlassView style={styles.errorCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={48}
            color={colors.warning}
          />
          <Text style={styles.errorTitle}>No Organization Found</Text>
          <Text style={styles.errorMessage}>
            You need to complete provider onboarding first to create your business profile.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace('/(provider)/onboarding/business-basics')}
          >
            <Text style={styles.errorButtonText}>Complete Onboarding</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </GlassView>
      </View>
    );
  }

  // Error state - other errors
  if (error) {
    return (
      <View style={[commonStyles.container, styles.centerContent]}>
        <GlassView style={styles.errorCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.circle.fill"
            android_material_icon_name="error"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Error Loading Profile</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={loadProfile}
          >
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </GlassView>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, commonStyles.safeAreaBottom]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, commonStyles.safeAreaTop]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Profile</Text>
          <View style={styles.headerActions}>
            {saving && <ActivityIndicator size="small" color={colors.primary} />}
            <TouchableOpacity onPress={() => handleSave(false)} disabled={saving}>
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {hasUnsavedChanges && (
          <View style={styles.unsavedBanner}>
            <Text style={styles.unsavedText}>Autosaving changes...</Text>
          </View>
        )}

        {/* Basics Section */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Basics</Text>
          
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={profile.name || ''}
            onChangeText={(text) => setProfile({ ...profile, name: text })}
            placeholder="Enter business name"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={profile.description || ''}
            onChangeText={(text) => setProfile({ ...profile, description: text })}
            placeholder="Describe your business..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

          <View style={styles.switchRow}>
            <Text style={styles.label}>Show Services on Public Page</Text>
            <Switch
              value={profile.services_visible}
              onValueChange={(value) => setProfile({ ...profile, services_visible: value })}
              trackColor={{ false: colors.glass, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </GlassView>

        {/* Branding Section */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Branding</Text>
          
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('logo')}>
            <IconSymbol
              ios_icon_name="photo"
              android_material_icon_name="image"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.uploadButtonText}>
              {profile.logo_url ? 'Change Logo' : 'Upload Logo *'}
            </Text>
          </TouchableOpacity>
          {errors.logo_url && <Text style={styles.errorText}>{errors.logo_url}</Text>}

          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('hero')}>
            <IconSymbol
              ios_icon_name="photo"
              android_material_icon_name="image"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.uploadButtonText}>
              {profile.hero_url ? 'Change Hero Image' : 'Upload Hero Image *'}
            </Text>
          </TouchableOpacity>
          {errors.hero_url && <Text style={styles.errorText}>{errors.hero_url}</Text>}
        </GlassView>

        {/* Contact Section */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={profile.phone || ''}
            onChangeText={(text) => setProfile({ ...profile, phone: text })}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={profile.email || ''}
            onChangeText={(text) => setProfile({ ...profile, email: text })}
            placeholder="contact@business.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}

          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={profile.website || ''}
            onChangeText={(text) => setProfile({ ...profile, website: text })}
            placeholder="https://business.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={profile.socials?.instagram || ''}
            onChangeText={(text) => setProfile({ 
              ...profile, 
              socials: { ...profile.socials, instagram: text } 
            })}
            placeholder="@username"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Facebook</Text>
          <TextInput
            style={styles.input}
            value={profile.socials?.facebook || ''}
            onChangeText={(text) => setProfile({ 
              ...profile, 
              socials: { ...profile.socials, facebook: text } 
            })}
            placeholder="facebook.com/page"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
        </GlassView>

        {/* Location Section */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <Text style={styles.label}>Street Address *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            value={profile.address?.street || ''}
            onChangeText={(text) => setProfile({ 
              ...profile, 
              address: { ...profile.address, street: text } 
            })}
            placeholder="123 Main St"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>City *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            value={profile.address?.city || ''}
            onChangeText={(text) => setProfile({ 
              ...profile, 
              address: { ...profile.address, city: text } 
            })}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                value={profile.address?.state || ''}
                onChangeText={(text) => setProfile({ 
                  ...profile, 
                  address: { ...profile.address, state: text } 
                })}
                placeholder="CA"
                placeholderTextColor={colors.textSecondary}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>ZIP *</Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                value={profile.address?.zip || ''}
                onChangeText={(text) => setProfile({ 
                  ...profile, 
                  address: { ...profile.address, zip: text } 
                })}
                placeholder="12345"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

          <Text style={styles.label}>Service Radius (miles)</Text>
          <TextInput
            style={styles.input}
            value={String(profile.service_radius_miles || 25)}
            onChangeText={(text) => setProfile({ 
              ...profile, 
              service_radius_miles: parseInt(text) || 25 
            })}
            placeholder="25"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
        </GlassView>

        {/* Marketplace Section */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Marketplace</Text>
          
          <Text style={styles.label}>Custom URL Slug *</Text>
          <View style={styles.slugContainer}>
            <TextInput
              style={[styles.input, styles.slugInput, errors.slug && styles.inputError]}
              value={profile.slug || ''}
              onChangeText={(text) => {
                const slug = text.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setProfile({ ...profile, slug });
                checkSlugAvailability(slug);
              }}
              placeholder="my-business"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            {checkingSlug && <ActivityIndicator size="small" color={colors.primary} />}
            {slugAvailable === true && (
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={24}
                color={colors.success}
              />
            )}
            {slugAvailable === false && (
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={24}
                color={colors.error}
              />
            )}
          </View>
          {errors.slug && <Text style={styles.errorText}>{errors.slug}</Text>}
          {slugAvailable === false && (
            <Text style={styles.errorText}>This slug is already taken</Text>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.label}>Published</Text>
            <Switch
              value={profile.is_published}
              onValueChange={(value) => {
                if (value) {
                  handlePublish();
                } else {
                  handleUnpublish();
                }
              }}
              trackColor={{ false: colors.glass, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>

          {profile.is_published && profile.slug && (
            <View style={styles.publishedActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/p/${profile.slug}`)}
              >
                <IconSymbol
                  ios_icon_name="eye"
                  android_material_icon_name="visibility"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.actionButtonText}>View Public Page</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={copyShareLink}
              >
                <IconSymbol
                  ios_icon_name="link"
                  android_material_icon_name="link"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.actionButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassView>

        {/* Preview Button */}
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => router.push('/(provider)/business-profile/preview')}
        >
          <Text style={styles.previewButtonText}>Preview Public Layout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorCard: {
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  errorButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.glass,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unsavedBanner: {
    backgroundColor: colors.primary + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  unsavedText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  slugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slugInput: {
    flex: 1,
  },
  publishedActions: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  previewButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
