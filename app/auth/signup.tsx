
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

const HOMEBASE_LOGO = require('@/assets/images/6136aa2f-9e1a-404d-8c64-88ff07e19023.png');

export default function SignupScreen() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const { signup, loading: authLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    // Clear previous errors
    setError('');

    // Validation
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim().toLowerCase(), password, name.trim(), role || 'homeowner');
      // Navigation is handled in the signup function
    } catch (error: any) {
      console.error('Signup error:', error);
      // Error is already shown in Alert by AuthContext
      if (error?.message && !error.message.includes('already')) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || authLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#050505', '#083322', '#050505']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={HOMEBASE_LOGO}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>HomeBase Pro</Text>
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Sign up as a {role === 'provider' ? 'Provider' : 'Homeowner'}
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="error"
              size={20}
              color="#FF6B6B"
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="John Doe"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="john@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              editable={!isLoading}
            />
            <Text style={styles.hint}>Must be at least 6 characters</Text>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primaryButton, styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.text} />
                <Text style={[buttonStyles.buttonText, { marginLeft: 8 }]}>Creating Account...</Text>
              </View>
            ) : (
              <Text style={buttonStyles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.push('/auth/login')}
              disabled={isLoading}
            >
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  button: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  link: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
