
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccountSwitcherDropdownProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

export function AccountSwitcherDropdown({ visible, onClose, anchorPosition }: AccountSwitcherDropdownProps) {
  const { profile, session, refreshProfile } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [hasHomeownerProfile, setHasHomeownerProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && session?.user) {
      checkHomeownerProfile();
    }
  }, [visible, session]);

  const checkHomeownerProfile = async () => {
    if (!session?.user) {
      console.log('AccountSwitcher: No session available');
      return;
    }
    
    try {
      setLoading(true);
      console.log('AccountSwitcher: Checking homeowner profile for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('homeowner_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('AccountSwitcher: Error checking homeowner profile:', error);
      }

      const exists = !!data;
      console.log('AccountSwitcher: Homeowner profile exists:', exists);
      setHasHomeownerProfile(exists);
    } catch (error) {
      console.error('AccountSwitcher: Exception checking homeowner profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async (targetRole: 'provider' | 'homeowner') => {
    if (switching || !profile || !session) {
      console.log('AccountSwitcher: Cannot switch - switching:', switching, 'profile:', !!profile, 'session:', !!session);
      return;
    }

    // If already on target role, just close
    if (profile.role === targetRole) {
      console.log('AccountSwitcher: Already on target role:', targetRole);
      onClose();
      return;
    }

    try {
      setSwitching(true);
      console.log('=== ACCOUNT SWITCHER: Starting switch to', targetRole, '===');
      console.log('Current role:', profile.role);
      console.log('Session user ID:', session.user.id);
      console.log('Profile ID:', profile.id);

      // If switching to homeowner and no profile exists, create one
      if (targetRole === 'homeowner' && !hasHomeownerProfile) {
        console.log('AccountSwitcher: Creating homeowner account...');
        
        // Get the current session token
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          throw new Error('No active session found');
        }

        console.log('AccountSwitcher: Session token available:', !!currentSession.access_token);
        
        // Call edge function to create homeowner account
        const { data: createData, error: createError } = await supabase.functions.invoke('create-homeowner-account', {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        });

        if (createError) {
          console.error('AccountSwitcher: Error creating homeowner account:', createError);
          Alert.alert('Error', `Failed to create homeowner account: ${createError.message}`);
          throw createError;
        }

        console.log('AccountSwitcher: Homeowner account created:', createData);
        setHasHomeownerProfile(true);
      }

      // Set the user role via edge function
      console.log('AccountSwitcher: Setting user role to:', targetRole);
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        throw new Error('No active session found');
      }

      const { data: roleData, error: roleError } = await supabase.functions.invoke('set-user-role', {
        body: { role: targetRole },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (roleError) {
        console.error('AccountSwitcher: Error setting user role:', roleError);
        Alert.alert('Error', `Failed to set user role: ${roleError.message}`);
        throw roleError;
      }

      console.log('AccountSwitcher: Role set successfully:', roleData);

      // Persist role to AsyncStorage
      await AsyncStorage.setItem('user_role', targetRole);
      console.log('AccountSwitcher: Role persisted to AsyncStorage');

      // Refresh profile data
      await refreshProfile();
      console.log('AccountSwitcher: Profile refreshed');

      // Close dropdown
      onClose();

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 300));

      // Navigate to appropriate dashboard
      console.log('AccountSwitcher: Navigating to dashboard...');
      if (targetRole === 'provider') {
        router.replace('/(provider)/(tabs)');
      } else {
        router.replace('/(homeowner)/(tabs)');
      }

      // Show success message
      Alert.alert('Success', `Switched to ${targetRole} account`);

      console.log('=== ACCOUNT SWITCHER: Switch complete ===');
    } catch (error: any) {
      console.error('AccountSwitcher: Error switching role:', error);
      Alert.alert(
        'Switch Failed',
        error.message || 'Failed to switch account. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSwitching(false);
    }
  };

  if (!visible) return null;

  const currentRole = profile?.role || 'provider';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <GlassView style={styles.dropdown}>
              <Text style={styles.dropdownTitle}>Switch Account</Text>
              <Text style={styles.dropdownSubtitle}>Choose which account to use</Text>

              {/* Provider Option */}
              <TouchableOpacity
                onPress={() => handleSwitchRole('provider')}
                disabled={switching || loading}
                style={styles.optionButton}
              >
                <GlassView style={[
                  styles.option,
                  currentRole === 'provider' && styles.optionActive
                ]}>
                  <View style={styles.optionLeft}>
                    <IconSymbol
                      ios_icon_name="briefcase.fill"
                      android_material_icon_name="business"
                      size={24}
                      color={currentRole === 'provider' ? colors.primary : colors.text}
                    />
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>Provider</Text>
                      <Text style={styles.optionDescription}>Manage your business</Text>
                    </View>
                  </View>
                  {currentRole === 'provider' && (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                </GlassView>
              </TouchableOpacity>

              {/* Homeowner Option */}
              {hasHomeownerProfile ? (
                <TouchableOpacity
                  onPress={() => handleSwitchRole('homeowner')}
                  disabled={switching || loading}
                  style={styles.optionButton}
                >
                  <GlassView style={[
                    styles.option,
                    currentRole === 'homeowner' && styles.optionActive
                  ]}>
                    <View style={styles.optionLeft}>
                      <IconSymbol
                        ios_icon_name="house.fill"
                        android_material_icon_name="home"
                        size={24}
                        color={currentRole === 'homeowner' ? colors.primary : colors.text}
                      />
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionTitle}>Homeowner</Text>
                        <Text style={styles.optionDescription}>Manage your home services</Text>
                      </View>
                    </View>
                    {currentRole === 'homeowner' && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </GlassView>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleSwitchRole('homeowner')}
                  disabled={switching || loading}
                  style={styles.optionButton}
                >
                  <GlassView style={styles.option}>
                    <View style={styles.optionLeft}>
                      <IconSymbol
                        ios_icon_name="plus.circle.fill"
                        android_material_icon_name="add-circle"
                        size={24}
                        color={colors.primary}
                      />
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionTitle}>Create Homeowner Account</Text>
                        <Text style={styles.optionDescription}>Start managing your home</Text>
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </GlassView>
                </TouchableOpacity>
              )}

              {switching && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Switching account...</Text>
                </View>
              )}

              {loading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              )}

              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </GlassView>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdown: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  dropdownTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  dropdownSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionButton: {
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
