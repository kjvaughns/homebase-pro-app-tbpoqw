
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';

export default function BusinessProfilePreview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!org) return;

      const { data: profileData } = await supabase
        .from('org_marketplace_profiles')
        .select('*')
        .eq('organization_id', org.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>No profile found</Text>
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
          <Text style={styles.headerTitle}>Preview</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Image */}
        {profile.hero_url && (
          <Image source={{ uri: profile.hero_url }} style={styles.heroImage} />
        )}

        {/* Logo & Name */}
        <View style={styles.profileHeader}>
          {profile.logo_url && (
            <Image source={{ uri: profile.logo_url }} style={styles.logo} />
          )}
          <Text style={styles.businessName}>{profile.name}</Text>
          <View style={styles.ratingPlaceholder}>
            <IconSymbol
              ios_icon_name="star.fill"
              android_material_icon_name="star"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.ratingText}>No reviews yet</Text>
          </View>
        </View>

        {/* About */}
        {profile.description && (
          <GlassView style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{profile.description}</Text>
          </GlassView>
        )}

        {/* Services */}
        {profile.services_visible && (
          <GlassView style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <Text style={styles.placeholderText}>Your services will appear here</Text>
          </GlassView>
        )}

        {/* Contact */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactGrid}>
            {profile.phone && (
              <TouchableOpacity style={styles.contactButton}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            {profile.email && (
              <TouchableOpacity style={styles.contactButton}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.contactButtonText}>Email</Text>
              </TouchableOpacity>
            )}
            {profile.website && (
              <TouchableOpacity style={styles.contactButton}>
                <IconSymbol
                  ios_icon_name="globe"
                  android_material_icon_name="language"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.contactButtonText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassView>

        {/* Location */}
        {profile.address && (
          <GlassView style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.addressText}>
              {profile.address.street}
              {'\n'}
              {profile.address.city}, {profile.address.state} {profile.address.zip}
            </Text>
            {profile.service_radius_miles && (
              <View style={styles.radiusBadge}>
                <Text style={styles.radiusText}>
                  Service area: {profile.service_radius_miles} miles
                </Text>
              </View>
            )}
          </GlassView>
        )}

        {/* Book Button */}
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Now</Text>
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
    paddingBottom: 20,
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
  heroImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    marginTop: -40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.background,
    marginBottom: 12,
  },
  businessName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    margin: 20,
    marginTop: 0,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  contactButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  radiusBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
  },
  radiusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginTop: 0,
    alignItems: 'center',
  },
  bookButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
