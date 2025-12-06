
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { Booking } from '@/types';
import * as ImagePicker from 'expo-image-picker';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  const loadBookingDetails = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      if (bookingData.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('id', bookingData.client_id)
          .single();

        setClient(clientData);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('Success', `Booking ${newStatus}`);
      loadBookingDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const handleAddPhotos = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploading(true);
        
        for (const asset of result.assets) {
          const fileName = `${booking?.id}/${Date.now()}.jpg`;
          const formData = new FormData();
          formData.append('file', {
            uri: asset.uri,
            type: 'image/jpeg',
            name: fileName,
          } as any);

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('booking-photos')
            .upload(fileName, formData);

          if (error) throw error;

          // Save file reference to client_files table
          const { data: { publicUrl } } = supabase.storage
            .from('booking-photos')
            .getPublicUrl(fileName);

          await supabase.from('client_files').insert({
            client_id: booking?.client_id,
            organization_id: booking?.organization_id,
            file_name: `Booking Photo - ${new Date().toLocaleDateString()}`,
            file_url: publicUrl,
            file_type: 'image/jpeg',
          });
        }

        Alert.alert('Success', 'Photos uploaded successfully');
      }
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      Alert.alert('Error', error.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => updateStatus('cancelled'), style: 'destructive' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[commonStyles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={commonStyles.text}>Booking not found</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'confirmed': return colors.accent;
      case 'in_progress': return colors.primary;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'blocked': return colors.textSecondary;
      default: return colors.textSecondary;
    }
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
          <Text style={styles.title}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '30' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status.toUpperCase().replace('_', ' ')}
          </Text>
        </View>

        {/* Booking Info */}
        <GlassView style={styles.card}>
          <Text style={styles.serviceName}>{booking.service_name}</Text>
          
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              {new Date(booking.scheduled_date).toLocaleDateString()} at {booking.scheduled_time}
            </Text>
          </View>

          {client && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>{client.name}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location-on"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.infoText}>{booking.address}</Text>
          </View>

          {booking.duration && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="schedule"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>{booking.duration} minutes</Text>
            </View>
          )}

          {booking.price && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="dollarsign.circle"
                android_material_icon_name="attach-money"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>${booking.price}</Text>
            </View>
          )}

          {booking.notes && (
            <>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </>
          )}
        </GlassView>

        {/* Actions */}
        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
          <View style={styles.actions}>
            {booking.status === 'pending' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={() => updateStatus('confirmed')}
              >
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.actionButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}

            {booking.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => updateStatus('in_progress')}
              >
                <IconSymbol
                  ios_icon_name="play.circle"
                  android_material_icon_name="play-circle"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.actionButtonText}>Start</Text>
              </TouchableOpacity>
            )}

            {booking.status === 'in_progress' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={() => updateStatus('completed')}
              >
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.glass }]}
              onPress={handleAddPhotos}
              disabled={uploading}
            >
              <IconSymbol
                ios_icon_name="camera"
                android_material_icon_name="camera-alt"
                size={20}
                color={colors.text}
              />
              <Text style={styles.actionButtonText}>
                {uploading ? 'Uploading...' : 'Add Photos'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleCancel}
            >
              <IconSymbol
                ios_icon_name="xmark.circle"
                android_material_icon_name="cancel"
                size={20}
                color={colors.text}
              />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
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
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    padding: 20,
    marginBottom: 20,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
