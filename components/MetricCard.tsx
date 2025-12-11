
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { GlassView } from './GlassView';
import { IconSymbol } from './IconSymbol';
import { useColorMode } from '@/contexts/ColorModeContext';
import { spacing, borderRadius, textStyles } from '@/theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  iosIcon?: string;
  androidIcon?: string;
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function MetricCard({
  label,
  value,
  iosIcon,
  androidIcon,
  iconColor,
  onPress,
  style,
}: MetricCardProps) {
  const { palette } = useColorMode();
  const iconBgColor = iconColor || palette.primary;

  const content = (
    <GlassView style={[styles.container, style]}>
      <View style={styles.content}>
        {iosIcon && androidIcon && (
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor + '20' }]}>
            <IconSymbol
              ios_icon_name={iosIcon}
              android_material_icon_name={androidIcon}
              size={20}
              color={iconBgColor}
            />
          </View>
        )}
        <Text style={[styles.label, { color: palette.textMuted }]} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.value, { color: palette.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </GlassView>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    minHeight: 120,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  label: {
    ...textStyles.caption,
    marginBottom: spacing.sm,
  },
  value: {
    ...textStyles.title,
  },
});
