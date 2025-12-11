
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  const loadUserData = useCallback(async (userId: string, retries = 3) => {
    try {
      console.log('AuthContext: Loading user data for:', userId);
      
      // Load profile with retries
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
        // Ensure role is exactly "provider" or "homeowner"
        if (!['provider', 'homeowner'].includes(profileData.role)) {
          console.error('AuthContext: Invalid role:', profileData.role);
          profileData.role = 'homeowner'; // Default to homeowner
        }

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
  }, []);

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
  }, [loadUserData]);

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
        
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Invalid Credentials',
            'The email or password you entered is incorrect. Please try again.',
            [{ text: 'OK' }]
          );
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert(
            'Email Not Confirmed',
            'Please check your email and click the confirmation link before logging in.',
            [{ text: 'OK' }]
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
        
        await loadUserData(data.user.id);
        
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
        
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          Alert.alert(
            'Account Already Exists',
            'An account with this email already exists. Please sign in instead.',
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
        
        if (!data.session) {
          Alert.alert(
            'Confirm Your Email',
            'We\'ve sent a confirmation email to ' + email + '. Please click the link to activate your account.',
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
        
        await loadUserData(data.user.id);
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);

        Alert.alert(
          'Account Created!',
          'Your account has been created successfully.',
          [{ 
            text: 'Continue',
            onPress: () => {
              if (role === 'provider') {
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

      await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
      
      setUser(null);
      setProfile(null);
      setOrganization(null);
      setSession(null);
      
      console.log('AuthContext: Logout successful, redirecting to login...');
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

    // Validate target role
    if (!['provider', 'homeowner'].includes(targetRole)) {
      console.error('AuthContext: Invalid target role:', targetRole);
      Alert.alert('Error', 'Invalid role specified.');
      return;
    }

    try {
      console.log('=== AUTH CONTEXT: SWITCH PROFILE START ===');
      console.log('Current role:', profile.role);
      console.log('Target role:', targetRole);
      
      if (profile.role === targetRole) {
        console.log('AuthContext: Already on target role, navigating...');
        if (targetRole === 'provider') {
          router.replace('/(provider)/(tabs)');
        } else {
          router.replace('/(homeowner)/(tabs)');
        }
        return;
      }

      if (targetRole === 'provider') {
        console.log('AuthContext: Switching to provider...');
        
        const { data: existingOrg, error: orgCheckError } = await supabase
          .from('organizations')
          .select('*')
          .eq('owner_id', profile.id)
          .maybeSingle();

        if (orgCheckError) {
          console.error('AuthContext: Error checking organization:', orgCheckError);
          throw orgCheckError;
        }

        if (!existingOrg) {
          Alert.alert(
            'Create Provider Account',
            'You don\'t have a provider account yet. Would you like to create one?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Create Account',
                onPress: async () => {
                  try {
                    const { error: roleError } = await supabase
                      .from('profiles')
                      .update({ role: 'provider', updated_at: new Date().toISOString() })
                      .eq('id', profile.id);

                    if (roleError) throw roleError;

                    await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'provider');

                    const { error: orgError } = await supabase
                      .from('organizations')
                      .insert({
                        owner_id: profile.id,
                        business_name: `${profile.name}'s Business`,
                        onboarding_completed: false,
                      });

                    if (orgError) throw orgError;

                    await loadUserData(session.user.id);
                    router.replace('/(provider)/onboarding/business-basics');
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
        } else if (!existingOrg.onboarding_completed) {
          Alert.alert(
            'Complete Onboarding',
            'Please complete your provider onboarding first.',
            [{ 
              text: 'Continue',
              onPress: async () => {
                try {
                  const { error: roleError } = await supabase
                    .from('profiles')
                    .update({ role: 'provider', updated_at: new Date().toISOString() })
                    .eq('id', profile.id);
                  
                  if (roleError) throw roleError;

                  await AsyncStorage.setItem(ROLE_STORAGE_KEY, 'provider');
                  await loadUserData(session.user.id);
                  router.replace('/(provider)/onboarding/business-basics');
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

      if (targetRole === 'homeowner') {
        console.log('AuthContext: Switching to homeowner...');
      }

      // Switch role directly
      console.log('AuthContext: Switching role directly...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: targetRole, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) {
        console.error('AuthContext: Error updating role:', updateError);
        throw updateError;
      }

      await AsyncStorage.setItem(ROLE_STORAGE_KEY, targetRole);
      await loadUserData(session.user.id);
      
      if (targetRole === 'provider') {
        router.replace('/(provider)/(tabs)');
      } else {
        router.replace('/(homeowner)/(tabs)');
      }

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

  const refreshProfile = useCallback(async () => {
    console.log('AuthContext: Refreshing profile...');
    if (session?.user) {
      await loadUserData(session.user.id);
    }
  }, [session, loadUserData]);

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
