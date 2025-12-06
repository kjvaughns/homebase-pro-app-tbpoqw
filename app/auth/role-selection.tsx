
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

export default function RoleSelectionScreen() {
  return (
    <View style={commonStyles.container}>
      <LinearGradient
        colors={['#050505', '#083322', '#050505']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
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
          <View style={styles.logo}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={48}
              color={colors.primary}
            />
          </View>
          <Text style={styles.brandTitle}>HomeBase Pro</Text>
        </View>

        <Text style={styles.title}>Join HomeBase</Text>
        <Text style={styles.subtitle}>Choose how you&apos;d like to get started</Text>

        <View style={styles.roleCards}>
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/auth/signup?role=homeowner')}
          >
            <View style={styles.roleIcon}>
              <IconSymbol
                ios_icon_name="house.fill"
                android_material_icon_name="home"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={styles.roleTitle}>Homeowner</Text>
            <Text style={styles.roleDescription}>
              Find and book trusted service providers for your home
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.feature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.featureText}>Browse providers</Text>
              </View>
              <View style={styles.feature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.featureText}>Easy booking</Text>
              </View>
              <View style={styles.feature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.featureText}>Secure payments</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => router.push('/auth/signup?role=provider')}
          >
            <View style={styles.roleIcon}>
              <IconSymbol
                ios_icon_name="briefcase.fill"
                android_material_icon_name="work"
                size={32}
                color={colors.accent}
              />
            </View>
            <Text style={styles.roleTitle}>Service Provider</Text>
            <Text style={styles.roleDescription}>
              Grow your business and manage clients with powerful tools
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.feature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.featureText}>Client management</Text>
              </View>
              <View style={styles.feature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.featureText}>Scheduling tools</Text>
              </View>
              <View style={styles.feature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.featureText}>Invoicing & payments</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0px 8px 24px rgba(15, 175, 110, 0.3)',
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  roleCards: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  roleFeatures: {
    width: '100%',
    gap: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});
