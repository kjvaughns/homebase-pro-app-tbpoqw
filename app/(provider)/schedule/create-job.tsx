
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';

type ClientMode = 'existing' | 'new' | null;

export default function CreateJobScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { organization } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [clientMode, setClientMode] = useState<ClientMode>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fix 5.1: Accept preselected date from params
  const preselectedDate = params.date ? new Date(params.date as string) : new Date();

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    service_id: '',
    scheduled_date: preselectedDate,
    scheduled_time: '09:00',
    end_time: '10:00',
    address: '',
    notes: '',
    price: '',
  });

  const loadClientsAndServices = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const [clientsRes, servicesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('organization_id', organization.id)
          .order('name'),
        supabase
          .from('services')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .order('name'),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      // Fix 2.1: Load services for the current organization
      if (servicesRes.data) setServices(servicesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [organization?.id]);

  useEffect(() => {
    loadClientsAndServices();
  }, [loadClientsAndServices]);

  const handleSave = async () => {
    // Validation
    if (clientMode === 'existing' && !formData.client_id) {
      showToast('Please select a client', 'error');
      return;
    }
    if (clientMode === 'new' && !formData.client_name) {
      showToast('Please enter client name', 'error');
      return;
    }
    if (!formData.service_id) {
      showToast('Please select a service', 'error');
      return;
    }
    if (!formData.address) {
      showToast('Please enter an address', 'error');
      return;
    }

    try {
      setLoading(true);

      let clientId = formData.client_id;

      // Fix 3.3: Create new client if needed
      if (clientMode === 'new') {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            organization_id: organization?.id,
            name: formData.client_name,
            email: formData.client_email || null,
            phone: formData.client_phone || null,
            address: formData.client_address || formData.address,
            status: 'active',
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const selectedService = services.find((s) => s.id === formData.service_id);

      const { error } = await supabase.from('bookings').insert({
        organization_id: organization?.id,
        client_id: clientId,
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

      showToast('Job created successfully', 'success');
      router.back();
    } catch (error: any) {
      console.error('Error creating job:', error);
      showToast(error.message || 'Failed to create job', 'error');
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client Mode Selection Modal
  if (clientMode === null) {
    return (
      <View style={commonStyles.container}>
        <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Job</Text>
            <Text style={styles.modalSubtitle}>Choose how to add the client</Text>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setClientMode('existing')}
            >
              <View style={styles.modeIconContainer}>
                <IconSymbol
                  ios_icon_name="person.crop.circle"
                  android_material_icon_name="person"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>Add Existing Client Job</Text>
                <Text style={styles.modeDescription}>Select from your client list</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setClientMode('new')}
            >
              <View style={styles.modeIconContainer}>
                <IconSymbol
                  ios_icon_name="person.crop.circle.badge.plus"
                  android_material_icon_name="person-add"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.modeTextContainer}>
                <Text style={styles.modeTitle}>New Client + Job</Text>
                <Text style={styles.modeDescription}>Create a new client and job</Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );
  }

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
          <Text style={styles.title}>Create Job</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Client Section */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>

          {clientMode === 'existing' ? (
            <React.Fragment>
              <Text style={styles.label}>Search Client *</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                placeholder="Search by name..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <ScrollView style={styles.clientList} nestedScrollEnabled>
                {filteredClients.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[
                      styles.clientItem,
                      formData.client_id === client.id && styles.clientItemSelected,
                    ]}
                    onPress={() => {
                      // Fix 3.2: Auto-fill address from client
                      setFormData({
                        ...formData,
                        client_id: client.id,
                        address: client.address || '',
                      });
                    }}
                  >
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.name}</Text>
                      {client.phone && (
                        <Text style={styles.clientDetail}>{client.phone}</Text>
                      )}
                    </View>
                    {formData.client_id === client.id && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                placeholder="Client name"
                placeholderTextColor={colors.textSecondary}
                value={formData.client_name}
                onChangeText={(text) => setFormData({ ...formData, client_name: text })}
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                value={formData.client_phone}
                onChangeText={(text) => setFormData({ ...formData, client_phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                placeholder="client@example.com"
                placeholderTextColor={colors.textSecondary}
                value={formData.client_email}
                onChangeText={(text) => setFormData({ ...formData, client_email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Client Address</Text>
              <TextInput
                style={[styles.input, styles.textInput]}
                placeholder="123 Main St"
                placeholderTextColor={colors.textSecondary}
                value={formData.client_address}
                onChangeText={(text) => setFormData({ ...formData, client_address: text })}
              />
            </React.Fragment>
          )}
        </GlassView>

        {/* Job Details Section */}
        <GlassView style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>

          <Text style={styles.label}>Service *</Text>
          {/* Fix 2.2: Show services as selectable chips or empty state */}
          {services.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.chip,
                    formData.service_id === service.id && styles.chipSelected,
                  ]}
                  onPress={() => {
                    // Fix 2.3: Set both service_id and default price
                    setFormData({
                      ...formData,
                      service_id: service.id,
                      price: service.price_min?.toString() || '',
                    });
                  }}
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
          ) : (
            <GlassView style={styles.emptyServiceState}>
              <IconSymbol 
                ios_icon_name="wrench.and.screwdriver" 
                android_material_icon_name="build" 
                size={48} 
                color={colors.textSecondary} 
              />
              <Text style={styles.emptyServiceText}>No services yet</Text>
              <TouchableOpacity
                style={styles.addServiceButton}
                onPress={() => router.push('/(provider)/business-profile')}
              >
                <Text style={styles.addServiceButtonText}>Add First Service</Text>
              </TouchableOpacity>
            </GlassView>
          )}

          <Text style={styles.label}>Date *</Text>
          {/* Fix 3.1: Date picker opens on tap */}
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
              {/* Fix 3.1: Time picker opens on tap */}
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

          <Text style={styles.label}>Job Address *</Text>
          <TextInput
            style={[styles.input, styles.textInput]}
            placeholder="Enter job address"
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.glass,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
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
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
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
  emptyServiceState: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyServiceText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  addServiceButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addServiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  clientList: {
    maxHeight: 200,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  clientItemSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
