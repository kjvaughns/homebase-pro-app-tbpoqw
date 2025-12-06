
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

export default function CreateTestProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createTestProfile = async () => {
    setLoading(true);
    setResult(null);

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

      const data = await response.json();
      setResult(data);

      if (data.success) {
        Alert.alert(
          'Test Profile Created Successfully! 🎉',
          `You can now login with these credentials:\n\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Info', data.error || 'Test profile may already exist');
      }
    } catch (error) {
      console.error('Error creating test profile:', error);
      Alert.alert('Error', 'Failed to create test profile. Check console for details.');
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Test Profile</Text>
      </View>

      {/* Info Card */}
      <GlassView style={styles.infoCard}>
        <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={32} color={colors.primary} />
        <Text style={styles.infoTitle}>Test Profile Generator</Text>
        <Text style={styles.infoText}>
          This will create a comprehensive test account with:
        </Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Provider profile with business details</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>5 different services (Plumbing, Electrical, HVAC, etc.)</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>5 test clients with contact information</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>4 invoices (2 paid, 2 outstanding)</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Payment records and payment links</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Scheduled bookings and completed jobs</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Pricing rules and business settings</Text>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Published marketplace profile</Text>
          </View>
        </View>
      </GlassView>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, loading && styles.createButtonDisabled]}
        onPress={createTestProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <IconSymbol ios_icon_name="hammer.fill" android_material_icon_name="build" size={24} color={colors.text} />
            <Text style={styles.createButtonText}>Create Test Profile</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Result Card */}
      {result && (
        <GlassView style={styles.resultCard}>
          {result.success ? (
            <>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={48} color={colors.primary} />
              <Text style={styles.resultTitle}>Success! 🎉</Text>
              <View style={styles.credentialsBox}>
                <Text style={styles.credentialsLabel}>Login Credentials:</Text>
                <Text style={styles.credentialsText}>Email: {result.credentials.email}</Text>
                <Text style={styles.credentialsText}>Password: {result.credentials.password}</Text>
              </View>
              <View style={styles.statsBox}>
                <Text style={styles.statsTitle}>Data Created:</Text>
                <Text style={styles.statsText}>• Organization: {result.data.organization_name}</Text>
                <Text style={styles.statsText}>• Services: {result.data.services_count}</Text>
                <Text style={styles.statsText}>• Clients: {result.data.clients_count}</Text>
                <Text style={styles.statsText}>• Invoices: {result.data.invoices_count}</Text>
                <Text style={styles.statsText}>• Payments: {result.data.payments_count}</Text>
                <Text style={styles.statsText}>• Bookings: {result.data.bookings_count}</Text>
              </View>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.replace('/auth/login')}
              >
                <Text style={styles.loginButtonText}>Go to Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color={colors.error} />
              <Text style={styles.resultTitle}>Error</Text>
              <Text style={styles.errorText}>{result.error}</Text>
            </>
          )}
        </GlassView>
      )}

      {/* Warning */}
      <View style={styles.warningBox}>
        <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={20} color={colors.warning} />
        <Text style={styles.warningText}>
          This is a development tool. The test profile can only be created once. If it already exists, you'll receive an error message with the existing credentials.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  infoCard: {
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  resultCard: {
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 20,
  },
  credentialsBox: {
    width: '100%',
    backgroundColor: colors.glass,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  credentialsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialsText: {
    fontSize: 15,
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  statsBox: {
    width: '100%',
    backgroundColor: colors.glass,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '20',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
});
