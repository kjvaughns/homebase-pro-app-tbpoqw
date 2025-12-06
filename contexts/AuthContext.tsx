
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Profile, Organization } from '@/types';
import { supabase } from '@/app/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native';

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for:', userId);
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
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
        } else {
          Alert.alert(
            'Login Failed',
            error.message || 'An error occurred during login. Please try again.',
            [{ text: 'OK' }]
          );
        }
        
        throw error;
      }

      if (data.user) {
        console.log('Login successful:', data.user.id);
        await loadUserData(data.user.id);
        
        Alert.alert(
          'Welcome Back!',
          'You have successfully signed in.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Login exception:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      console.log('Attempting signup for:', email, 'as', role);
      
      // Sign up the user - no email confirmation required
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
        Alert.alert(
          'Signup Failed',
          error.message || 'An error occurred during signup. Please try again.',
          [{ text: 'OK' }]
        );
        throw error;
      }

      if (data.user) {
        console.log('Signup successful:', data.user.id);
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email,
            name,
            role,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw profileError;
        }

        // Create organization if provider
        if (role === 'provider') {
          const { error: orgError } = await supabase
            .from('organizations')
            .insert({
              owner_id: data.user.id,
              business_name: `${name}'s Business`,
            });

          if (orgError) {
            console.error('Organization creation error:', orgError);
            throw orgError;
          }
        }

        // Show success alert
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully. You can now sign in.',
          [{ text: 'OK' }]
        );

        await loadUserData(data.user.id);
      }
    } catch (error) {
      console.error('Signup exception:', error);
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
        isAuthenticated: !!user,
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
