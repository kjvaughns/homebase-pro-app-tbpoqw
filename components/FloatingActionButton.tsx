
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';

interface FABAction {
  label: string;
  iosIcon: string;
  androidIcon: string;
  route: string;
}

export default function FloatingActionButton() {
  const router = useRouter();
  const { profile } = useAuth();
  const segments = useSegments();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Determine if we're in provider or homeowner context
  const isProviderContext = segments[0] === '(provider)' || profile?.role === 'provider';

  const providerActions: FABAction[] = [
    { 
      label: 'Add Client', 
      iosIcon: 'person.badge.plus', 
      androidIcon: 'person_add', 
      route: '/(provider)/clients/add' 
    },
    { 
      label: 'Create Job', 
      iosIcon: 'calendar.badge.plus', 
      androidIcon: 'event', 
      route: '/(provider)/schedule/create-job' 
    },
    { 
      label: 'Send Invoice', 
      iosIcon: 'doc.text', 
      androidIcon: 'receipt', 
      route: '/(provider)/money/create-invoice' 
    },
    { 
      label: 'Broadcast', 
      iosIcon: 'megaphone', 
      androidIcon: 'campaign', 
      route: '/(provider)/broadcast/index' 
    },
    { 
      label: 'Ask AI', 
      iosIcon: 'sparkles', 
      androidIcon: 'auto_awesome', 
      route: '/(provider)/ai-assistant' 
    },
  ];

  const homeownerActions: FABAction[] = [
    { 
      label: 'Find Providers', 
      iosIcon: 'magnifyingglass', 
      androidIcon: 'search', 
      route: '/(homeowner)/(tabs)/marketplace' 
    },
    { 
      label: 'My Bookings', 
      iosIcon: 'calendar', 
      androidIcon: 'event', 
      route: '/(homeowner)/(tabs)/bookings' 
    },
    { 
      label: 'My Homes', 
      iosIcon: 'house', 
      androidIcon: 'home', 
      route: '/(homeowner)/homes/index' 
    },
    { 
      label: 'Ask AI', 
      iosIcon: 'sparkles', 
      androidIcon: 'auto_awesome', 
      route: '/(homeowner)/ai-assistant' 
    },
  ];

  const actions = isProviderContext ? providerActions : homeownerActions;

  const toggleMenu = () => {
    rotation.value = withSpring(isExpanded ? 0 : 45, {
      damping: 15,
      stiffness: 150,
    });
    scale.value = withSpring(isExpanded ? 1 : 0.95, {
      damping: 15,
      stiffness: 150,
    });
    setIsExpanded(!isExpanded);
  };

  const handleActionPress = (route: string) => {
    setIsExpanded(false);
    rotation.value = withSpring(0);
    scale.value = withSpring(1);
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  return (
    <React.Fragment>
      <Modal
        visible={isExpanded}
        transparent
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <BlurView intensity={50} tint="dark" style={styles.blurBackdrop}>
            <View style={styles.menuContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionButton}
                  onPress={() => handleActionPress(action.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionContent}>
                    <View style={styles.actionLabelContainer}>
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </View>
                    <View style={styles.actionIconCircle}>
                      <IconSymbol
                        ios_icon_name={action.iosIcon}
                        android_material_icon_name={action.androidIcon}
                        size={20}
                        color={colors.text}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
      </Animated.View>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    zIndex: 9999,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  blurBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 130,
  },
  menuContainer: {
    width: '85%',
    maxWidth: 340,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionLabelContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
