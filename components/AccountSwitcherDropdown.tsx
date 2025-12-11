
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Alert } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface AccountSwitcherDropdownProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSwitcherDropdown({ visible, onClose }: AccountSwitcherDropdownProps) {
  const { profile, switchProfile } = useAuth();
  const [hasHomeownerProfile, setHasHomeownerProfile] = useState(false);
  const [hasProviderProfile, setHasProviderProfile] = useState(false);
  const [switching, setSwitching] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const checkHomeownerProfile = useCallback(async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('homes')
      .select('id')
      .eq('homeowner_id', profile.id)
      .limit(1);
    
    setHasHomeownerProfile((data && data.length > 0) || profile.role === 'homeowner');
  }, [profile]);

  const checkProviderProfile = useCallback(async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', profile.id)
      .limit(1);
    
    setHasProviderProfile((data && data.length > 0) || profile.role === 'provider');
  }, [profile]);

  useEffect(() => {
    if (visible) {
      checkHomeownerProfile();
      checkProviderProfile();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, checkHomeownerProfile, checkProviderProfile]);

  const handleSwitch = async (targetRole: 'provider' | 'homeowner') => {
    if (switching) return;
    
    try {
      setSwitching(true);
      console.log('AccountSwitcher: Switching to', targetRole);
      
      // Close modal immediately for better UX
      onClose();
      
      // Call switchProfile from AuthContext
      await switchProfile(targetRole);
      
      console.log('AccountSwitcher: Switch completed');
    } catch (err: any) {
      console.error('AccountSwitcher: Switch failed:', err);
      Alert.alert('Switch Failed', err?.message || 'Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <TouchableOpacity activeOpacity={1}>
            <GlassView style={styles.dropdown}>
              <Text style={styles.title}>Switch Account</Text>
              
              <TouchableOpacity
                style={[
                  styles.option,
                  profile?.role === 'provider' && styles.activeOption,
                ]}
                onPress={() => handleSwitch('provider')}
                disabled={switching}
              >
                <View style={styles.optionLeft}>
                  <IconSymbol 
                    ios_icon_name="briefcase.fill" 
                    android_material_icon_name="business" 
                    size={24} 
                    color={profile?.role === 'provider' ? colors.primary : colors.text} 
                  />
                  <View>
                    <Text style={[
                      styles.optionTitle,
                      profile?.role === 'provider' && styles.activeText,
                    ]}>
                      Provider
                    </Text>
                    <Text style={styles.optionDescription}>
                      {hasProviderProfile ? 'Manage your business' : 'Create provider account'}
                    </Text>
                  </View>
                </View>
                {profile?.role === 'provider' && (
                  <IconSymbol 
                    ios_icon_name="checkmark.circle.fill" 
                    android_material_icon_name="check_circle" 
                    size={24} 
                    color={colors.primary} 
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  profile?.role === 'homeowner' && styles.activeOption,
                ]}
                onPress={() => handleSwitch('homeowner')}
                disabled={switching}
              >
                <View style={styles.optionLeft}>
                  <IconSymbol 
                    ios_icon_name="house.fill" 
                    android_material_icon_name="home" 
                    size={24} 
                    color={profile?.role === 'homeowner' ? colors.primary : colors.text} 
                  />
                  <View>
                    <Text style={[
                      styles.optionTitle,
                      profile?.role === 'homeowner' && styles.activeText,
                    ]}>
                      Homeowner
                    </Text>
                    <Text style={styles.optionDescription}>
                      {hasHomeownerProfile ? 'Manage your homes' : 'Create homeowner account'}
                    </Text>
                  </View>
                </View>
                {profile?.role === 'homeowner' && (
                  <IconSymbol 
                    ios_icon_name="checkmark.circle.fill" 
                    android_material_icon_name="check_circle" 
                    size={24} 
                    color={colors.primary} 
                  />
                )}
              </TouchableOpacity>
            </GlassView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  dropdown: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.glass,
  },
  activeOption: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activeText: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
