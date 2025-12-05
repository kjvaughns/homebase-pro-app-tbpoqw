
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { BookingCard } from '@/components/BookingCard';
import { useAuth } from '@/contexts/AuthContext';
import { mockBookings, mockProviders } from '@/data/mockData';
import { IconSymbol } from '@/components/IconSymbol';

export default function HomeownerDashboard() {
  const { user } = useAuth();
  
  const upcomingBookings = mockBookings.filter(b => b.date >= new Date());

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{user?.name || 'Homeowner'}</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0] || 'H'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[commonStyles.glassCard, styles.searchCard]}
        onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
      >
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <Text style={styles.searchText}>Search for services...</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {[
            { name: 'Handyman', icon: '🔧', color: colors.primary },
            { name: 'Cleaning', icon: '🧹', color: colors.accent },
            { name: 'Plumbing', icon: '🚰', color: '#4A90E2' },
            { name: 'Electrical', icon: '⚡', color: '#F5A623' },
            { name: 'HVAC', icon: '❄️', color: '#7ED321' },
            { name: 'Lawn Care', icon: '🌱', color: '#50E3C2' },
          ].map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[commonStyles.glassCard, styles.categoryCard]}
              onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => router.push('/(homeowner)/(tabs)/bookings')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {upcomingBookings.length > 0 ? (
          upcomingBookings.slice(0, 2).map((booking, index) => (
            <BookingCard
              key={index}
              booking={booking}
              providerName={mockProviders.find(p => p.id === booking.providerId)?.businessName}
            />
          ))
        ) : (
          <View style={[commonStyles.glassCard, styles.emptyState]}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="event"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(homeowner)/(tabs)/marketplace')}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Providers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providers}>
          {mockProviders.slice(0, 3).map((provider, index) => (
            <TouchableOpacity key={index} style={[commonStyles.glassCard, styles.providerCard]}>
              <View style={styles.providerAvatar}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.providerName} numberOfLines={1}>
                {provider.businessName}
              </Text>
              <View style={styles.providerRating}>
                <IconSymbol
                  ios_icon_name="star.fill"
                  android_material_icon_name="star"
                  size={12}
                  color={colors.primary}
                />
                <Text style={styles.providerRatingText}>{provider.rating}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
  },
  categories: {
    paddingLeft: 20,
  },
  categoryCard: {
    width: 100,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  providers: {
    paddingLeft: 20,
  },
  providerCard: {
    width: 120,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerRatingText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
});
