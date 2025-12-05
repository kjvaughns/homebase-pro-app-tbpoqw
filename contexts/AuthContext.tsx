
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole) => {
    console.log('Login attempt:', email, role);
    // Mock login - in production, this would call Supabase
    const mockUser: User = {
      id: '1',
      email,
      role,
      name: email.split('@')[0],
      createdAt: new Date(),
    };
    setUser(mockUser);
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    console.log('Signup attempt:', email, name, role);
    // Mock signup - in production, this would call Supabase
    const mockUser: User = {
      id: '1',
      email,
      role,
      name,
      createdAt: new Date(),
    };
    setUser(mockUser);
  };

  const logout = () => {
    console.log('Logout');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
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
