
import { Platform } from 'react-native';

// ============================================
// DESIGN TOKENS
// ============================================

// Base brand colors (constant across themes)
export const brandColors = {
  primary: '#0FAF6E',
  primaryDark: '#083322',
  primarySoft: '#0FAF6E40',
  accent: '#00F0FF',
  accentSoft: '#00F0FF40',
};

// Light palette
export const lightPalette = {
  primary: brandColors.primary,
  primarySoft: brandColors.primarySoft,
  background: '#F5F5F7',
  surface: 'rgba(255, 255, 255, 0.95)',
  surfaceAlt: 'rgba(255, 255, 255, 0.7)',
  glass: 'rgba(255, 255, 255, 0.6)',
  glassBorder: 'rgba(0, 0, 0, 0.1)',
  text: '#1C1C1E',
  textMuted: '#8E8E93',
  success: brandColors.primary,
  error: '#FF3B30',
  warning: '#FF9500',
  overlay: 'rgba(0, 0, 0, 0.4)',
  cardBackground: '#FFFFFF',
  inputBackground: 'rgba(0, 0, 0, 0.05)',
  divider: 'rgba(0, 0, 0, 0.1)',
};

// Dark palette
export const darkPalette = {
  primary: brandColors.primary,
  primarySoft: brandColors.primarySoft,
  background: '#050505',
  surface: 'rgba(255, 255, 255, 0.08)',
  surfaceAlt: 'rgba(255, 255, 255, 0.05)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  success: brandColors.primary,
  error: '#FF453A',
  warning: '#FF9F0A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  inputBackground: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.1)',
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

// Border radius scale
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

// Text styles
export const textStyles = {
  heading: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};

// Shadow presets
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
};

// Safe area helpers
export const safeArea = {
  top: Platform.select({
    ios: 60,
    android: 48,
    default: 60,
  }),
  bottom: Platform.select({
    ios: 140,
    android: 120,
    default: 120,
  }),
};

// Export type for palette
export type ColorPalette = typeof lightPalette;
export type ColorMode = 'light' | 'dark';
