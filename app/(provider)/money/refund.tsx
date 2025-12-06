
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

export default function RefundScreen() {
  const router = useRouter();
  const { paymentId, amount: originalAmount } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: originalAmount?.toString() || '',
    reason: '',
  });

  const handleRefund = async () => {
    if (!formData.amount) {
      Alert.alert('Missing Information', 'Please enter refund amount');
      return;
    }

    const refundAmount = parseFloat(formData.amount);
    const maxAmount = parseFloat(originalAmount?.toString() || '0');

    if (refundAmount > maxAmount) {
      Alert.alert('Invalid Amount', 'Refund amount cannot exceed original payment');
      return;
    }

    Alert.alert(
      'Confirm Refund',
      `Are you sure you want to refund $${refundAmount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // Update payment record
              const { error } = await supabase
                .from('payments')
                .update({
                  status: 'refunded',
                  refund_amount: refundAmount,
                  notes: formData.reason,
                })
                .eq('id', paymentId);

              if (error) throw error;

              // In production, you would call Stripe API here to process the refund
              // await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id })

              Alert.alert('Success', 'Refund processed successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Error processing refund:', error);
              Alert.alert('Error', error.message || 'Failed to process refund');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
          <Text style={styles.title}>Process Refund</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.warningCard}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle.fill"
            android_material_icon_name="warning"
            size={32}
            color={colors.warning}
          />
          <Text style={styles.warningText}>
            This action cannot be undone. The refund will be processed immediately.
          </Text>
        </GlassView>

        <GlassView style={styles.form}>
          <Text style={styles.label}>Original Amount</Text>
          <Text style={styles.originalAmount}>${originalAmount}</Text>

          <Text style={styles.label}>Refund Amount *</Text>
          <View style={styles.amountInput}>
            <Text style={styles.amountSymbol}>$</Text>
            <TextInput
              style={styles.amountField}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={styles.fullRefundButton}
            onPress={() => setFormData({ ...formData, amount: originalAmount?.toString() || '' })}
          >
            <Text style={styles.fullRefundText}>Full Refund</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Reason for Refund *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explain why you're issuing this refund..."
            placeholderTextColor={colors.textSecondary}
            value={formData.reason}
            onChangeText={(text) => setFormData({ ...formData, reason: text })}
            multiline
            numberOfLines={4}
          />
        </GlassView>

        <TouchableOpacity
          style={[styles.refundButton, loading && styles.refundButtonDisabled]}
          onPress={handleRefund}
          disabled={loading}
        >
          <Text style={styles.refundButtonText}>
            {loading ? 'Processing...' : 'Process Refund'}
          </Text>
        </TouchableOpacity>
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
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
    lineHeight: 20,
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
  originalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  amountSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    padding: 16,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  fullRefundButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.glass,
    borderRadius: 8,
    marginTop: 8,
  },
  fullRefundText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  refundButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  refundButtonDisabled: {
    opacity: 0.5,
  },
  refundButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
