
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming 
} from 'react-native-reanimated';

const { height: screenHeight } = Dimensions.get('window');

interface FABAction {
  label: string;
  icon: string;
  route: string;
}

export default function FloatingActionButton() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const actions: FABAction[] = [
    { label: 'Add Client', icon: 'person-add', route: '/(provider)/clients/add' },
    { label: 'Create Job', icon: 'event', route: '/(provider)/schedule/create-job' },
    { label: 'Send Invoice', icon: 'receipt', route: '/(provider)/money/create-invoice' },
    { label: 'Payment Link', icon: 'link', route: '/(provider)/money/payment-link' },
  ];

  const toggleMenu = () => {
    rotation.value = withSpring(isExpanded ? 0 : 45, {
      damping: 15,
      stiffness: 150,
    });
    scale.value = withSpring(isExpanded ? 1 : 0.9, {
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
      {/* Action Menu Modal */}
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
          <BlurView intensity={40} tint="dark" style={styles.blurBackdrop}>
            <View style={styles.menuContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionButton}
                  onPress={() => handleActionPress(action.route)}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={80} tint="dark" style={styles.actionBlur}>
                    <View style={styles.actionContent}>
                      <IconSymbol
                        ios_icon_name={action.icon}
                        android_material_icon_name={action.icon}
                        size={24}
                        color={colors.text}
                      />
                      <Text style={styles.actionLabel}>{action.label}</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* Main FAB Button */}
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
    bottom: 100,
    zIndex: 999,
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
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    maxWidth: 320,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBlur: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
