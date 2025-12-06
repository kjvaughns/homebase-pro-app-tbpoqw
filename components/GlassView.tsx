
import React from 'react';
import { View, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/styles/commonStyles';

interface GlassViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function GlassView({ children, style, intensity = 40 }: GlassViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        style,
      ]}
    >
      <BlurView 
        intensity={Platform.OS === 'ios' ? intensity : intensity * 1.5} 
        tint="dark" 
        style={{ flex: 1 }}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}
