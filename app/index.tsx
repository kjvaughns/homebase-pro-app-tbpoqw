
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function WelcomeScreen() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'provider') {
        router.replace('/(provider)/(tabs)');
      } else {
        router.replace('/(homeowner)/(tabs)');
      }
    }
  }, [isAuthenticated, user]);

  return (
    <View style={[commonStyles.container, styles.container]}>
      <LinearGradient
        colors={['#050505', '#083322', '#050505']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={64}
              color={colors.primary}
            />
          </View>
          <Text style={styles.title}>HomeBase Pro</Text>
          <Text style={styles.tagline}>
            Connect with trusted service providers for all your home needs
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <IconSymbol
              ios_icon_name="checkmark.circle.fill"
              android_material_icon_name="check-circle"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.featureText}>Verified Professionals</Text>
          </View>
          <View style={styles.feature}>
            <IconSymbol
              ios_icon_name="calendar.badge.clock"
              android_material_icon_name="schedule"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.featureText}>Easy Scheduling</Text>
          </View>
          <View style={styles.feature}>
            <IconSymbol
              ios_icon_name="creditcard.fill"
              android_material_icon_name="payment"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.featureText}>Secure Payments</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[buttonStyles.primaryButton, styles.button]}
            onPress={() => router.push('/auth/role-selection')}
          >
            <Text style={buttonStyles.buttonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[buttonStyles.secondaryButton, styles.button]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={buttonStyles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    boxShadow: '0px 8px 24px rgba(15, 175, 110, 0.3)',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
