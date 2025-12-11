
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Animated, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useColorMode } from '@/contexts/ColorModeContext';
import { AccountSwitcherDropdown } from '@/components/AccountSwitcherDropdown';
import { spacing, borderRadius, textStyles, safeArea } from '@/theme';

export default function HomeownerSettingsScreen() {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const { palette, colorMode, toggleColorMode } = useColorMode();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
    <ScrollView 
      style={[styles.container, { backgroundColor: palette.background }]} 
      contentContainerStyle={styles.content}
    >
      <AccountSwitcherDropdown
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Image
          source={require('@/assets/images/4d3cae05-9ebb-4fdb-a402-bcee823fa1a2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: palette.text }]}>Settings</Text>
      </Animated.View>

      {/* Profile Card */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <View style={styles.section}>
          <GlassView style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
                <Text style={[styles.avatarText, { color: palette.text }]}>
                  {user?.name?.[0]?.toUpperCase() || 'H'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: palette.text }]}>
                  {user?.name || 'Homeowner'}
                </Text>
                <Text style={[styles.profileEmail, { color: palette.textMuted }]}>
                  {user?.email}
                </Text>
                <View style={[styles.badge, { backgroundColor: palette.primary + '20' }]}>
                  <IconSymbol 
                    ios_icon_name="house.fill" 
                    android_material_icon_name="home" 
                    size={12} 
                    color={palette.primary} 
                  />
                  <Text style={[styles.badgeText, { color: palette.primary }]}>
                    HOMEOWNER
                  </Text>
                </View>
              </View>
            </View>
          </GlassView>
        </View>
      </Animated.View>

      {/* Appearance */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [25, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Appearance</Text>
          <GlassView style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <IconSymbol 
                ios_icon_name={colorMode === 'light' ? 'sun.max.fill' : 'moon.fill'} 
                android_material_icon_name={colorMode === 'light' ? 'light-mode' : 'dark-mode'} 
                size={24} 
                color={palette.primary} 
              />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: palette.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                  {colorMode === 'dark' ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={colorMode === 'dark'}
              onValueChange={toggleColorMode}
              trackColor={{ false: palette.inputBackground, true: palette.primary }}
              thumbColor={palette.text}
            />
          </GlassView>
        </View>
      </Animated.View>

      {/* Account Switcher */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Account</Text>
          <TouchableOpacity onPress={() => setShowAccountSwitcher(true)}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol 
                  ios_icon_name="arrow.left.arrow.right" 
                  android_material_icon_name="swap-horiz" 
                  size={24} 
                  color={palette.primary} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: palette.text }]}>Switch Account</Text>
                  <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                    Change between provider and homeowner
                  </Text>
                </View>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={palette.textMuted} 
              />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* My Homes */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Properties</Text>
          <TouchableOpacity onPress={() => router.push('/(homeowner)/homes')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol 
                  ios_icon_name="house.fill" 
                  android_material_icon_name="home" 
                  size={24} 
                  color={palette.primary} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: palette.text }]}>My Homes</Text>
                  <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                    Manage your properties
                  </Text>
                </View>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={palette.textMuted} 
              />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Payment Methods */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Payments</Text>
          <TouchableOpacity onPress={() => router.push('/(homeowner)/payment-methods')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol 
                  ios_icon_name="creditcard.fill" 
                  android_material_icon_name="payment" 
                  size={24} 
                  color={palette.primary} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: palette.text }]}>Payment Methods</Text>
                  <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                    Manage cards and payment options
                  </Text>
                </View>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={palette.textMuted} 
              />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Notifications */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Notifications</Text>
          <TouchableOpacity onPress={() => router.push('/(homeowner)/notifications')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol 
                  ios_icon_name="bell.fill" 
                  android_material_icon_name="notifications" 
                  size={24} 
                  color={palette.primary} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: palette.text }]}>Notification Settings</Text>
                  <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                    Manage push and email notifications
                  </Text>
                </View>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={palette.textMuted} 
              />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* About and Legal */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }] }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>About & Legal</Text>
          
          <TouchableOpacity onPress={() => Alert.alert('About', 'HomeBase v1.0.0\n\nYour all-in-one home service management platform.')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol 
                  ios_icon_name="info.circle.fill" 
                  android_material_icon_name="info" 
                  size={24} 
                  color={palette.primary} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: palette.text }]}>About HomeBase</Text>
                  <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                    Version and app information
                  </Text>
                </View>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={palette.textMuted} 
              />
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'View our privacy policy at homebase.app/privacy')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol 
                  ios_icon_name="lock.fill" 
                  android_material_icon_name="lock" 
                  size={24} 
                  color={palette.primary} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: palette.text }]}>Privacy Policy</Text>
                  <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                    How we protect your data
                  </Text>
                </View>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={palette.textMuted} 
              />
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'View our terms at homebase.app/terms')}>
            <GlassView style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <IconSymbol 
                  ios_icon_name="doc.text.fill" 
                  android_material_icon_name="description" 
                  size={24} 
                  color={palette.primary} 
                />
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: palette.text }]}>Terms of Service</Text>
                  <Text style={[styles.settingDescription, { color: palette.textMuted }]}>
                    Legal terms and conditions
                  </Text>
                </View>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={palette.textMuted} 
              />
            </GlassView>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Logout */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] }}>
        <TouchableOpacity 
          style={[
            styles.logoutButton,
            { 
              backgroundColor: palette.surface,
              borderColor: palette.error + '40',
            }
          ]} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={palette.error} />
          ) : (
            <React.Fragment>
              <IconSymbol 
                ios_icon_name="arrow.right.square.fill" 
                android_material_icon_name="logout" 
                size={20} 
                color={palette.error} 
              />
              <Text style={[styles.logoutText, { color: palette.error }]}>Logout</Text>
            </React.Fragment>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: safeArea.top,
    paddingHorizontal: spacing.xl,
    paddingBottom: safeArea.bottom,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.heading,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...textStyles.captionBold,
    marginBottom: spacing.md,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    padding: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.title,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...textStyles.subtitle,
    marginBottom: 4,
  },
  profileEmail: {
    ...textStyles.caption,
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  badgeText: {
    ...textStyles.smallBold,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    marginBottom: spacing.md,
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
    ...textStyles.bodyBold,
    marginBottom: 4,
  },
  settingDescription: {
    ...textStyles.caption,
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  logoutText: {
    ...textStyles.bodyBold,
  },
});
