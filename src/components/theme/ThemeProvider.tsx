'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  isAfterHours: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [isAfterHours, setIsAfterHours] = useState<boolean>(false);

  useEffect(() => {
    // Read saved theme preference from localStorage if available
    const saved = localStorage.getItem('app_theme_mode') as ThemeMode | null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
      setThemeModeState(saved);
    }
  }, []);

  useEffect(() => {
    const checkTheme = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      // After 18:30 (6:30 PM) or before 06:00 (6 AM) = After hours (Dark mode)
      const afterHours = (currentHour > 18 || (currentHour === 18 && currentMinute >= 30)) || currentHour < 6;
      setIsAfterHours(afterHours);

      let targetTheme: 'light' | 'dark' = 'light';
      if (themeMode === 'auto') {
        targetTheme = afterHours ? 'dark' : 'light';
      } else {
        targetTheme = themeMode;
      }

      setEffectiveTheme(targetTheme);

      const root = document.documentElement;
      if (targetTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    checkTheme();
    const interval = setInterval(checkTheme, 60000); // Check every minute for time change
    return () => clearInterval(interval);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('app_theme_mode', mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, effectiveTheme, setThemeMode, isAfterHours }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
