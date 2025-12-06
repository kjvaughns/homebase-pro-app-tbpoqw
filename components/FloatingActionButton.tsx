
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';

interface FABAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

export default function FloatingActionButton() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = React.useRef(new Animated.Value(0)).current;

  const actions: FABAction[] = [
    { label: 'Client', icon: 'person-add', route: '/(provider)/clients/add', color: colors.primary },
    { label: 'Job', icon: 'event', route: '/(provider)/schedule/create-job', color: colors.accent },
    { label: 'Invoice', icon: 'receipt', route: '/(provider)/invoices/create', color: colors.warning },
    { label: 'Payment', icon: 'attach-money', route: '/(provider)/payments/quick-link', color: colors.success },
    { label: 'Ask AI', icon: 'auto-awesome', route: '/(provider)/ai-assistant', color: colors.highlight },
  ];

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      friction: 6,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const handleActionPress = (route: string) => {
    toggleMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      {actions.map((action, index) => {
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(index + 1) * 70],
        });

        const opacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });

        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.actionContainer,
              {
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <View style={styles.labelContainer}>
              <BlurView intensity={80} style={styles.labelBlur}>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </BlurView>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={() => handleActionPress(action.route)}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name={action.icon}
                android_material_icon_name={action.icon}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Main FAB Button */}
      <TouchableOpacity
        style={[styles.mainButton, isExpanded && styles.mainButtonExpanded]}
        onPress={toggleMenu}
        activeOpacity={0.9}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg'],
                }),
              },
            ],
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={28}
            color={colors.text}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Backdrop */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1,
  },
  actionContainer: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  labelContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  labelBlur: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  mainButtonExpanded: {
    backgroundColor: colors.error,
  },
});
