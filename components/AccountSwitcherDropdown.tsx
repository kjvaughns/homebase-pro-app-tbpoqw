
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface AccountSwitcherDropdownProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition?: { x: number; y: number };
}

export function AccountSwitcherDropdown({ visible, onClose, anchorPosition }: AccountSwitcherDropdownProps) {
  const { profile, session, switchProfile } = useAuth();
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
      console.log('AccountSwitcher: Checking for existing homes for user:', session.user.id);
      
      // Check if user has any homes (this is what AuthContext checks)
      const { data, error } = await supabase
        .from('homes')
        .select('id')
        .eq('homeowner_id', profile?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('AccountSwitcher: Error checking homes:', error);
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
      
      // Use the AuthContext switchProfile method
      await switchProfile(targetRole);
      
      // Close the dropdown
      onClose();
      
      console.log('=== ACCOUNT SWITCHER: Switch complete ===');
    } catch (error: any) {
      console.error('AccountSwitcher: switchProfile failed', error);
      Alert.alert('Switch Failed', error?.message || 'Please try again.');
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
                      <Text style={styles.optionDescription}>
                        {hasHomeownerProfile ? 'Manage your home services' : 'Create homeowner account'}
                      </Text>
                    </View>
                  </View>
                  {currentRole === 'homeowner' ? (
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                  ) : !hasHomeownerProfile ? (
                    <IconSymbol
                      ios_icon_name="plus.circle.fill"
                      android_material_icon_name="add-circle"
                      size={24}
                      color={colors.primary}
                    />
                  ) : null}
                </GlassView>
              </TouchableOpacity>

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
