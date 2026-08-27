import React, { useEffect, useMemo, useState } from 'react';
import { ThemeContext, type Theme } from './themeContext';

const getInitialTheme = (): Theme => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    root.dataset.theme = theme;
    try {
      localStorage.setItem('struktur-theme', theme);
    } catch {
      // The theme still works when storage is unavailable (for example, in strict privacy mode).
    }

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'light' ? '#F6F3ED' : '#0A0A0A');

    const timeout = window.setTimeout(() => root.classList.remove('theme-transition'), 450);
    return () => window.clearTimeout(timeout);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme: () => setTheme(current => current === 'dark' ? 'light' : 'dark') }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
