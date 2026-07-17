import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    card: string;
    cardBorder: string;
    muted: string;
    mutedForeground: string;
  };
}

export const lightColors = {
  background: '#f8fafc',
  foreground: '#0f172a',
  primary: '#1d4ed8',
  card: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(226, 232, 240, 0.8)',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
};

export const darkColors = {
  background: '#090d16',
  foreground: '#f8fafc',
  primary: '#3b82f6',
  card: 'rgba(17, 24, 39, 0.7)',
  cardBorder: 'rgba(31, 41, 55, 0.6)',
  muted: '#1f2937',
  mutedForeground: '#9ca3af',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemTheme === 'dark' ? 'dark' : 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  const colors = theme === 'light' ? lightColors : darkColors;

  useEffect(() => {
    loadTheme();
  }, []);

  // Sync Android Navigation Bar and Root SystemUI with theme natively
  useEffect(() => {
    const syncBars = async () => {
      try {
        // Use SystemUI to set the absolute root background color (fixes edge-to-edge bleeding)
        await SystemUI.setBackgroundColorAsync(colors.background);
      } catch (e) {}

      if (Platform.OS === 'android') {
        try {
          // Force Navigation Bar icon colors
          await new Promise(resolve => setTimeout(resolve, 50));
          await NavigationBar.setButtonStyleAsync(theme === 'dark' ? 'light' : 'dark');
        } catch (error) {
          console.log("Navbar update failed:", error);
        }
      }
    };
    syncBars();
  }, [theme, colors.background]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      } else if (systemTheme) {
        setTheme(systemTheme);
      }
    } catch (e) {}
    setIsLoaded(true);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (e) {}
  };

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
