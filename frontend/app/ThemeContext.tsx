'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import themesData from './themes.json';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: Record<string, string>;
}

interface ThemeContextType {
  themes: Theme[];
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'fitness-tracker-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themes = themesData.themes as Theme[];
  const defaultTheme = themes[0];
  
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load saved theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedThemeId) {
      const savedTheme = themes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
    setMounted(true);
  }, [themes]);

  // Apply theme CSS variables whenever theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [currentTheme, mounted]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ themes, currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
