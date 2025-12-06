
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentLinkScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
  });

  const handleGenerate = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Call edge function to create Stripe Payment Link
      const { data, error } = await supabase.functions.invoke('stripe_payment_link', {
        body: {
          amount: parseFloat(formData.amount),
          description: formData.description || 'Payment',
        },
      });

      if (error) throw error;

      if (data.success) {
        setPaymentLink(data.payment_link_url);

        // Save to payments table
        await supabase.from('payments').insert({
          organization_id: organization?.id,
          amount: parseFloat(formData.amount),
          payment_method: 'stripe_link',
          status: 'pending',
          payment_link_url: data.payment_link_url,
          notes: formData.description,
        });

        Alert.alert('Success', 'Payment link created successfully!');
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      Alert.alert('Error', error.message || 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(paymentLink);
    Alert.alert('Copied!', 'Payment link copied to clipboard');
  };

  const handleShare = () => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Payment Link</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={24}
            color={colors.accent}
          />
          <Text style={styles.infoText}>
            Create a quick payment link to send to clients via text, email, or social media
          </Text>
        </GlassView>

        <GlassView style={styles.form}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountTextInput}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textInput]}
            placeholder="What is this payment for?"
            placeholderTextColor={colors.textSecondary}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
          />

          {!paymentLink ? (
            <TouchableOpacity
              style={[styles.generateButton, loading && styles.generateButtonDisabled]}
              onPress={handleGenerate}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name="link"
                android_material_icon_name="link"
                size={20}
                color={colors.text}
              />
              <Text style={styles.generateButtonText}>
                {loading ? 'Generating...' : 'Generate Payment Link'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.linkContainer}>
              <Text style={styles.linkLabel}>Your Payment Link:</Text>
              <View style={styles.linkBox}>
                <Text style={styles.linkText} numberOfLines={2}>
                  {paymentLink}
                </Text>
              </View>

              <View style={styles.linkActions}>
                <TouchableOpacity style={styles.linkActionButton} onPress={handleCopy}>
                  <IconSymbol
                    ios_icon_name="doc.on.doc"
                    android_material_icon_name="content-copy"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.linkActionText}>Copy Link</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkActionButton} onPress={handleShare}>
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up"
                    android_material_icon_name="share"
                    size={20}
                    color={colors.text}
                  />
                  <Text style={styles.linkActionText}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.newLinkButton}
                onPress={() => {
                  setPaymentLink('');
                  setFormData({ amount: '', description: '' });
                }}
              >
                <Text style={styles.newLinkButtonText}>Create Another Link</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassView>

        <GlassView style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          <Text style={styles.tipText}>• Payment links never expire</Text>
          <Text style={styles.tipText}>• Clients can pay with any credit/debit card</Text>
          <Text style={styles.tipText}>• You&apos;ll be notified when payment is received</Text>
          <Text style={styles.tipText}>• Standard processing fees apply (2.9% + $0.30)</Text>
        </GlassView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  form: {
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  textInput: {
    color: colors.text,
    fontSize: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  linkContainer: {
    marginTop: 24,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  linkBox: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  linkActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  linkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  linkActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  newLinkButton: {
    backgroundColor: colors.glass,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  newLinkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tipsBox: {
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});
