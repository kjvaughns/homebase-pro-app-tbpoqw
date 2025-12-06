
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Profile, Organization } from '@/types';
import { supabase } from '@/app/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  switchProfile: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'user_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session?.user?.id || 'none');
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, session?.user?.id || 'none');
      setSession(session);
      
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string, retries = 3) => {
    try {
      console.log('AuthContext: Loading user data for:', userId);
      
      // Load profile with retries (in case trigger hasn't completed yet)
      let profileData = null;
      let profileError = null;
      
      for (let i = 0; i < retries; i++) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        profileData = result.data;
        profileError = result.error;
        
        if (profileData) break;
        
        // Wait a bit before retrying
        if (i < retries - 1) {
          console.log(`AuthContext: Profile not found, retrying... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (profileError && !profileData) {
        console.error('AuthContext: Profile error after retries:', profileError);
        setLoading(false);
        return;
      }

      if (profileData) {
        // Check for persisted role in AsyncStorage
        const storedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
        
        // If stored role differs from profile role, update profile
        if (storedRole && storedRole !== profileData.role && ['provider', 'homeowner'].includes(storedRole)) {
          console.log('AuthContext: Syncing stored role with profile:', storedRole);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: storedRole, updated_at: new Date().toISOString() })
            .eq('id', profileData.id);
          
          if (!updateError) {
            profileData.role = storedRole;
          }
        } else if (profileData.role) {
          // Store current role
          await AsyncStorage.setItem(ROLE_STORAGE_KEY, profileData.role);
        }

        console.log('AuthContext: Profile loaded - Role:', profileData.role, 'ID:', profileData.id);
        setProfile(profileData);
        setUser({
          id: profileData.id,
          email: profileData.email,
          role: profileData.role as UserRole,
          name: profileData.name,
          phone: profileData.phone,
          avatar: profileData.avatar_url,
          createdAt: new Date(profileData.created_at),
        });

        // Load organization if provider
        if (profileData.role === 'provider') {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('owner_id', profileData.id)
            .single();

          if (orgData) {
            console.log('AuthContext: Organization loaded:', orgData.id);
            setOrganization(orgData);
          } else {
            console.log('AuthContext: No organization found for provider');
            setOrganization(null);
          }
        } else {
          setOrganization(null);
        }
      }
    } catch (error) {
      console.error('AuthContext: Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext: Login error:', error);
        
        // Show user-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Invalid Credentials',
            'The email or password you entered is incorrect. Please try again.',
            [{ text: 'OK' }]
          );
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Confirmed',
            'Please check your email and click the confirmation link before logging in. Check your spam folder if you don\'t see it.',
            [
              { text: 'OK' },
              {
                text: 'Resend Email',
                onPress: async () => {
                  const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: email,
                  });
                  if (resendError) {
                    Alert.alert('Error', 'Failed to resend confirmation email. Please try again later.');
                  } else {
                    Alert.alert('Success', 'Confirmation email sent! Please check your inbox.');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Login Failed',
            error.message || 'An error occurred during login. Please try again.',
            [{ text: 'OK' }]
          );
        }
        
        setLoading(false);
        throw error;
      }

      if (data.user && data.session) {
        console.log('AuthContext: Login successful:', data.user.id);
        
        // Wait for user data to load
        await loadUserData(data.user.id);
        
        // Get the loaded profile to determine navigation
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profileData) {
          Alert.alert(
            'Welcome Back!',
            'You have successfully signed in.',
            [{ text: 'OK' }]
          );

          // Navigate based on role
          if (profileData.role === 'provider') {
            router.replace('/(provider)/(tabs)');
          } else {
            router.replace('/(homeowner)/(tabs)');
          }
        }
      }
    } catch (error) {
      console.error('AuthContext: Login exception:', error);
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      console.log('AuthContext: Attempting signup for:', email, 'as', role);
      setLoading(true);
      
      // Sign up the user - the database trigger will create the profile
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        console.error('AuthContext: Signup error:', error);
        
        // Handle specific error cases
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email already exists. Please sign in instead or use a different email address.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Sign In',
                onPress: () => {
                  setLoading(false);
                  router.replace('/auth/login');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Signup Failed',
            error.message || 'An error occurred during signup. Please try again.',
            [{ text: 'OK' }]
          );
        }
        
        setLoading(false);
        throw error;
      }

      if (data.user) {
        console.log('AuthContext: Signup successful:', data.user.id);
        console.log('AuthContext: Session:', data.session ? 'exists' : 'null');
        
        // Check if email confirmation is required
        if (!data.session) {
          // Email confirmation is required
          Alert.alert(
            'Confirm Your Email',
            'We\'ve sent a confirmation email to ' + email + '. Please click the link in the email to activate your account, then return here to sign in.',
            [{ 
              text: 'OK',
              onPress: () => {
                setLoading(false);
                router.replace('/auth/login');
              }
            }]
          );
          return;
        }
        
        // If we have a session, wait for the trigger to create the profile
        await loadUserData(data.user.id);

        // Store initial role
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);

        // Show success alert
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully. Let\'s get you set up!',
          [{ 
            text: 'Continue',
            onPress: () => {
              // Navigate to appropriate onboarding or dashboard
              if (role === 'provider') {
                // Check if onboarding is completed
                supabase
                  .from('organizations')
                  .select('onboarding_completed')
                  .eq('owner_id', data.user.id)
                  .single()
                  .then(({ data: orgData }) => {
                    if (orgData && !orgData.onboarding_completed) {
                      router.replace('/(provider)/onboarding/business-basics');
                    } else {
                      router.replace('/(provider)/(tabs)');
                    }
                  });
              } else {
                router.replace('/(homeowner)/(tabs)');
              }
            }
          }]
        );
      }
    } catch (error) {
      console.error('AuthContext: Signup exception:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out user...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Logout error:', error);
        Alert.alert(
          'Logout Error',
          'There was an error logging out. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Clear stored role
      await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
      
      // Clear local state
      setUser(null);
      setProfile(null);
      setOrganization(null);
      setSession(null);
      
      console.log('AuthContext: Logout successful, redirecting to login...');
      
      // Navigate to login screen
      router.replace('/auth/login');
    } catch (error) {
      console.error('AuthContext: Logout exception:', error);
      Alert.alert(
        'Logout Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const switchProfile = async (targetRole: UserRole) => {
    if (!profile || !session) {
      console.error('AuthContext: No profile or session available');
      Alert.alert('Error', 'Unable to switch profile. Please try logging in again.');
      return;
    }

    try {
      console.log('=== AUTH CONTEXT: SWITCH PROFILE START ===');
      console.log('Current role:', profile.role);
      console.log('Target role:', targetRole);
      
      // If already on the target role, just navigate
      if (profile.role === targetRole) {
        console.log('AuthContext: Already on target role, navigating...');
        if (targetRole === 'provider') {
          router.replace('/(provider)/(tabs)');
        } else {
          router.replace('/(homeowner)/(tabs)');
        }
        return;
      }

      // Check if switching to provider
      if (targetRole === 'provider') {
        console.log('AuthContext: Switching to provider...');
        
        // Check if organization exists
        const { data: existingOrg, error: orgCheckError } = await supabase
          .from('organizations')
          .select('*')
          .eq('owner_id', profile.id)
          .maybeSingle();

        if (orgCheckError) {
          console.error('AuthContext: Error checking organization:', orgCheckError);
          throw orgCheckError;
        }

        console.log('AuthContext: Existing organization:', existingOrg ? 'found' : 'not found');

        if (!existingOrg) {
          // No organization exists, ask to create one
          Alert.alert(
            'Create Provider Account',
            'You don\'t have a provider account yet. Would you like to create one?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Create Account',
                onPress: async () => {
                  try {
                    console.log('AuthContext: Creating provider account...');
                    
                    // Update profile role first
                    const { error: roleError } = await supabase
                      .from('profiles')
                      .update({ role: 'provider', updated_at: new Date().toISOString() })
                      .eq('id', profile.id);

                    if (roleError) {
                      console.error('AuthContext: Error updating role:', roleError);
                      throw roleError;
                    }

                    console.log('AuthContext: Role updated successfully');

                    // Store role
                    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'provider');

                    // Create organization
                    const { error: orgError } = await supabase
                      .from('organizations')
                      .insert({
                        owner_id: profile.id,
                        business_name: `${profile.name}'s Business`,
                        onboarding_completed: false,
                      });

                    if (orgError) {
                      console.error('AuthContext: Error creating organization:', orgError);
                      throw orgError;
                    }

                    console.log('AuthContext: Organization created successfully');

                    // Refresh profile data
                    await loadUserData(session.user.id);

                    console.log('AuthContext: Navigating to onboarding...');
                    // Navigate to onboarding
                    router.replace('/(provider)/onboarding/business-basics');
                    
                    // Small delay to give RoleGuard time to see the new value
                    await new Promise(resolve => setTimeout(resolve, 150));
                  } catch (error: any) {
                    console.error('AuthContext: Error creating provider account:', error);
                    Alert.alert('Error', 'Failed to create provider account. Please try again.');
                  }
                }
              }
            ]
          );
          return;
        } else {
          // Organization exists, check if onboarding is completed
          if (!existingOrg.onboarding_completed) {
            Alert.alert(
              'Complete Onboarding',
              'Please complete your provider onboarding first.',
              [{ 
                text: 'Continue',
                onPress: async () => {
                  try {
                    console.log('AuthContext: Updating role and navigating to onboarding...');
                    
                    // Update role
                    const { error: roleError } = await supabase
                      .from('profiles')
                      .update({ role: 'provider', updated_at: new Date().toISOString() })
                      .eq('id', profile.id);
                    
                    if (roleError) throw roleError;

                    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'provider');
                    await loadUserData(session.user.id);
                    
                    router.replace('/(provider)/onboarding/business-basics');
                    
                    // Small delay to give RoleGuard time to see the new value
                    await new Promise(resolve => setTimeout(resolve, 150));
                  } catch (error: any) {
                    console.error('AuthContext: Error switching to provider:', error);
                    Alert.alert('Error', 'Failed to switch profile. Please try again.');
                  }
                }
              }]
            );
            return;
          }
        }
      }

      // Check if switching to homeowner
      if (targetRole === 'homeowner') {
        console.log('AuthContext: Switching to homeowner...');
        
        const { data: existingHomes, error: homesError } = await supabase
          .from('homes')
          .select('*')
          .eq('homeowner_id', profile.id);

        if (homesError) {
          console.error('AuthContext: Error checking homes:', homesError);
          throw homesError;
        }

        console.log('AuthContext: Existing homes:', existingHomes?.length || 0);

        if (!existingHomes || existingHomes.length === 0) {
          // No homes exist, ask to add one
          Alert.alert(
            'Switch to Homeowner',
            'You don\'t have any homes added yet. Would you like to add your first home or skip for now?',
            [
              { 
                text: 'Skip for Now', 
                onPress: async () => {
                  try {
                    console.log('AuthContext: Skipping home setup, updating role...');
                    
                    // Update role and navigate
                    const { error: roleError } = await supabase
                      .from('profiles')
                      .update({ role: 'homeowner', updated_at: new Date().toISOString() })
                      .eq('id', profile.id);
                    
                    if (roleError) throw roleError;

                    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'homeowner');
                    await loadUserData(session.user.id);
                    
                    router.replace('/(homeowner)/(tabs)');
                    
                    // Small delay to give RoleGuard time to see the new value
                    await new Promise(resolve => setTimeout(resolve, 150));
                  } catch (error: any) {
                    console.error('AuthContext: Error switching to homeowner:', error);
                    Alert.alert('Error', 'Failed to switch profile. Please try again.');
                  }
                }
              },
              {
                text: 'Add Home',
                onPress: async () => {
                  try {
                    console.log('AuthContext: Navigating to add home...');
                    
                    // Update profile role
                    const { error: roleError } = await supabase
                      .from('profiles')
                      .update({ role: 'homeowner', updated_at: new Date().toISOString() })
                      .eq('id', profile.id);

                    if (roleError) throw roleError;

                    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'homeowner');
                    await loadUserData(session.user.id);

                    router.replace('/(homeowner)/onboarding/profile');
                    
                    // Small delay to give RoleGuard time to see the new value
                    await new Promise(resolve => setTimeout(resolve, 150));
                  } catch (error: any) {
                    console.error('AuthContext: Error creating homeowner account:', error);
                    Alert.alert('Error', 'Failed to create homeowner account. Please try again.');
                  }
                }
              }
            ]
          );
          return;
        }
      }

      // If we get here, we can switch directly
      console.log('AuthContext: Switching role directly...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: targetRole, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) {
        console.error('AuthContext: Error updating role:', updateError);
        throw updateError;
      }

      console.log('AuthContext: Role updated successfully');

      // Store role
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, targetRole);

      // Refresh profile data
      await loadUserData(session.user.id);
      
      console.log('AuthContext: Navigating to dashboard...');
      // Navigate to appropriate dashboard
      if (targetRole === 'provider') {
        router.replace('/(provider)/(tabs)');
      } else {
        router.replace('/(homeowner)/(tabs)');
      }

      // Small delay to give RoleGuard time to see the new value
      await new Promise(resolve => setTimeout(resolve, 150));

      Alert.alert(
        'Profile Switched',
        `You are now using your ${targetRole} profile.`,
        [{ text: 'OK' }]
      );
      
      console.log('=== AUTH CONTEXT: SWITCH PROFILE END ===');
    } catch (error: any) {
      console.error('AuthContext: Error switching profile:', error);
      Alert.alert(
        'Switch Failed',
        'Unable to switch profile. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const refreshProfile = async () => {
    console.log('AuthContext: Refreshing profile...');
    if (session?.user) {
      await loadUserData(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        session,
        isAuthenticated: !!user && !!session,
        loading,
        login,
        signup,
        logout,
        updateUser,
        switchProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
</write file>

Now let me also update both settings screens to ensure they're properly handling the logout with better error handling and user feedback:

<write file="app/(provider)/(tabs)/settings.tsx">
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
