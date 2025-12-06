
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { AccountSwitcherDropdown } from '@/components/AccountSwitcherDropdown';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.section}>
        <GlassView style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'H'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Homeowner'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.badge}>
                <IconSymbol 
                  ios_icon_name="house.fill" 
                  android_material_icon_name="home" 
                  size={12} 
                  color={colors.primary} 
                />
                <Text style={styles.badgeText}>HOMEOWNER</Text>
              </View>
            </View>
          </View>
        </GlassView>
      </View>

      {/* Account Switcher */}
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

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(homeowner)/profile/edit')}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Edit Profile</Text>
                <Text style={styles.settingDescription}>Update your personal information</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Homes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Homes</Text>
        <TouchableOpacity onPress={() => router.push('/(homeowner)/homes/')}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Manage Homes</Text>
                <Text style={styles.settingDescription}>Add or edit your properties</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <TouchableOpacity onPress={() => router.push('/(homeowner)/payment-methods/')}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="creditcard.fill" android_material_icon_name="credit-card" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Payment Methods</Text>
                <Text style={styles.settingDescription}>Manage your payment options</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Subscriptions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={() => router.push('/(homeowner)/subscriptions/')}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="repeat.circle.fill" android_material_icon_name="autorenew" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>My Subscriptions</Text>
                <Text style={styles.settingDescription}>View recurring services</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => router.push('/(homeowner)/notifications/')}>
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

      {/* About and Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About & Legal</Text>
        <TouchableOpacity onPress={() => Alert.alert('Help & Support', 'Contact us at support@homebase.app')}>
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

      {/* Logout */}
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
