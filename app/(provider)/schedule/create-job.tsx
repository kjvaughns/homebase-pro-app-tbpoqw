
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateJobScreen() {
  const router = useRouter();
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    scheduled_date: new Date(),
    scheduled_time: '09:00',
    end_time: '10:00',
    address: '',
    notes: '',
    price: '',
  });

  useEffect(() => {
    loadClientsAndServices();
  }, []);

  const loadClientsAndServices = async () => {
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('organization_id', organization?.id)
          .order('name'),
        supabase
          .from('services')
          .select('*')
          .eq('organization_id', organization?.id)
          .eq('is_active', true)
          .order('name'),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.client_id || !formData.service_id) {
      Alert.alert('Missing Information', 'Please select a client and service');
      return;
    }

    try {
      setLoading(true);

      const selectedService = services.find((s) => s.id === formData.service_id);

      const { error } = await supabase.from('bookings').insert({
        organization_id: organization?.id,
        client_id: formData.client_id,
        service_id: formData.service_id,
        service_name: selectedService?.name || 'Service',
        scheduled_date: formData.scheduled_date.toISOString().split('T')[0],
        scheduled_time: formData.scheduled_time,
        end_time: formData.end_time,
        address: formData.address,
        notes: formData.notes,
        price: formData.price ? parseFloat(formData.price) : null,
        status: 'confirmed',
        duration: calculateDuration(formData.scheduled_time, formData.end_time),
      });

      if (error) throw error;

      Alert.alert('Success', 'Job created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating job:', error);
      Alert.alert('Error', error.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
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
          <Text style={styles.title}>Create Job</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassView style={styles.form}>
          <Text style={styles.label}>Client *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={[
                  styles.chip,
                  formData.client_id === client.id && styles.chipSelected,
                ]}
                onPress={() => setFormData({ ...formData, client_id: client.id, address: client.address || '' })}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.client_id === client.id && styles.chipTextSelected,
                  ]}
                >
                  {client.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Service *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.chip,
                  formData.service_id === service.id && styles.chipSelected,
                ]}
                onPress={() =>
                  setFormData({
                    ...formData,
                    service_id: service.id,
                    price: service.price_min?.toString() || '',
                  })
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.service_id === service.id && styles.chipTextSelected,
                  ]}
                >
                  {service.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {formData.scheduled_date.toLocaleDateString()}
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
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.inputText}>{formData.scheduled_time}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Time *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.inputText}>{formData.end_time}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textInput]}
            placeholder="Enter address"
            placeholderTextColor={colors.textSecondary}
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />

          <Text style={styles.label}>Price</Text>
          <TextInput
            style={[styles.input, styles.textInput]}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textInput, styles.textArea]}
            placeholder="Add any notes..."
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
          />
        </GlassView>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Creating...' : 'Create Job'}
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
  chipScroll: {
    marginBottom: 8,
  },
  chip: {
    backgroundColor: colors.glass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
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
  inputText: {
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
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
