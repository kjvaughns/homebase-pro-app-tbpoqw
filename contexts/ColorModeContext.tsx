
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { lightPalette, darkPalette, ColorPalette, ColorMode } from '@/theme';

const COLOR_MODE_KEY = '@homebase_color_mode';

interface ColorModeContextType {
  colorMode: ColorMode;
  palette: ColorPalette;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>('dark');
  const [isReady, setIsReady] = useState(false);

  // Initialize color mode
  useEffect(() => {
    const initColorMode = async () => {
      try {
        // Try to load saved preference
        const savedMode = await AsyncStorage.getItem(COLOR_MODE_KEY);
        
        if (savedMode === 'light' || savedMode === 'dark') {
          console.log('ColorMode: Loaded saved preference:', savedMode);
          setColorModeState(savedMode);
        } else {
          // Use system appearance if available, otherwise default to dark
          const systemScheme: ColorSchemeName = Appearance.getColorScheme();
          const initialMode: ColorMode = systemScheme === 'light' ? 'light' : 'dark';
          console.log('ColorMode: Using system appearance:', initialMode);
          setColorModeState(initialMode);
          await AsyncStorage.setItem(COLOR_MODE_KEY, initialMode);
        }
      } catch (error) {
        console.error('ColorMode: Error loading preference:', error);
        setColorModeState('dark');
      } finally {
        setIsReady(true);
      }
    };

    initColorMode();
  }, []);

  const setColorMode = async (mode: ColorMode) => {
    try {
      console.log('ColorMode: Setting mode to:', mode);
      setColorModeState(mode);
      await AsyncStorage.setItem(COLOR_MODE_KEY, mode);
    } catch (error) {
      console.error('ColorMode: Error saving preference:', error);
    }
  };

  const toggleColorMode = async () => {
    const newMode: ColorMode = colorMode === 'light' ? 'dark' : 'light';
    await setColorMode(newMode);
  };

  const palette = colorMode === 'light' ? lightPalette : darkPalette;

  // Don't render children until color mode is initialized
  if (!isReady) {
    return null;
  }

  return (
    <ColorModeContext.Provider
      value={{
        colorMode,
        palette,
        toggleColorMode,
        setColorMode,
      }}
    >
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return context;
}
