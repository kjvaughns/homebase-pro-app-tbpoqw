
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  ios_icon?: string;
  android_icon?: any;
  color?: string;
}

export function StatCard({ title, value, subtitle, ios_icon, android_icon, color = colors.primary }: StatCardProps) {
  return (
    <View style={[commonStyles.glassCard, styles.card]}>
      <View style={styles.header}>
        {ios_icon && android_icon && (
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <IconSymbol
              ios_icon_name={ios_icon}
              android_material_icon_name={android_icon}
              size={24}
              color={color}
            />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    marginHorizontal: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
