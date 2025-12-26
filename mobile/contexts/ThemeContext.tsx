import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferencesService } from '../lib/services';

type ThemeMode = 'light' | 'dark' | 'system';

interface Colors {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  card: string;
  tabBarBackground: string;
  tabBarInactive: string;
  inputBackground: string;
}

interface Theme {
  mode: ThemeMode;
  colors: Colors;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const lightColors: Colors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  primary: '#007AFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#FF3B30',
  success: '#34C759',
  card: '#ffffff',
  tabBarBackground: '#f8f8f8',
  tabBarInactive: '#999999',
  inputBackground: '#f0f0f0',
};

const darkColors: Colors = {
  background: '#000000',
  surface: '#1c1c1e',
  primary: '#0A84FF',
  text: '#ffffff',
  textSecondary: '#98989d',
  border: '#38383a',
  error: '#FF453A',
  success: '#32D74B',
  card: '#1c1c1e',
  tabBarBackground: '#1c1c1e',
  tabBarInactive: '#98989d',
  inputBackground: '#38383a',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Fetch preferences to get saved theme
  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesService.getPreferences(),
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: (data: any) => preferencesService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });

  // Sync theme mode from preferences
  useEffect(() => {
    if (preferences?.theme) {
      setThemeModeState(preferences.theme as ThemeMode);
    }
  }, [preferences?.theme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    updatePreferences.mutate({ theme: mode });
  };

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const theme: Theme = {
    mode: themeMode,
    colors: isDark ? darkColors : lightColors,
    isDark,
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
