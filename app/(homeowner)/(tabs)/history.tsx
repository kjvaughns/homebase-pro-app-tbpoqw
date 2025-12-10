
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';

export default function HistoryScreen() {
  return (
    <ScrollView
      style={commonStyles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Service History</Text>
        <Text style={styles.subtitle}>View your past bookings and services</Text>
      </View>

      <GlassView style={styles.emptyCard}>
        <IconSymbol
          ios_icon_name="clock"
          android_material_icon_name="history"
          size={64}
          color={colors.primary}
        />
        <Text style={styles.emptyText}>No History Yet</Text>
        <Text style={styles.emptySubtext}>
          Your completed services will appear here
        </Text>
      </GlassView>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
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
  },
  emptyCard: {
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
