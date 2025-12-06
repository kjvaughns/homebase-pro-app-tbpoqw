
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/app/integrations/supabase/client';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';

export default function PublicBusinessProfile() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (slug) {
      loadProfile();
    }
  }, [slug]);

  const loadProfile = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('org_marketplace_profiles')
        .select('*, organizations(id, business_name)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error || !profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      if (profileData.services_visible && profileData.organization_id) {
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .eq('is_active', true);

        if (servicesData) {
          setServices(servicesData);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (type: 'phone' | 'email' | 'website') => {
    if (type === 'phone' && profile.phone) {
      Linking.openURL(`tel:${profile.phone}`);
    } else if (type === 'email' && profile.email) {
      Linking.openURL(`mailto:${profile.email}`);
    } else if (type === 'website' && profile.website) {
      Linking.openURL(profile.website);
    }
  };

  const handleSocial = (platform: string) => {
    const url = profile.socials?.[platform];
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleBook = () => {
    router.push(`/book/${slug}`);
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
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <IconSymbol
          ios_icon_name="exclamationmark.triangle"
          android_material_icon_name="error"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={[commonStyles.title, { marginTop: 20 }]}>Profile Not Found</Text>
        <Text style={[commonStyles.textSecondary, { textAlign: 'center', marginTop: 12 }]}>
          This business profile doesn't exist or is not published yet.
        </Text>
        <TouchableOpacity
          style={styles.backHomeButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.backHomeButtonText}>Go Home</Text>
        </TouchableOpacity>
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
        {/* Hero Image */}
        {profile.hero_url && (
          <Image source={{ uri: profile.hero_url }} style={styles.heroImage} />
        )}

        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, commonStyles.safeAreaTop]}
        >
          <GlassView style={styles.backButtonGlass}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={colors.text}
            />
          </GlassView>
        </TouchableOpacity>

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
        {profile.services_visible && services.length > 0 && (
          <GlassView style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  )}
                </View>
                {service.price_min && (
                  <Text style={styles.servicePrice}>
                    ${service.price_min}
                    {service.price_max && service.price_max !== service.price_min && 
                      ` - $${service.price_max}`
                    }
                  </Text>
                )}
              </View>
            ))}
          </GlassView>
        )}

        {/* Gallery */}
        {profile.photos && profile.photos.length > 0 && (
          <GlassView style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <View style={styles.gallery}>
              {profile.photos.map((photo: any, index: number) => (
                <Image 
                  key={index} 
                  source={{ uri: photo.url }} 
                  style={styles.galleryImage} 
                />
              ))}
            </View>
          </GlassView>
        )}

        {/* Contact */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactGrid}>
            {profile.phone && (
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleContact('phone')}
              >
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
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleContact('email')}
              >
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
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => handleContact('website')}
              >
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

          {/* Social Links */}
          {profile.socials && Object.keys(profile.socials).length > 0 && (
            <View style={styles.socialLinks}>
              {profile.socials.instagram && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocial('instagram')}
                >
                  <IconSymbol
                    ios_icon_name="camera"
                    android_material_icon_name="photo_camera"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              )}
              {profile.socials.facebook && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleSocial('facebook')}
                >
                  <IconSymbol
                    ios_icon_name="person.2"
                    android_material_icon_name="people"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
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

        {/* Hours */}
        {profile.hours && Object.keys(profile.hours).length > 0 && (
          <GlassView style={styles.section}>
            <Text style={styles.sectionTitle}>Hours</Text>
            {Object.entries(profile.hours).map(([day, hours]: [string, any]) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Text style={styles.hoursText}>
                  {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                </Text>
              </View>
            ))}
          </GlassView>
        )}

        {/* Book Button */}
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
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
  heroImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 20,
    zIndex: 10,
  },
  backButtonGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    marginTop: -50,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.background,
    marginBottom: 16,
  },
  businessName: {
    fontSize: 32,
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryImage: {
    width: '48%',
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
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
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  radiusBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  radiusText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    margin: 20,
    marginTop: 0,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  bookButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  backHomeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    minWidth: 200,
  },
  backHomeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
