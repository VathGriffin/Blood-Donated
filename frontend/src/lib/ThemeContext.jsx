'use client';
import { createContext, useMemo, useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from '@/lib/theme';

export const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

// The mode is kept in a cookie so the server can render the right theme on the first
// paint (no light-mode flash for dark-mode users). localStorage is the older store and
// is still read once so existing visitors keep their choice.
export const THEME_COOKIE = 'mui-theme';
const isMode = (m) => m === 'light' || m === 'dark';

function persistMode(mode) {
  try { localStorage.setItem(THEME_COOKIE, mode); } catch { /* storage blocked */ }
  document.cookie = `${THEME_COOKIE}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

// While the class is on <html>, colours cross-fade instead of snapping (see theme.js).
let fadeTimer;
function fadeColors() {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => root.classList.remove('theme-transition'), 320);
}

// The theme itself (palette, type scale, component overrides) lives in lib/theme.js
// and lib/design-tokens.js — this provider only owns the light/dark switch.
export const CustomThemeProvider = ({ initialMode, children }) => {
  const [mode, setMode] = useState(isMode(initialMode) ? initialMode : 'light');

  // Visitors from before the cookie existed: adopt their saved mode and write the cookie.
  useEffect(() => {
    if (isMode(initialMode)) return;
    let stored = null;
    try { stored = localStorage.getItem(THEME_COOKIE); } catch { /* storage blocked */ }
    if (isMode(stored)) {
      setMode(stored);
      persistMode(stored);
    }
  }, [initialMode]);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggleColorMode = useCallback(() => {
    fadeColors();
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      persistMode(next);
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const value = useMemo(() => ({ toggleColorMode, mode }), [toggleColorMode, mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
