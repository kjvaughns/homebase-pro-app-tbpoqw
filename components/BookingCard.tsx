
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { Booking } from '@/types';

interface BookingCardProps {
  booking: Booking;
  providerName?: string;
}

export function BookingCard({ booking, providerName }: BookingCardProps) {
  const statusColor = 
    booking.status === 'confirmed' ? colors.success :
    booking.status === 'pending' ? colors.warning :
    booking.status === 'completed' ? colors.accent :
    colors.error;

  return (
    <View style={[commonStyles.glassCard, styles.card]}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={styles.month}>
            {booking.date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
          </Text>
          <Text style={styles.day}>{booking.date.getDate()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.provider}>{providerName || 'Service Provider'}</Text>
          <View style={styles.timeRow}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.time}>{booking.time}</Text>
          </View>
          <View style={styles.locationRow}>
            <IconSymbol
              ios_icon_name="location.fill"
              android_material_icon_name="location-on"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.address} numberOfLines={1}>{booking.address}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.price}>${booking.price}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  month: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  day: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  provider: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
});
