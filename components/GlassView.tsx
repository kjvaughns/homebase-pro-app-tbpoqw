
import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/styles/commonStyles';

interface GlassViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function GlassView({ children, style, intensity = 20 }: GlassViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          borderRadius: 20,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <BlurView intensity={intensity} tint="dark" style={{ flex: 1 }}>
        {children}
      </BlurView>
    </View>
  );
}
