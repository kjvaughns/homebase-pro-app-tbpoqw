
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, organization, logout, switchProfile } = useAuth();
  const [publishedToMarketplace, setPublishedToMarketplace] = useState(organization?.published_to_marketplace || false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [switching, setSwitching] = useState(false);

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
            await logout();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  const handleSwitchProfile = async () => {
    Alert.alert(
      'Switch Profile',
      'Switch to Homeowner view?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              setSwitching(true);
              await switchProfile('homeowner');
              router.replace('/(homeowner)/(tabs)/');
            } catch (error) {
              Alert.alert('Error', 'Failed to switch profile');
            } finally {
              setSwitching(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/4d3cae05-9ebb-4fdb-a402-bcee823fa1a2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>More</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <GlassView style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'P'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.badge}>
                <IconSymbol ios_icon_name="briefcase.fill" android_material_icon_name="business" size={12} color={colors.primary} />
                <Text style={styles.badgeText}>PROVIDER</Text>
              </View>
            </View>
          </View>
        </GlassView>

        {/* Switch Profile */}
        <TouchableOpacity onPress={handleSwitchProfile} disabled={switching}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="arrow.left.arrow.right" android_material_icon_name="swap-horiz" size={24} color={colors.accent} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Switch Profile</Text>
                <Text style={styles.settingDescription}>Toggle between Homeowner and Provider views</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(provider)/settings/profile' as any)}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="account-circle" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Business Profile</Text>
                <Text style={styles.settingDescription}>Edit business info and logo</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Payment Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payments</Text>
        <TouchableOpacity onPress={() => router.push('/(provider)/settings/payment' as any)}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="creditcard.fill" android_material_icon_name="payment" size={24} color={colors.success} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Payment Settings</Text>
                <Text style={styles.settingDescription}>Stripe Connect & payouts</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(provider)/settings/billing' as any)}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="receipt" size={24} color={colors.accent} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Billing Settings</Text>
                <Text style={styles.settingDescription}>Subscription & invoices</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
      </View>

      {/* Marketplace */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Marketplace</Text>
        <GlassView style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="globe" android_material_icon_name="public" size={24} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Publish to Marketplace</Text>
              <Text style={styles.settingDescription}>
                {publishedToMarketplace ? 'Visible to homeowners' : 'Not visible'}
              </Text>
            </View>
          </View>
          <Switch
            value={publishedToMarketplace}
            onValueChange={setPublishedToMarketplace}
            trackColor={{ false: colors.glass, true: colors.primary }}
            thumbColor={colors.text}
          />
        </GlassView>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <GlassView style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color={colors.accent} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive push notifications</Text>
            </View>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.glass, true: colors.primary }}
            thumbColor={colors.text}
          />
        </GlassView>
        <GlassView style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <IconSymbol ios_icon_name="envelope.fill" android_material_icon_name="email" size={24} color={colors.primary} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive email updates</Text>
            </View>
          </View>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: colors.glass, true: colors.primary }}
            thumbColor={colors.text}
          />
        </GlassView>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <IconSymbol ios_icon_name="arrow.right.square.fill" android_material_icon_name="logout" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    paddingLeft: 4,
  },
  profileCard: {
    padding: 20,
    marginBottom: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
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
    gap: 12,
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
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
