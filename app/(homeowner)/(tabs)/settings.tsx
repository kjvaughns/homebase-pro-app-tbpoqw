
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { GlassView } from '@/components/GlassView';

export default function HomeownerSettings() {
  const { user, profile, logout, switchProfile } = useAuth();
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
          },
        },
      ]
    );
  };

  const handleSwitchProfile = async () => {
    Alert.alert(
      'Switch Profile',
      'Do you want to switch to Provider view or create a Provider profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Provider',
          onPress: async () => {
            try {
              setSwitching(true);
              await switchProfile('provider');
              router.replace('/(provider)/(tabs)/');
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

      <View style={styles.section}>
        <GlassView style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>{user?.name?.[0] || 'H'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.badge}>
                <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={12} color={colors.accent} />
                <Text style={styles.badgeText}>HOMEOWNER</Text>
              </View>
            </View>
          </View>
        </GlassView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        {/* Switch Profile */}
        <TouchableOpacity onPress={handleSwitchProfile} disabled={switching}>
          <GlassView style={styles.menuItem}>
            <IconSymbol
              ios_icon_name="arrow.left.arrow.right"
              android_material_icon_name="swap-horiz"
              size={20}
              color={colors.accent}
            />
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Switch Profile</Text>
              <Text style={styles.menuSubtext}>Toggle between Homeowner and Provider views</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </GlassView>
        </TouchableOpacity>

        <TouchableOpacity style={[commonStyles.glassCard, styles.menuItem]}>
          <IconSymbol
            ios_icon_name="person.fill"
            android_material_icon_name="person"
            size={20}
            color={colors.text}
          />
          <Text style={styles.menuText}>Edit Profile</Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={[commonStyles.glassCard, styles.menuItem]}>
          <IconSymbol
            ios_icon_name="house.fill"
            android_material_icon_name="home"
            size={20}
            color={colors.text}
          />
          <Text style={styles.menuText}>My Homes</Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={[commonStyles.glassCard, styles.menuItem]}>
          <IconSymbol
            ios_icon_name="creditcard.fill"
            android_material_icon_name="payment"
            size={20}
            color={colors.text}
          />
          <Text style={styles.menuText}>Payment Methods</Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <TouchableOpacity style={[commonStyles.glassCard, styles.menuItem]}>
          <IconSymbol
            ios_icon_name="bell.fill"
            android_material_icon_name="notifications"
            size={20}
            color={colors.text}
          />
          <Text style={styles.menuText}>Notifications</Text>
          <IconSymbol
            ios_icon_name="chevron.right"
            android_material_icon_name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[commonStyles.glassCard, styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square.fill"
            android_material_icon_name="logout"
            size={20}
            color={colors.error}
          />
          <Text style={[styles.menuText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
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
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  profileCard: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 28,
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
    backgroundColor: colors.accent + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  menuSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    borderColor: colors.error + '30',
  },
});
