
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';
import { GlassView } from './GlassView';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  ios_icon?: string;
  android_icon?: any;
  color?: string;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  ios_icon, 
  android_icon, 
  color = colors.primary 
}: StatCardProps) {
  return (
    <GlassView style={styles.card}>
      {ios_icon && android_icon && (
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <IconSymbol
            ios_icon_name={ios_icon}
            android_material_icon_name={android_icon}
            size={20}
            color={color}
          />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    marginHorizontal: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.6,
  },
});
