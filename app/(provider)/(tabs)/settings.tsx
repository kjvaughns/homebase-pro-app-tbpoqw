
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [publishedToMarketplace, setPublishedToMarketplace] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(provider)/settings/profile')}>
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
        <TouchableOpacity onPress={() => router.push('/(provider)/settings/payment')}>
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
        <TouchableOpacity onPress={() => router.push('/(provider)/settings/billing')}>
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

      {/* Integrations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Google Calendar sync will be available soon!')}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={24} color={colors.warning} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Calendar Sync</Text>
                <Text style={styles.settingDescription}>Connect Google Calendar</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
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

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <TouchableOpacity onPress={() => Alert.alert('Help & Support', 'Contact support at support@homebase.com')}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="questionmark.circle.fill" android_material_icon_name="help" size={24} color={colors.accent} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Text style={styles.settingDescription}>Get help with the app</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('About', 'HomeBase Pro v1.0.0')}>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>About</Text>
                <Text style={styles.settingDescription}>App version and info</Text>
              </View>
            </View>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </GlassView>
        </TouchableOpacity>
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 32,
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
