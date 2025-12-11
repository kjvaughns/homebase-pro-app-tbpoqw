
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useColorMode } from '@/contexts/ColorModeContext';
import { spacing, borderRadius, textStyles } from '@/theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function SecondaryButton({ label, onPress, loading, disabled, style }: SecondaryButtonProps) {
  const { palette } = useColorMode();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: palette.surface,
          borderColor: palette.glassBorder,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1,
  },
  label: {
    ...textStyles.bodyBold,
  },
});
