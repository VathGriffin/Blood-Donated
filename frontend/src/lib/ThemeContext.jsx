'use client';
import { createContext, useMemo, useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '@/lib/theme';

export const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

// The theme itself (palette, type scale, component overrides) lives in lib/theme.js
// and lib/design-tokens.js — this provider only owns the light/dark switch.
export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const stored = localStorage.getItem('mui-theme');
    if (stored) setMode(stored);
  }, []);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('mui-theme', next);
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
