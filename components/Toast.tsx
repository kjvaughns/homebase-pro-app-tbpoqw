
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { GlassView } from '@/components/GlassView';
import { IconSymbol } from '@/components/IconSymbol';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, visible, onHide }: ToastProps) {
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [opacity, translateY, onHide]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY, hideToast]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { ios: 'checkmark.circle.fill', android: 'check-circle', color: colors.primary };
      case 'error':
        return { ios: 'xmark.circle.fill', android: 'error', color: colors.error };
      case 'warning':
        return { ios: 'exclamationmark.triangle.fill', android: 'warning', color: '#FFA500' };
      default:
        return { ios: 'info.circle.fill', android: 'info', color: colors.primary };
    }
  };

  const icon = getIcon();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={hideToast}>
        <GlassView style={styles.toast}>
          <IconSymbol
            ios_icon_name={icon.ios}
            android_material_icon_name={icon.android}
            size={24}
            color={icon.color}
          />
          <Text style={styles.message}>{message}</Text>
        </GlassView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
