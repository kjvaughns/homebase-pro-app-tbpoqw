
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { AccountSwitcherDropdown } from '@/components/AccountSwitcherDropdown';
import { supabase } from '@/app/integrations/supabase/client';

export default function MoreScreen() {
  const router = useRouter();
  const { user, profile, organization, logout } = useAuth();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const [tapCount, setTapCount] = useState(0);
  const [showTestButton, setShowTestButton] = useState(false);

  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount >= 7) {
      setShowTestButton(true);
      Alert.alert('Developer Mode', 'Test profile creation enabled!');
    }
  };

  const createTestProfile = async () => {
    Alert.alert(
      'Create Test Profile',
      'This will create a comprehensive test account with sample data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-test-profile`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                  },
                }
              );

              const result = await response.json();

              if (result.success) {
                Alert.alert(
                  'Test Profile Created! 🎉',
                  `Email: ${result.credentials.email}\nPassword: ${result.credentials.password}\n\nData Created:\n- ${result.data.services_count} Services\n- ${result.data.clients_count} Clients\n- ${result.data.invoices_count} Invoices\n- ${result.data.payments_count} Payments\n- ${result.data.bookings_count} Bookings`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Info', result.error || 'Test profile may already exist');
              }
            } catch (error) {
              console.error('Error creating test profile:', error);
              Alert.alert('Error', 'Failed to create test profile. Check console for details.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              console.log('Settings: Initiating logout...');
              await logout();
              console.log('Settings: Logout completed');
            } catch (error) {
              console.error('Settings: Logout failed:', error);
              setIsLoggingOut(false);
              Alert.alert(
                'Logout Failed',
                'There was an error logging out. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <AccountSwitcherDropdown
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.9}>
          <Image
            source={require('@/assets/images/4d3cae05-9ebb-4fdb-a402-bcee823fa1a2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>More</Text>
      </Animated.View>

      {/* Profile Card */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <View style={styles.section}>
          <GlassView style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'P'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'Provider'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.badge}>
                  <IconSymbol 
                    ios_icon_name={profile?.role === 'provider' ? 'briefcase.fill' : 'house.fill'} 
                    android_material_icon_name={profile?.role === 'provider' ? 'business' : 'home'} 
                    size={12} 
                    color={colors.primary} 
                  />
                  <Text style={styles.badgeText}>{profile?.role?.toUpperCase() || 'PROVIDER'}</Text>
                </View>
              </View>
            </View>
          </GlassView>
        </View>
      </Animated.View>

      {/* Account Switcher */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity onPress={() => setShowAccountSwitcher(true)}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="arrow.left.arrow.right" android_material_icon_name="swap-horiz" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Switch Account</Text>
                  <Text style={styles.settingDescription}>Change between provider and homeowner</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Business Profile */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/business-profile/')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="building.2.fill" android_material_icon_name="business" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Business Profile</Text>
                  <Text style={styles.settingDescription}>Edit your marketplace presence</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Money */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Money</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/money-home/')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach-money" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Money Hub</Text>
                  <Text style={styles.settingDescription}>Revenue, payouts & analytics</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Billing */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/billing/')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="receipt" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Subscription & Billing</Text>
                  <Text style={styles.settingDescription}>Manage your plan and payment methods</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Integrations */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integrations</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/integrations/')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="app.connected.to.app.below.fill" android_material_icon_name="extension" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Integrations</Text>
                  <Text style={styles.settingDescription}>Calendar, QuickBooks, Zapier</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Notifications */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/notifications/')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Notification Settings</Text>
                  <Text style={styles.settingDescription}>Manage push and email notifications</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* About and Legal */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About & Legal</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/support/')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="questionmark.circle.fill" android_material_icon_name="help" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Help & Support</Text>
                  <Text style={styles.settingDescription}>Get help from our team</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('About', 'HomeBase v1.0.0\n\nYour all-in-one home service management platform.')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>About HomeBase</Text>
                  <Text style={styles.settingDescription}>Version and app information</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'View our privacy policy at homebase.app/privacy')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                  <Text style={styles.settingDescription}>How we protect your data</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'View our terms at homebase.app/terms')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="description" size={24} color={colors.primary} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Terms of Service</Text>
                  <Text style={styles.settingDescription}>Legal terms and conditions</Text>
                </View>
              </View>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Test Profile Button (Hidden Developer Feature) */}
      {showTestButton && (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [95, 0] }) }] }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Developer Tools</Text>
            <TouchableOpacity onPress={createTestProfile}>
              <GlassView style={[styles.settingItem, { borderColor: colors.primary + '40', borderWidth: 1 }]}>
                <View style={styles.settingLeft}>
                  <IconSymbol ios_icon_name="hammer.fill" android_material_icon_name="build" size={24} color={colors.primary} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Create Test Profile</Text>
                    <Text style={styles.settingDescription}>Generate demo account with sample data</Text>
                  </View>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
              </GlassView>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Logout */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }] }}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <React.Fragment>
              <IconSymbol ios_icon_name="arrow.right.square.fill" android_material_icon_name="logout" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </React.Fragment>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + '40',
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
