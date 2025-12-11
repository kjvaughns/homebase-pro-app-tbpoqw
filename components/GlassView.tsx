
import React from 'react';
import { View, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorMode } from '@/contexts/ColorModeContext';
import { borderRadius, shadows } from '@/theme';

interface GlassViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  elevated?: boolean;
}

export function GlassView({ children, style, intensity = 40, elevated = false }: GlassViewProps) {
  const { palette, colorMode } = useColorMode();

  return (
    <View
      style={[
        {
          backgroundColor: palette.glass,
          borderColor: palette.glassBorder,
          borderWidth: 1,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
        },
        elevated && shadows.md,
        style,
      ]}
    >
      <BlurView 
        intensity={Platform.OS === 'ios' ? intensity : intensity * 1.5} 
        tint={colorMode === 'light' ? 'light' : 'dark'}
        style={{ flex: 1 }}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: colorMode === 'light' 
            ? 'rgba(255, 255, 255, 0.3)' 
            : 'rgba(0, 0, 0, 0.35)',
        }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}
