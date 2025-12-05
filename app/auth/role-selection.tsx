
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function RoleSelectionScreen() {
  const handleRoleSelect = (role: 'provider' | 'homeowner') => {
    console.log('Role selected:', role);
    router.push({
      pathname: '/auth/signup',
      params: { role },
    });
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
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

      <Text style={styles.title}>Join as a Provider or Homeowner</Text>
      <Text style={styles.subtitle}>Choose the option that best describes you</Text>

      <View style={styles.cards}>
        <TouchableOpacity
          style={[commonStyles.glassCard, styles.card]}
          onPress={() => handleRoleSelect('provider')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <IconSymbol
              ios_icon_name="briefcase.fill"
              android_material_icon_name="work"
              size={48}
              color={colors.primary}
            />
          </View>
          <Text style={styles.cardTitle}>I&apos;m a Provider</Text>
          <Text style={styles.cardDescription}>
            Offer your services and grow your business
          </Text>
          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.benefitText}>Manage bookings</Text>
            </View>
            <View style={styles.benefit}>
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.benefitText}>Track payments</Text>
            </View>
            <View style={styles.benefit}>
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.benefitText}>Build your team</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.glassCard, styles.card]}
          onPress={() => handleRoleSelect('homeowner')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
            <IconSymbol
              ios_icon_name="house.fill"
              android_material_icon_name="home"
              size={48}
              color={colors.accent}
            />
          </View>
          <Text style={styles.cardTitle}>I&apos;m a Homeowner</Text>
          <Text style={styles.cardDescription}>
            Find trusted professionals for your home
          </Text>
          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.benefitText}>Browse providers</Text>
            </View>
            <View style={styles.benefit}>
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.benefitText}>Easy booking</Text>
            </View>
            <View style={styles.benefit}>
              <IconSymbol
                ios_icon_name="checkmark"
                android_material_icon_name="check"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.benefitText}>Secure payments</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  cards: {
    gap: 16,
  },
  card: {
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  benefits: {
    gap: 8,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text,
  },
});
