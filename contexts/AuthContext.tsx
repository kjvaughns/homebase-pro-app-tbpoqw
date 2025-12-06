
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Profile, Organization } from '@/types';
import { supabase } from '@/app/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { router } from 'expo-router';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
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

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string, retries = 3) => {
    try {
      console.log('Loading user data for:', userId);
      
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
          console.log(`Profile not found, retrying... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (profileError && !profileData) {
        console.error('Profile error after retries:', profileError);
        setLoading(false);
        return;
      }

      if (profileData) {
        console.log('Profile loaded:', profileData.role);
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
            console.log('Organization loaded:', orgData.id);
            setOrganization(orgData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        
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
        console.log('Login successful:', data.user.id);
        
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
      console.error('Login exception:', error);
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      console.log('Attempting signup for:', email, 'as', role);
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
        console.error('Signup error:', error);
        
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
        console.log('Signup successful:', data.user.id);
        console.log('Session:', data.session ? 'exists' : 'null');
        
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
      console.error('Signup exception:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setOrganization(null);
      setSession(null);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const switchProfile = async (role: UserRole) => {
    if (!profile) return;

    try {
      console.log('Switching profile to:', role);
      
      // Update profile role
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', profile.id);

      if (error) throw error;

      // If switching to provider and no organization exists, create one
      if (role === 'provider') {
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('owner_id', profile.id)
          .single();

        if (!existingOrg) {
          const { error: orgError } = await supabase
            .from('organizations')
            .insert({
              owner_id: profile.id,
              business_name: `${profile.name}'s Business`,
            });

          if (orgError) throw orgError;
        }
      }

      await refreshProfile();
      
      Alert.alert(
        'Profile Switched',
        `You are now using your ${role} profile.`,
        [{ text: 'OK' }]
      );

      // Navigate to appropriate dashboard
      if (role === 'provider') {
        router.replace('/(provider)/(tabs)');
      } else {
        router.replace('/(homeowner)/(tabs)');
      }
    } catch (error) {
      console.error('Error switching profile:', error);
      Alert.alert(
        'Switch Failed',
        'Unable to switch profile. Please try again.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  };

  const refreshProfile = async () => {
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
