
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BlockTimeScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [formData, setFormData] = useState({
    scheduled_date: new Date(),
    scheduled_time: '09:00',
    end_time: '17:00',
    notes: '',
  });

  const handleSave = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.from('bookings').insert({
        organization_id: organization?.id,
        service_name: 'Blocked Time',
        scheduled_date: formData.scheduled_date.toISOString().split('T')[0],
        scheduled_time: formData.scheduled_time,
        end_time: formData.end_time,
        address: 'N/A',
        notes: formData.notes,
        status: 'blocked',
        duration: calculateDuration(formData.scheduled_time, formData.end_time),
      });

      if (error) throw error;

      showToast('Time blocked successfully', 'success');
      router.back();
    } catch (error: any) {
      console.error('Error blocking time:', error);
      showToast(error.message || 'Failed to block time', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Block Time</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.form}>
          <View style={styles.infoBox}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Block time on your calendar to prevent bookings during specific periods
            </Text>
          </View>

          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {formData.scheduled_date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.scheduled_date}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setFormData({ ...formData, scheduled_date: date });
              }}
            />
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Time *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.inputText}>{formData.scheduled_time}</Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${formData.scheduled_time}`)}
                  mode="time"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartTimePicker(Platform.OS === 'ios');
                    if (date) setFormData({ ...formData, scheduled_time: formatTime(date) });
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Time *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.inputText}>{formData.end_time}</Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={new Date(`2000-01-01T${formData.end_time}`)}
                  mode="time"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndTimePicker(Platform.OS === 'ios');
                    if (date) setFormData({ ...formData, end_time: formatTime(date) });
                  }}
                />
              )}
            </View>
          </View>

          <Text style={styles.label}>Reason (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textInput, styles.textArea]}
            placeholder="e.g., Lunch break, Personal appointment..."
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={3}
          />
        </GlassView>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Blocking...' : 'Block Time'}
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
    paddingBottom: 120,
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
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  form: {
    padding: 20,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
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
  inputText: {
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
