
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Href } from 'expo-router';
import { useColorMode } from '@/contexts/ColorModeContext';
import { spacing, borderRadius, shadows, textStyles } from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadiusValue?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = screenWidth * 0.9,
  borderRadiusValue = 30,
  bottomMargin = 20
}: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { palette, colorMode } = useColorMode();
  const animatedValue = useSharedValue(0);

  const activeTabIndex = React.useMemo(() => {
    let bestMatch = -1;
    let bestMatchScore = 0;

    tabs.forEach((tab, index) => {
      let score = 0;

      if (pathname === tab.route) {
        score = 100;
      } else if (pathname.startsWith(tab.route as string)) {
        score = 80;
      } else if (pathname.includes(tab.name)) {
        score = 60;
      } else if (tab.route.includes('/(tabs)/') && pathname.includes(tab.route.split('/(tabs)/')[1])) {
        score = 40;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = index;
      }
    });

    return bestMatch >= 0 ? bestMatch : 0;
  }, [pathname, tabs]);

  React.useEffect(() => {
    if (activeTabIndex >= 0) {
      animatedValue.value = withSpring(activeTabIndex, {
        damping: 20,
        stiffness: 120,
        mass: 1,
      });
    }
  }, [activeTabIndex, animatedValue]);

  const handleTabPress = (route: Href) => {
    router.push(route);
  };

  const tabWidthPercent = ((100 / tabs.length) - 1).toFixed(2);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = (containerWidth - 16) / tabs.length;
    return {
      transform: [
        {
          translateX: interpolate(
            animatedValue.value,
            [0, tabs.length - 1],
            [0, tabWidth * (tabs.length - 1)]
          ),
        },
      ],
    };
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={[
        styles.container,
        {
          width: containerWidth,
          marginBottom: bottomMargin
        }
      ]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 100 : 100}
          tint={colorMode === 'light' ? 'light' : 'dark'}
          style={[
            styles.blurContainer, 
            { 
              borderRadius: borderRadiusValue,
              borderColor: palette.glassBorder,
            },
            shadows.xl,
          ]}
        >
          <View style={[
            styles.innerContainer,
            { backgroundColor: palette.surface }
          ]}>
            <Animated.View 
              style={[
                styles.indicator, 
                indicatorStyle, 
                { 
                  width: `${tabWidthPercent}%`,
                  backgroundColor: palette.inputBackground,
                }
              ]} 
            />
            <View style={styles.tabsContainer}>
              {tabs.map((tab, index) => {
                const isActive = activeTabIndex === index;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.tab}
                    onPress={() => handleTabPress(tab.route)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tabContent}>
                      <IconSymbol
                        android_material_icon_name={tab.icon}
                        ios_icon_name={tab.icon}
                        size={24}
                        color={isActive ? palette.primary : palette.text}
                      />
                      <Text
                        style={[
                          styles.tabLabel,
                          { color: isActive ? palette.primary : palette.text },
                          isActive && styles.tabLabelActive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  container: {
    alignSelf: 'center',
  },
  blurContainer: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  innerContainer: {
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    left: 8,
    bottom: 6,
    borderRadius: borderRadius.xxl,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 68,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    ...textStyles.small,
    marginTop: 2,
  },
  tabLabelActive: {
    ...textStyles.smallBold,
  },
});
