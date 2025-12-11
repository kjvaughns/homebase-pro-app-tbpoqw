
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorMode } from '@/contexts/ColorModeContext';
import { borderRadius, spacing, shadows } from '@/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function GlassCard({ children, style, elevated = false }: GlassCardProps) {
  const { palette } = useColorMode();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.glassBorder,
        },
        elevated && shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
});
