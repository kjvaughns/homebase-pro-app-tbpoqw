
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Profile, Organization } from '@/types';
import { supabase } from '@/app/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      await loadUserData(data.user.id);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://natively.dev/email-confirmed',
        data: {
          name,
          role,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          email,
          name,
          role,
        });

      if (profileError) throw profileError;

      // Create organization if provider
      if (role === 'provider') {
        const { error: orgError } = await supabase
          .from('organizations')
          .insert({
            owner_id: data.user.id,
            business_name: `${name}'s Business`,
          });

        if (orgError) throw orgError;
      }

      await loadUserData(data.user.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setSession(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const switchProfile = async (role: UserRole) => {
    if (!profile) return;

    try {
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
    } catch (error) {
      console.error('Error switching profile:', error);
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
